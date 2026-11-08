// Pure training-metrics functions (no I/O) so they are easy to test.

export type Profile = { maxHr?: number | null; restHr?: number | null; ftp?: number | null };

export type LoadInput = {
  sportType: string;
  movingTime: number; // seconds
  avgHr?: number | null;
  avgWatts?: number | null;
  weightedWatts?: number | null;
};

const DEFAULT_MAX_HR = 190;
const DEFAULT_REST_HR = 55;
// Fraction of heart-rate reserve that corresponds to threshold effort (IF = 1.0).
const THRESHOLD_HRR = 0.85;

const SPORT_IF: Record<string, number> = {
  Run: 0.75,
  TrailRun: 0.75,
  Ride: 0.65,
  VirtualRide: 0.65,
  GravelRide: 0.65,
  MountainBikeRide: 0.65,
  Swim: 0.7,
  Walk: 0.4,
  Hike: 0.5,
};

/**
 * Training load in TSS-like points (100 = one hour at threshold).
 * Uses power when FTP is set, then heart rate, then a per-sport default.
 */
export function activityLoad(a: LoadInput, p: Profile = {}): number {
  const hours = a.movingTime / 3600;
  if (hours <= 0) return 0;

  let intensity: number;
  const power = a.weightedWatts ?? a.avgWatts;
  if (p.ftp && power) {
    intensity = power / p.ftp;
  } else if (a.avgHr) {
    const max = p.maxHr ?? DEFAULT_MAX_HR;
    const rest = p.restHr ?? DEFAULT_REST_HR;
    const reserve = (a.avgHr - rest) / Math.max(max - rest, 1);
    intensity = reserve / THRESHOLD_HRR;
  } else {
    intensity = SPORT_IF[a.sportType] ?? 0.6;
  }
  intensity = Math.min(Math.max(intensity, 0.25), 1.4);
  return Math.round(hours * intensity * intensity * 100 * 10) / 10;
}

export type FitnessPoint = { date: string; load: number; ctl: number; atl: number; tsb: number };

// The club is in India: "which day was this run" is decided in IST (UTC+5:30), so a 5am run is not filed under yesterday.
const IST_OFFSET_MS = 330 * 60 * 1000;

