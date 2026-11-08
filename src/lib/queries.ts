import { db } from "./db";
import { fitnessSeries, formStatus, personalRecords, weeklyVolume } from "./metrics";

export const RUN_TYPES = ["Run", "TrailRun", "VirtualRun"];
const IST_MS = 330 * 60 * 1000;

/** [start, end) of an IST calendar month, as UTC instants. month is 0-11. */
export function monthRangeIST(year: number, month: number) {
  return { start: new Date(Date.UTC(year, month, 1) - IST_MS), end: new Date(Date.UTC(year, month + 1, 1) - IST_MS) };
}

export function nowIST() {
  const d = new Date(Date.now() + IST_MS);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() };
}

export function currentMonthRange() {
  const { year, month } = nowIST();
  return { year, month, ...monthRangeIST(year, month) };
}

export type Metric = "DISTANCE" | "ELEVATION" | "ACTIVITIES" | "TIME";

export async function leaderboard(range: { start: Date; end: Date }, metric: Metric = "DISTANCE", limit = 10) {
  const rows = await db.activity.groupBy({
    by: ["userId"],
    where: { startDate: { gte: range.start, lt: range.end }, sportType: { in: RUN_TYPES }, user: { status: "ACTIVE" } },
    _sum: { distance: true, elevationGain: true, movingTime: true },
    _count: { _all: true },
  });
  const score = (r: (typeof rows)[number]) =>
    metric === "DISTANCE" ? (r._sum.distance ?? 0) / 1000
    : metric === "ELEVATION" ? (r._sum.elevationGain ?? 0)
    : metric === "TIME" ? (r._sum.movingTime ?? 0) / 3600
    : r._count._all;
  const top = rows.sort((a, b) => score(b) - score(a)).slice(0, limit);
  const users = await db.user.findMany({ where: { id: { in: top.map((r) => r.userId) } }, select: { id: true, name: true } });
  const names = new Map(users.map((u) => [u.id, u.name]));
  return top.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    name: names.get(r.userId) ?? "Member",
    value: Math.round(score(r) * 10) / 10,
    km: Math.round(((r._sum.distance ?? 0) / 1000) * 10) / 10,
    runs: r._count._all,
  }));
}

export async function clubStats() {
  const { start, end } = currentMonthRange();
  const [members, month, allTime, upcoming] = await Promise.all([
    db.user.count({ where: { status: "ACTIVE" } }),
    db.activity.aggregate({ where: { startDate: { gte: start, lt: end }, sportType: { in: RUN_TYPES }, user: { status: "ACTIVE" } }, _sum: { distance: true }, _count: { _all: true } }),
    db.activity.aggregate({ where: { sportType: { in: RUN_TYPES } }, _sum: { distance: true } }),
    db.event.count({ where: { status: "PUBLISHED", startsAt: { gte: new Date() } } }),
  ]);
  return {
    members,
    kmThisMonth: Math.round((month._sum.distance ?? 0) / 1000),
    runsThisMonth: month._count._all,
    kmAllTime: Math.round((allTime._sum.distance ?? 0) / 1000),
    upcomingEvents: upcoming,
  };
}

export async function upcomingEvents(limit = 6) {
  const events = await db.event.findMany({
    where: { status: { in: ["PUBLISHED", "CANCELLED"] }, startsAt: { gte: new Date(Date.now() - 3 * 3600 * 1000) } },
    orderBy: { startsAt: "asc" },
    take: limit,
    include: { _count: { select: { registrations: { where: { status: "GOING" } } } } },
  });
  return events;
}

/** Everything the athlete dashboard needs. */
export async function athleteOverview(userId: string) {
  const activities = await db.activity.findMany({ where: { userId }, orderBy: { startDate: "desc" } });
  const series = fitnessSeries(activities);
  const today = series[series.length - 1];
  const weeks = weeklyVolume(activities, 12);
  return {
    activities,
    recent: activities.slice(0, 6),
    series: series.slice(-120),
    today,
    form: today ? formStatus(today.tsb) : null,
    weeks,
    thisWeek: weeks[weeks.length - 1],
    records: personalRecords(activities),
  };
}

export async function monthDistanceKm(userId: string, year: number, month: number) {
  const { start, end } = monthRangeIST(year, month);
  const r = await db.activity.aggregate({ where: { userId, startDate: { gte: start, lt: end }, sportType: { in: RUN_TYPES } }, _sum: { distance: true } });
  return (r._sum.distance ?? 0) / 1000;
}

export async function yearDistanceKm(userId: string, year: number) {
  const start = new Date(Date.UTC(year, 0, 1) - IST_MS);
  const end = new Date(Date.UTC(year + 1, 0, 1) - IST_MS);
  const r = await db.activity.aggregate({ where: { userId, startDate: { gte: start, lt: end }, sportType: { in: RUN_TYPES } }, _sum: { distance: true } });
  return (r._sum.distance ?? 0) / 1000;
}
