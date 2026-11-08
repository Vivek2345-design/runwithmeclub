import type { User } from "@prisma/client";
import { db } from "./db";
import { activityLoad } from "./metrics";
import { StravaRateLimitError, accessTokenFor, getActivity, listActivities, type StravaActivity } from "./strava";

const MAX_PAGES = 25; // 25 x 200 = 5,000 activities per run; the next run continues from there
const running = new Set<string>();

export function isSyncRunning(userId: string) {
  return running.has(userId);
}

function toRow(userId: string, a: StravaActivity, profile: Pick<User, "maxHr" | "restHr" | "ftp">) {
  const sportType = a.sport_type ?? a.type ?? "Workout";
  const row = {
    userId,
    source: "STRAVA",
    name: a.name,
    sportType,
    startDate: new Date(a.start_date),
    distance: a.distance ?? 0,
    movingTime: a.moving_time ?? 0,
    elapsedTime: a.elapsed_time ?? 0,
    elevationGain: a.total_elevation_gain ?? 0,
    avgHr: a.average_heartrate ?? null,
    maxHr: a.max_heartrate ?? null,
    avgWatts: a.average_watts ?? null,
    weightedWatts: a.weighted_average_watts ?? null,
  };
  return { ...row, load: activityLoad(row, profile) };
}

export async function upsertActivity(user: User, a: StravaActivity) {
  const row = toRow(user.id, a, user);
  await db.activity.upsert({ where: { stravaId: a.id }, create: { stravaId: a.id, ...row }, update: row });
}

/** Pulls new activities since the latest one we hold (or everything on first run). Safe to call repeatedly. */
export async function syncUser(userId: string): Promise<void> {
  if (running.has(userId)) return;
  running.add(userId);
  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.stravaId) return;
    await db.user.update({ where: { id: userId }, data: { syncStatus: "RUNNING" } });

    const latest = await db.activity.findFirst({ where: { userId, source: "STRAVA" }, orderBy: { startDate: "desc" } });
    // Re-read the last 2 days so edits to recent activities are picked up.
    const after = latest ? Math.floor(latest.startDate.getTime() / 1000) - 2 * 86400 : 0;

    let status = "IDLE";
    try {
      const token = await accessTokenFor(user);
      for (let page = 1; page <= MAX_PAGES; page++) {
        const batch = await listActivities(token, after, page);
        for (const a of batch) await upsertActivity(user, a);
        if (batch.length < 200) break;
      }
    } catch (e) {
      status = e instanceof StravaRateLimitError ? "RATE_LIMITED" : "ERROR";
      if (status === "ERROR") console.error("Strava sync failed", e);
    }
    await db.user.update({
      where: { id: userId },
      data: { syncStatus: status, ...(status === "IDLE" ? { lastSyncAt: new Date() } : {}) },
    });
  } finally {
    running.delete(userId);
  }
}

/** Re-scores every stored activity, e.g. after the athlete changes FTP or heart-rate settings. */
export async function recomputeLoads(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const acts = await db.activity.findMany({ where: { userId } });
  await db.$transaction(
    acts.map((a) => db.activity.update({ where: { id: a.id }, data: { load: activityLoad(a, user) } })),
  );
}

export async function syncSingleActivity(user: User, stravaActivityId: number) {
  const token = await accessTokenFor(user);
  await upsertActivity(user, await getActivity(token, stravaActivityId));
}