export function dayKey(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Fitness (CTL, 42-day), fatigue (ATL, 7-day) and form (TSB = CTL - ATL),
 * one point per day from the first activity up to `until`.
 */
export function fitnessSeries(
  activities: { startDate: Date; load: number }[],
  until: Date = new Date(),
): FitnessPoint[] {
  if (activities.length === 0) return [];
  const byDay = new Map<string, number>();
  let first = activities[0].startDate;
  for (const a of activities) {
    if (a.startDate < first) first = a.startDate;
    const k = dayKey(a.startDate);
    byDay.set(k, (byDay.get(k) ?? 0) + a.load);
  }
  const out: FitnessPoint[] = [];
  let ctl = 0;
  let atl = 0;
  const cursor = new Date(`${dayKey(first)}T00:00:00Z`);
  const end = new Date(`${dayKey(until)}T00:00:00Z`).getTime();
  while (cursor.getTime() <= end) {
    const k = dayKey(cursor);
    const load = byDay.get(k) ?? 0;
    ctl += (load - ctl) / 42;
    atl += (load - atl) / 7;
    out.push({
      date: k,
      load,
      ctl: round1(ctl),
      atl: round1(atl),
      tsb: round1(ctl - atl),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export function formStatus(tsb: number): { label: string; tone: "good" | "warn" | "bad" | "neutral" } {
  if (tsb > 25) return { label: "Detraining risk", tone: "warn" };
  if (tsb > 5) return { label: "Fresh", tone: "good" };
  if (tsb >= -10) return { label: "Balanced", tone: "neutral" };
  if (tsb >= -30) return { label: "Building", tone: "good" };
  return { label: "Overreaching", tone: "bad" };
}

export type WeekBucket = { weekStart: string; hours: number; distanceKm: number; load: number; count: number };

/** ISO-week (Monday start) buckets for the last `weeks` weeks, oldest first. */
export function weeklyVolume(
  activities: { startDate: Date; movingTime: number; distance: number; load: number }[],
  weeks: number,
  now: Date = new Date(),
): WeekBucket[] {
  const monday = mondayOf(now);
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(monday);
    start.setUTCDate(start.getUTCDate() - i * 7);
    buckets.push({ weekStart: dayKey(start), hours: 0, distanceKm: 0, load: 0, count: 0 });
  }
  const index = new Map(buckets.map((b, i) => [b.weekStart, i]));
  for (const a of activities) {
    const i = index.get(dayKey(mondayOf(a.startDate)));
    if (i === undefined) continue;
    buckets[i].hours += a.movingTime / 3600;
    buckets[i].distanceKm += a.distance / 1000;
    buckets[i].load += a.load;
    buckets[i].count += 1;
  }
  return buckets.map((b) => ({
    ...b,
    hours: round1(b.hours),
    distanceKm: round1(b.distanceKm),
    load: Math.round(b.load),
  }));
}

export function mondayOf(d: Date): Date {
  const x = new Date(`${dayKey(d)}T00:00:00Z`);
  const dow = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - dow);
  return x;
}

export type PersonalRecord = { label: string; value: string; activityName: string; date: Date; activityId: string };

type RecordInput = {
  id: string;
  name: string;
  sportType: string;
  startDate: Date;
  distance: number;
  movingTime: number;
  elevationGain: number;
};

const RUN = new Set(["Run", "TrailRun", "VirtualRun"]);
const RIDE = new Set(["Ride", "VirtualRide", "GravelRide", "MountainBikeRide"]);

export function formatPace(secondsPerKm: number): string {
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.round(totalSeconds % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Personal bests derived from whole activities (not Strava best-efforts):
 * "fastest run of at least N km" ranks by average pace, so it is an approximation.
 */
export function personalRecords(acts: RecordInput[]): PersonalRecord[] {
  const out: PersonalRecord[] = [];
  const runs = acts.filter((a) => RUN.has(a.sportType) && a.distance > 0 && a.movingTime > 0);
  const rides = acts.filter((a) => RIDE.has(a.sportType) && a.distance > 0 && a.movingTime > 0);

  const push = (label: string, a: RecordInput | undefined, value: string) => {
    if (a) out.push({ label, value, activityName: a.name, date: a.startDate, activityId: a.id });
  };
  const best = <T,>(list: T[], score: (x: T) => number): T | undefined =>
    list.reduce<T | undefined>((m, x) => (m === undefined || score(x) > score(m) ? x : m), undefined);

  for (const [km, name] of [[5, "5 km"], [10, "10 km"], [21.0975, "Half marathon"], [42.195, "Marathon"]] as const) {
    const eligible = runs.filter((a) => a.distance >= km * 1000);
    const a = best(eligible, (x) => x.distance / x.movingTime);
    if (a) push(`Fastest run ≥ ${name}`, a, formatPace(a.movingTime / (a.distance / 1000)));
  }
  const longRun = best(runs, (a) => a.distance);
  if (longRun) push("Longest run", longRun, `${(longRun.distance / 1000).toFixed(1)} km`);

  const longRide = best(rides, (a) => a.distance);
  if (longRide) push("Longest ride", longRide, `${(longRide.distance / 1000).toFixed(1)} km`);
  const fastRide = best(rides.filter((a) => a.distance >= 40000), (a) => a.distance / a.movingTime);
  if (fastRide) push("Fastest ride ≥ 40 km", fastRide, `${((fastRide.distance / fastRide.movingTime) * 3.6).toFixed(1)} km/h`);

  const climb = best(acts, (a) => a.elevationGain);
  if (climb && climb.elevationGain > 0) push("Most elevation", climb, `${Math.round(climb.elevationGain)} m`);
  return out;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
