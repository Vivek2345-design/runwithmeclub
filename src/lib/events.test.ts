import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { setupTestSchema } from "../test/pg";

process.env.SESSION_SECRET = "test-secret-for-unit-tests-only";

let db: typeof import("./db").db;
let ev: typeof import("./events");

beforeAll(async () => {
  setupTestSchema();
  ({ db } = await import("./db"));
  ev = await import("./events");
});
afterAll(async () => {
  await db.$disconnect();
});

let users: string[] = [];
let eventId = "";

async function setup(capacity: number | null, startsInMs = 86400000, status = "PUBLISHED") {
  await db.registration.deleteMany();
  await db.event.deleteMany();
  await db.user.deleteMany();
  users = [];
  for (let i = 0; i < 4; i++) users.push((await db.user.create({ data: { email: `u${i}@x.com`, name: `User ${i}` } })).id);
  eventId = (await db.event.create({ data: { slug: "e", title: "E", description: "d".repeat(10), location: "L", startsAt: new Date(Date.now() + startsInMs), capacity, status } })).id;
}
const status = async (i: number) => (await db.registration.findUnique({ where: { eventId_userId: { eventId, userId: users[i] } } }))?.status;
beforeEach(() => setup(2));

describe("register", () => {
  it("fills places, then waitlists", async () => {
    expect(await ev.register(eventId, users[0])).toBe("going");
    expect(await ev.register(eventId, users[1])).toBe("going");
    expect(await ev.register(eventId, users[2])).toBe("waitlist");
    expect(await status(2)).toBe("WAITLIST");
  });
  it("is idempotent", async () => {
    await ev.register(eventId, users[0]);
    expect(await ev.register(eventId, users[0])).toBe("going");
    expect(await db.registration.count({ where: { eventId } })).toBe(1);
  });
  it("has no limit when capacity is null", async () => {
    await setup(null);
    for (const u of users) expect(await ev.register(eventId, u)).toBe("going");
  });
  it("refuses past, cancelled and draft events, and unknown ids", async () => {
    await setup(5, -3600000);
    expect(await ev.register(eventId, users[0])).toBe("closed");
    await setup(5, 86400000, "CANCELLED");
    expect(await ev.register(eventId, users[0])).toBe("closed");
    await setup(5, 86400000, "DRAFT");
    expect(await ev.register(eventId, users[0])).toBe("closed");
    expect(await ev.register("nope", users[0])).toBe("not_found");
  });
  it("lets a member re-register after cancelling", async () => {
    await ev.register(eventId, users[0]);
    await ev.cancelRegistration(eventId, users[0]);
    expect(await status(0)).toBe("CANCELLED");
    expect(await ev.register(eventId, users[0])).toBe("going");
  });
});

describe("cancelRegistration", () => {
  it("promotes the earliest waitlisted member when a place frees up", async () => {
    await ev.register(eventId, users[0]);
    await ev.register(eventId, users[1]);
    await ev.register(eventId, users[2]); // waitlist
    await new Promise((r) => setTimeout(r, 5));
    await ev.register(eventId, users[3]); // waitlist, later
    await ev.cancelRegistration(eventId, users[0]);
    expect(await status(2)).toBe("GOING");
    expect(await status(3)).toBe("WAITLIST");
  });
  it("does not promote anyone when a waitlisted member cancels", async () => {
    await ev.register(eventId, users[0]);
    await ev.register(eventId, users[1]);
    await ev.register(eventId, users[2]);
    await ev.cancelRegistration(eventId, users[2]);
    expect(await status(0)).toBe("GOING");
    expect(await status(1)).toBe("GOING");
  });
  it("promoteWaitlist fills several places after capacity grows", async () => {
    for (const u of users) await ev.register(eventId, u);
    await db.event.update({ where: { id: eventId }, data: { capacity: 4 } });
    expect(await ev.promoteWaitlist(eventId)).toBe(2);
    expect(await status(3)).toBe("GOING");
  });
});
