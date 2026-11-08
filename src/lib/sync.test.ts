import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { setupTestSchema } from "../test/pg";

// Integration test: real Postgres (isolated schema), Strava HTTP calls mocked.
process.env.SESSION_SECRET = "test-secret-for-unit-tests-only";
process.env.STRAVA_CLIENT_ID = "1";
process.env.STRAVA_CLIENT_SECRET = "s";

type Db = typeof import("./db").db;
let db: Db;
let sync: typeof import("./sync");
let crypto: typeof import("./crypto");

const act = (id: number, daysAgo: number, extra: object = {}) => ({
  id,
  name: `Run ${id}`,
  sport_type: "Run",
  start_date: new Date(Date.now() - daysAgo * 86400e3).toISOString(),
  distance: 10000,
  moving_time: 3000,
  elapsed_time: 3100,
  total_elevation_gain: 50,
  average_heartrate: 150,
  ...extra,
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeAll(async () => {
  setupTestSchema();
  ({ db } = await import("./db"));
  sync = await import("./sync");
  crypto = await import("./crypto");
});

afterAll(async () => {
  await db.$disconnect();
});

async function makeUser(expiresInMs = 3600e3) {
  await db.user.deleteMany();
  return db.user.create({
    data: {
      email: "t@example.com",
      name: "T U",
      stravaId: 42,
      stravaAccessToken: crypto.encrypt("access-1"),
      stravaRefreshToken: crypto.encrypt("refresh-1"),
      stravaTokenExpiresAt: new Date(Date.now() + expiresInMs),
    },
  });
}

beforeEach(() => vi.restoreAllMocks());

describe("syncUser", () => {
  it("imports activities across pages and scores load", async () => {
    const u = await makeUser();
    const page1 = Array.from({ length: 200 }, (_, i) => act(1000 + i, 300 - i));
    const page2 = [act(2000, 5), act(2001, 4, { average_heartrate: undefined })];
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("page=1")) return json(page1);
      if (url.includes("page=2")) return json(page2);
      return json([]);
    });
    await sync.syncUser(u.id);

    expect(spy).toHaveBeenCalledTimes(2); // stopped after the short page
    expect(await db.activity.count({ where: { userId: u.id } })).toBe(202);
    const noHr = await db.activity.findUnique({ where: { stravaId: 2001 } });
    expect(noHr!.load).toBeGreaterThan(0); // fell back to sport default
    const fresh = await db.user.findUnique({ where: { id: u.id } });
    expect(fresh).toMatchObject({ syncStatus: "IDLE" });
    expect(fresh!.lastSyncAt).not.toBeNull();
  });

  it("is idempotent: syncing twice does not duplicate", async () => {
    const u = await makeUser();
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => json([act(1, 3), act(2, 2)]));
    await sync.syncUser(u.id);
    await sync.syncUser(u.id);
    expect(await db.activity.count({ where: { userId: u.id } })).toBe(2);
  });

  it("updates an edited activity instead of duplicating it", async () => {
    const u = await makeUser();
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => json([act(1, 3)]));
    await sync.syncUser(u.id);
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => json([act(1, 3, { name: "Renamed" })]));
    await sync.syncUser(u.id);
    const rows = await db.activity.findMany({ where: { userId: u.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Renamed");
  });

  it("refreshes an expired token and stores the new one encrypted", async () => {
    const u = await makeUser(-1000);
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/oauth/token")) {
        return json({ access_token: "access-2", refresh_token: "refresh-2", expires_at: Math.floor(Date.now() / 1000) + 21600 });
      }
      return json([act(1, 1)]);
    });
    await sync.syncUser(u.id);
    const apiCall = spy.mock.calls.find((c) => String(c[0]).includes("/athlete/activities"))!;
    expect((apiCall[1] as RequestInit).headers).toMatchObject({ Authorization: "Bearer access-2" });
    const fresh = await db.user.findUnique({ where: { id: u.id } });
    expect(fresh!.stravaAccessToken).not.toContain("access-2");
    expect(crypto.decrypt(fresh!.stravaAccessToken!)).toBe("access-2");
    expect(crypto.decrypt(fresh!.stravaRefreshToken!)).toBe("refresh-2");
  });

  it("marks RATE_LIMITED on 429 and keeps already-imported data", async () => {
    const u = await makeUser();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("page=1")) return json(Array.from({ length: 200 }, (_, i) => act(100 + i, 400 - i)));
      return new Response("slow down", { status: 429 });
    });
    await sync.syncUser(u.id);
    const fresh = await db.user.findUnique({ where: { id: u.id } });
    expect(fresh!.syncStatus).toBe("RATE_LIMITED");
    expect(await db.activity.count({ where: { userId: u.id } })).toBe(200);
  });

  it("marks ERROR (not crash) when Strava fails", async () => {
    const u = await makeUser();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response("boom", { status: 500 }));
    await sync.syncUser(u.id);
    expect((await db.user.findUnique({ where: { id: u.id } }))!.syncStatus).toBe("ERROR");
  });

  it("does not run two syncs for one user at once", async () => {
    const u = await makeUser();
    let calls = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 50));
      return json([]);
    });
    await Promise.all([sync.syncUser(u.id), sync.syncUser(u.id)]);
    expect(calls).toBe(1);
  });
});

describe("recomputeLoads", () => {
  it("re-scores stored activities when FTP is set", async () => {
    const u = await makeUser();
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      json([act(1, 2, { sport_type: "Ride", average_watts: 200, weighted_average_watts: 200, average_heartrate: undefined })]),
    );
    await sync.syncUser(u.id);
    const before = (await db.activity.findUnique({ where: { stravaId: 1 } }))!.load;
    await db.user.update({ where: { id: u.id }, data: { ftp: 200 } });
    await sync.recomputeLoads(u.id);
    const after = (await db.activity.findUnique({ where: { stravaId: 1 } }))!.load;
    // 3000 s at IF 1.0 = 83.3; before (no FTP) used the Ride default 0.65
    expect(after).toBeCloseTo(83.3, 0);
    expect(after).toBeGreaterThan(before);
  });
});
