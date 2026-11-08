import { db } from "./db";

export type RsvpResult = "going" | "waitlist" | "closed" | "not_found";

/** Registers a member, or waitlists them when the event is full. Safe to call twice. */
export async function register(eventId: string, userId: string): Promise<RsvpResult> {
  return db.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) return "not_found";
    if (event.status !== "PUBLISHED" || event.startsAt.getTime() < Date.now()) return "closed";

    const existing = await tx.registration.findUnique({ where: { eventId_userId: { eventId, userId } } });
    if (existing && existing.status !== "CANCELLED") return existing.status === "GOING" ? "going" : "waitlist";

    const going = await tx.registration.count({ where: { eventId, status: "GOING" } });
    const status = event.capacity !== null && going >= event.capacity ? "WAITLIST" : "GOING";
    await tx.registration.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status },
      update: { status, checkedInAt: null, createdAt: new Date() },
    });
    return status === "GOING" ? "going" : "waitlist";
  });
}

/** Cancels a registration and, if that freed a place, promotes the earliest waitlisted member. Returns the promoted user ids. */
export async function cancelRegistration(eventId: string, userId: string): Promise<string[]> {
  return db.$transaction(async (tx) => {
    const reg = await tx.registration.findUnique({ where: { eventId_userId: { eventId, userId } } });
    if (!reg || reg.status === "CANCELLED") return [];
    await tx.registration.update({ where: { id: reg.id }, data: { status: "CANCELLED", checkedInAt: null } });
    return reg.status === "GOING" ? promoteWaitlistIds(eventId, tx) : [];
  });
}

type Tx = Pick<typeof db, "event" | "registration">;

export async function promoteWaitlist(eventId: string, tx: Tx = db): Promise<number> {
  return (await promoteWaitlistIds(eventId, tx)).length;
}

/** Moves waitlisted members into any free places, oldest first. Returns who was promoted. */
export async function promoteWaitlistIds(eventId: string, tx: Tx = db): Promise<string[]> {
  const event = await tx.event.findUnique({ where: { id: eventId } });
  if (!event) return [];
  const promoted: string[] = [];
  for (;;) {
    const going = await tx.registration.count({ where: { eventId, status: "GOING" } });
    if (event.capacity !== null && going >= event.capacity) break;
    const next = await tx.registration.findFirst({ where: { eventId, status: "WAITLIST" }, orderBy: { createdAt: "asc" } });
    if (!next) break;
    await tx.registration.update({ where: { id: next.id }, data: { status: "GOING" } });
    promoted.push(next.userId);
  }
  return promoted;
}
