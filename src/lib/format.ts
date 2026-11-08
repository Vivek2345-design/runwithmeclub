import { TIMEZONE } from "./brand";
import { formatDuration, formatPace } from "./metrics";

const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: TIMEZONE, ...o });
const FMT = {
  date: f({ weekday: "short", day: "numeric", month: "short", year: "numeric" }),
  dateShort: f({ day: "numeric", month: "short" }),
  dateLong: f({ weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  time: f({ hour: "numeric", minute: "2-digit", hour12: true }),
  month: f({ month: "short" }),
  day: f({ day: "numeric" }),
  weekday: f({ weekday: "short" }),
};

export const fmtDate = (d: Date) => FMT.date.format(d);
export const fmtDateShort = (d: Date) => FMT.dateShort.format(d);
export const fmtDateLong = (d: Date) => FMT.dateLong.format(d);
export const fmtTime = (d: Date) => FMT.time.format(d).toUpperCase();
export const fmtDateTime = (d: Date) => `${FMT.dateShort.format(d)}, ${fmtTime(d)}`;
export const fmtMonth = (d: Date) => FMT.month.format(d);
export const fmtDay = (d: Date) => FMT.day.format(d);
export const fmtWeekday = (d: Date) => FMT.weekday.format(d);

export function timeAgo(d: Date, now = new Date()): string {
  const s = Math.round((now.getTime() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return fmtDateShort(d);
}

export const km = (m: number) => `${(m / 1000).toFixed(m >= 100000 ? 0 : 1)} km`;
export const kmNum = (m: number) => Math.round((m / 1000) * 10) / 10;
export const inr = (n: number) => (n === 0 ? "Free" : `₹${n.toLocaleString("en-IN")}`);

export function paceOrSpeed(sportType: string, distance: number, movingTime: number): string {
  if (distance <= 0 || movingTime <= 0) return "–";
  if (/ride/i.test(sportType)) return `${((distance / movingTime) * 3.6).toFixed(1)} km/h`;
  if (/swim/i.test(sportType)) return `${formatDuration((movingTime / distance) * 100)} /100m`;
  return formatPace(movingTime / (distance / 1000));
}

export const stravaUrl = (id: number) => `https://www.strava.com/activities/${id}`;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function hueFor(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

/** "Priya Sharma" -> "Priya S." for public pages. */
export function publicName(name: string): string {
  const p = name.trim().split(/\s+/);
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0];
}

/** Value for <input type="datetime-local"> in IST. */
export function toIstInput(d: Date): string {
  return new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 16);
}

/** Parses a datetime-local string, which the admin enters in IST. Returns null if invalid. */
export function parseIstInput(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return null;
  const d = new Date(`${s}:00+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "event";
}

export const EVENT_TYPES: Record<string, { label: string; tone: string }> = {
  GROUP_RUN: { label: "Group run", tone: "badge-brand" },
  RACE: { label: "Race", tone: "badge-bad" },
  WORKSHOP: { label: "Workshop", tone: "badge-teal" },
  SOCIAL: { label: "Social", tone: "badge-good" },
};
