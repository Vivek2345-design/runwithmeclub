"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateTempPassword, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { promoteWaitlistIds } from "@/lib/events";
import { eventEmail } from "@/lib/notify";
import { parseIstInput, slugify } from "@/lib/format";
import { requireAdmin, requireStaff } from "@/lib/session";

const IST = "+05:30";
const optText = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
const optNum = (min: number, max: number) => z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().min(min).max(max).nullable());

// ---------- Members ----------

const memberSchema = z.object({
  groupId: optText(40),
  adminNotes: optText(2000),
  role: z.enum(["MEMBER", "COACH", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  plan: z.enum(["FREE", "MEMBER", "ELITE"]).optional(),
  membershipUntil: optText(10),
});

export async function updateMember(id: string, formData: FormData) {
  const staff = await requireStaff();
  const p = memberSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) redirect(`/admin/members/${id}?error=invalid`);
  const d = p.data;
  const data: Record<string, unknown> = { groupId: d.groupId, adminNotes: d.adminNotes };

  // Role, status and plan changes are admin-only.
  if (staff.role === "ADMIN") {
    if (id === staff.id && ((d.role && d.role !== "ADMIN") || d.status === "SUSPENDED")) redirect(`/admin/members/${id}?error=self`);
    if (d.role) data.role = d.role;
    if (d.status) data.status = d.status;
    if (d.plan) data.plan = d.plan;
    data.membershipUntil = d.membershipUntil ? new Date(`${d.membershipUntil}T23:59:59${IST}`) : null;
    if (Number.isNaN((data.membershipUntil as Date | null)?.getTime?.())) redirect(`/admin/members/${id}?error=invalid`);
    if ((d.role && d.role !== "ADMIN") || d.status === "SUSPENDED") {
      const target = await db.user.findUnique({ where: { id } });
      if (target?.role === "ADMIN" && (await db.user.count({ where: { role: "ADMIN", status: "ACTIVE" } })) <= 1) redirect(`/admin/members/${id}?error=last_admin`);
    }
  }
  await db.user.update({ where: { id }, data });
  revalidatePath("/admin", "layout");
  redirect(`/admin/members/${id}?ok=saved`);
}

export type ResetState = { password?: string; error?: string } | null;

export async function resetMemberPassword(id: string, _prev: ResetState): Promise<ResetState> {
  await requireAdmin();
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return { error: "Member not found." };
  const password = generateTempPassword();
  await db.user.update({ where: { id }, data: { passwordHash: hashPassword(password) } });
  return { password };
}

export async function deleteMember(id: string) {
  const admin = await requireAdmin();
  if (id === admin.id) redirect(`/admin/members/${id}?error=self`);
  const target = await db.user.findUnique({ where: { id } });
  if (target?.role === "ADMIN" && (await db.user.count({ where: { role: "ADMIN", status: "ACTIVE" } })) <= 1) redirect(`/admin/members/${id}?error=last_admin`);
  await db.user.delete({ where: { id } });
  revalidatePath("/admin", "layout");
  redirect("/admin/members?ok=deleted");
}

// ---------- Events ----------

const eventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  type: z.enum(["GROUP_RUN", "RACE", "WORKSHOP", "SOCIAL"]),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]),
  startsAt: z.string(),
  endsAt: z.string().optional(),
  location: z.string().trim().min(2).max(200),
  distanceKm: optNum(0, 1000),
  capacity: optNum(1, 100000),
  priceInr: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(0).max(1000000)),
  hue: z.preprocess((v) => Number(v), z.number().int().min(0).max(360)),
  description: z.string().trim().min(10).max(5000),
});

function parseEvent(formData: FormData) {
  const p = eventSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) return null;
  const startsAt = parseIstInput(p.data.startsAt);
  const endsAt = p.data.endsAt ? parseIstInput(p.data.endsAt) : null;
  if (!startsAt || (p.data.endsAt && !endsAt) || (endsAt && endsAt <= startsAt)) return null;
  return { ...p.data, startsAt, endsAt, distanceKm: p.data.distanceKm ?? null, capacity: p.data.capacity === null ? null : Math.round(p.data.capacity) };
}

export async function createEvent(formData: FormData) {
  const staff = await requireStaff();
  const d = parseEvent(formData);
  if (!d) redirect("/admin/events/new?error=invalid");
  let slug = slugify(d.title);
  if (await db.event.findUnique({ where: { slug } })) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  const e = await db.event.create({ data: { ...d, slug, createdById: staff.id } });
  revalidatePath("/events");
  revalidatePath("/");
  redirect(`/admin/events/${e.id}?ok=created`);
}

export async function updateEvent(id: string, formData: FormData) {
  await requireStaff();
  const d = parseEvent(formData);
  if (!d) redirect(`/admin/events/${id}?error=invalid`);
  await db.event.update({ where: { id }, data: d });
  for (const uid of await promoteWaitlistIds(id)) void eventEmail(uid, id, "promoted"); // a larger capacity may free places
  revalidatePath("/events");
  revalidatePath("/");
  redirect(`/admin/events/${id}?ok=updated`);
}

export async function deleteEvent(id: string) {
  await requireStaff();
  await db.event.delete({ where: { id } });
  revalidatePath("/events");
  revalidatePath("/");
  redirect("/admin/events?ok=deleted");
}

export async function toggleCheckIn(regId: string, eventId: string) {
  await requireStaff();
  const r = await db.registration.findUnique({ where: { id: regId } });
  if (!r || r.eventId !== eventId || r.status !== "GOING") return;
  await db.registration.update({ where: { id: regId }, data: { checkedInAt: r.checkedInAt ? null : new Date() } });
  revalidatePath(`/admin/events/${eventId}`);
}

