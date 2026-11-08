import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { fmtTime, km } from "@/lib/format";
import { dayKey } from "@/lib/metrics";
import { monthRangeIST, nowIST } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const user = await requireUser("/calendar");
  const sp = await searchParams;
  const now = nowIST();
  const match = /^(\d{4})-(\d{2})$/.exec(sp.m ?? "");
  const year = match ? Number(match[1]) : now.year;
  const month = match ? Math.min(Math.max(Number(match[2]), 1), 12) - 1 : now.month;
  const { start, end } = monthRangeIST(year, month);

  const [acts, plans, regs] = await Promise.all([
    db.activity.findMany({ where: { userId: user.id, startDate: { gte: start, lt: end } }, orderBy: { startDate: "asc" } }),
    db.workout.findMany({ where: { userId: user.id, date: { gte: start, lt: end } }, orderBy: { date: "asc" } }),
    db.registration.findMany({ where: { userId: user.id, status: { in: ["GOING", "WAITLIST"] }, event: { startsAt: { gte: start, lt: end }, status: "PUBLISHED" } }, include: { event: true } }),
  ]);

  type Cell = { acts: typeof acts; plans: typeof plans; events: typeof regs };
  const byDay = new Map<string, Cell>();
  const slot = (k: string) => byDay.get(k) ?? byDay.set(k, { acts: [], plans: [], events: [] }).get(k)!;
  acts.forEach((a) => slot(dayKey(a.startDate)).acts.push(a));
  plans.forEach((p) => slot(dayKey(p.date)).plans.push(p));
  regs.forEach((r) => slot(dayKey(r.event.startsAt)).events.push(r));

  const first = new Date(Date.UTC(year, month, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const ym = (y: number, m: number) => { const d = new Date(Date.UTC(y, m, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`; };
  const todayKey = `${now.year}-${String(now.month + 1).padStart(2, "0")}-${String(now.day).padStart(2, "0")}`;
  const totalKm = acts.reduce((s, a) => s + a.distance, 0);

  return (
    <>
      <PageHeader title={first.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })} description={`${acts.length} activities · ${km(totalKm)}`}
        actions={<><Link className="btn btn-sm" href={`/calendar?m=${ym(year, month - 1)}`} aria-label="Previous month">&larr;</Link><Link className="btn btn-sm" href="/calendar">Today</Link><Link className="btn btn-sm" href={`/calendar?m=${ym(year, month + 1)}`} aria-label="Next month">&rarr;</Link></>} />
      <div className="overflow-x-auto">
        <div className="grid min-w-[44rem] grid-cols-7 gap-px overflow-hidden rounded-2xl border border-line bg-line text-xs">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="bg-surface-2 p-2 font-bold uppercase tracking-wide text-muted">{d}</div>)}
          {cells.map((d, i) => {
            const k = d ? `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` : "";
            const c = d ? byDay.get(k) : undefined;
            return (
              <div key={i} className={`min-h-28 p-1.5 ${d ? "bg-surface" : "bg-surface-2/50"}`}>
                {d && <div className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${k === todayKey ? "bg-brand text-brand-ink" : "text-muted"}`}>{d}</div>}
                {c?.events.map((r) => <Link key={r.id} href={`/events/${r.event.slug}`} className="mb-1 block truncate rounded bg-brand-soft px-1.5 py-0.5 font-medium text-brand" title={r.event.title}>{fmtTime(r.event.startsAt)} {r.event.title}</Link>)}
                {c?.plans.map((p) => <div key={p.id} className={`mb-1 truncate rounded border border-dashed px-1.5 py-0.5 ${p.status === "DONE" ? "border-good text-good" : "border-teal text-teal"}`} title={p.title}>{p.status === "DONE" ? "✓ " : ""}{p.title}</div>)}
                {c?.acts.map((a) => <Link key={a.id} href={`/activities/${a.id}`} className="mb-1 block truncate rounded bg-teal-soft px-1.5 py-0.5 font-medium text-teal" title={a.name}>{a.sportType} {km(a.distance)}</Link>)}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 flex flex-wrap gap-4 text-xs text-muted"><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-teal" />Activity</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-dashed border-teal" />Planned workout</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-brand" />Event you&rsquo;re going to</span></p>
    </>
  );
}
