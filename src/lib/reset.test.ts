import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { setupTestSchema } from "../test/pg";

process.env.SESSION_SECRET = "test-secret-for-unit-tests-only";

let db: typeof import("./db").db;
let reset: typeof import("./reset");
let userId = "";

beforeAll(async () => {
  setupTestSchema();
  ({ db } = await import("./db"));
  reset = await import("./reset");
});
afterAll(async () => db.$disconnect());
beforeEach(async () => {
  await db.passwordResetToken.deleteMany();
  await db.user.deleteMany();
  userId = (await db.user.create({ data: { email: "r@x.com", name: "R" } })).id;
});

describe("password reset tokens", () => {
  it("stores only a hash, never the raw token", async () => {
    const raw = await reset.createResetToken(userId);
    const row = await db.passwordResetToken.findFirstOrThrow();
    expect(row.tokenHash).toBe(reset.hashToken(raw));
    expect(row.tokenHash).not.toContain(raw);
    expect((await reset.findValidToken(raw))?.userId).toBe(userId);
  });
  it("replaces earlier tokens when a new one is requested", async () => {
    const a = await reset.createResetToken(userId);
    const b = await reset.createResetToken(userId);
    expect(await reset.findValidToken(a)).toBeNull();
    expect(await reset.findValidToken(b)).not.toBeNull();
  });
  it("rejects expired, used, malformed and suspended-account tokens", async () => {
    const raw = await reset.createResetToken(userId);
    await db.passwordResetToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await reset.findValidToken(raw)).toBeNull();
    await db.passwordResetToken.updateMany({ data: { expiresAt: new Date(Date.now() + 60000), usedAt: new Date() } });
    expect(await reset.findValidToken(raw)).toBeNull();
    await db.passwordResetToken.updateMany({ data: { usedAt: null } });
    expect(await reset.findValidToken(raw)).not.toBeNull();
    await db.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
    expect(await reset.findValidToken(raw)).toBeNull();
    expect(await reset.findValidToken("short")).toBeNull();
    expect(await reset.findValidToken("a".repeat(40))).toBeNull();
  });
});