export async function removeRegistration(regId: string, eventId: string) {
  await requireStaff();
  const r = await db.registration.findUnique({ where: { id: regId } });
  if (!r || r.eventId !== eventId) return;
  await db.registration.update({ where: { id: regId }, data: { status: "CANCELLED", checkedInAt: null } });
  if (r.status === "GOING") for (const uid of await promoteWaitlistIds(eventId)) void eventEmail(uid, eventId, "promoted");
  revalidatePath(`/admin/events/${eventId}`);
}

// ---------- Training plans ----------

const workoutSchema = z.object({
  target: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().min(1).max(120),
  sportType: z.enum(["Run", "Ride", "Swim", "Walk", "Workout"]),
  description: optText(2000),
  plannedDistance: optNum(0, 1000),
  plannedMinutes: optNum(0, 1440),
});

/** target = "all" | "group:<id>" | "user:<id>" */
export async function assignWorkout(formData: FormData) {
  const staff = await requireStaff();
  const p = workoutSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) redirect("/admin/workouts?error=invalid");
  const w = p.data;
  const [kind, tid] = w.target.split(":");
  const where =
    w.target === "all" ? { status: "ACTIVE" } : kind === "group" ? { status: "ACTIVE", groupId: tid } : kind === "user" ? { id: tid, status: "ACTIVE" } : null;
  if (!where) redirect("/admin/workouts?error=invalid");
  const users = await db.user.findMany({ where, select: { id: true } });
  if (users.length === 0) redirect("/admin/workouts?error=not_found");
  await db.workout.createMany({
    data: users.map((u) => ({
      userId: u.id, authorId: staff.id, date: new Date(`${w.date}T00:00:00${IST}`), title: w.title, sportType: w.sportType,
      description: w.description, plannedDistance: w.plannedDistance ? w.plannedDistance * 1000 : null, plannedMinutes: w.plannedMinutes ? Math.round(w.plannedMinutes) : null,
    })),
  });
  revalidatePath("/admin/workouts");
  redirect(`/admin/workouts?ok=created`);
}

export async function deleteWorkout(id: string) {
  await requireStaff();
  await db.workout.deleteMany({ where: { id } });
  revalidatePath("/admin/workouts");
  revalidatePath("/admin/members", "layout");
}

// ---------- Groups ----------

const groupSchema = z.object({ name: z.string().trim().min(2).max(50), description: optText(300), paceLabel: optText(40), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).catch("#F2541B") });

export async function createGroup(formData: FormData) {
  await requireStaff();
  const p = groupSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) redirect("/admin/groups?error=invalid");
  if (await db.group.findUnique({ where: { name: p.data.name } })) redirect("/admin/groups?error=invalid");
  await db.group.create({ data: p.data });
  revalidatePath("/admin/groups");
  redirect("/admin/groups?ok=created");
}

export async function deleteGroup(id: string) {
  await requireStaff();
  await db.group.delete({ where: { id } });
  revalidatePath("/admin", "layout");
  redirect("/admin/groups?ok=deleted");
}

// ---------- Challenges ----------

const challengeSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(5).max(1000),
  metric: z.enum(["DISTANCE", "ELEVATION", "ACTIVITIES", "TIME"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clubTarget: optNum(1, 10000000),
});

export async function createChallenge(formData: FormData) {
  await requireStaff();
  const p = challengeSchema.safeParse(Object.fromEntries(formData));
  if (!p.success || p.data.endDate < p.data.startDate) redirect("/admin/challenges?error=invalid");
  const { startDate, endDate, ...rest } = p.data;
  await db.challenge.create({ data: { ...rest, startDate: new Date(`${startDate}T00:00:00${IST}`), endDate: new Date(`${endDate}T23:59:59${IST}`) } });
  revalidatePath("/admin/challenges");
  redirect("/admin/challenges?ok=created");
}

export async function deleteChallenge(id: string) {
  await requireStaff();
  await db.challenge.delete({ where: { id } });
  revalidatePath("/admin/challenges");
  redirect("/admin/challenges?ok=deleted");
}

// ---------- Announcements ----------

const announcementSchema = z.object({ title: z.string().trim().min(3).max(120), body: z.string().trim().min(5).max(5000), pinned: z.string().optional(), isPublic: z.string().optional() });

export async function createAnnouncement(formData: FormData) {
  const staff = await requireStaff();
  const p = announcementSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) redirect("/admin/announcements?error=invalid");
  await db.announcement.create({ data: { title: p.data.title, body: p.data.body, pinned: p.data.pinned === "on", isPublic: p.data.isPublic === "on", authorId: staff.id } });
  revalidatePath("/", "layout");
  redirect("/admin/announcements?ok=published");
}

export async function togglePin(id: string) {
  await requireStaff();
  const a = await db.announcement.findUnique({ where: { id } });
  if (a) await db.announcement.update({ where: { id }, data: { pinned: !a.pinned } });
  revalidatePath("/", "layout");
}

export async function deleteAnnouncement(id: string) {
  await requireStaff();
  await db.announcement.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/admin/announcements?ok=deleted");
}

// ---------- Messages ----------

export async function setMessageStatus(id: string, status: string) {
  await requireStaff();
  const s = z.enum(["NEW", "READ", "ARCHIVED"]).parse(status);
  await db.contactMessage.update({ where: { id }, data: { status: s } });
  revalidatePath("/admin", "layout");
}

export async function deleteMessage(id: string) {
  await requireStaff();
  await db.contactMessage.delete({ where: { id } });
  revalidatePath("/admin", "layout");
}
