import { CalendarClock, Flame, Gauge, Plus, Target, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActivityTable } from "@/components/ActivityTable";
import { FitnessChart, WeeklyBars } from "@/components/Charts";
import { LeaderboardList } from "@/components/Leaderboard";
import { EmptyState, Flash, StatCard } from "@/components/ui";
import { db } from "@/lib/db";
import { fmtDateShort, fmtDay, fmtMonth, fmtTime, fmtWeekday } from "@/lib/format";
import { athleteOverview, currentMonthRange, leaderboard, monthDistanceKm } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const TONE = { good: "text-good", warn: "text-warn", bad: "text-bad", neutral: "text-muted" } as const;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const range = currentMonthRange();
  const [o, monthKm, goal, workouts, regs, board, latest] = await Promise.all([
    athleteOverview(user.id),
    monthDistanceKm(user.id, range.year, range.month),
    db.goal.findUnique({ where: { userId_year_month: { userId: user.id, year: range.year, month: range.month + 1 } } }),
    db.workout.findMany({ where: { userId: user.id, status: "PLANNED", date: { gte: new Date(Date.now() - 86400000) } }, orderBy: { date: "asc" }, take: 3 }),
    db.registration.findMany({ where: { userId: user.id, status: { in: ["GOING", "WAITLIST"] }, event: { startsAt: { gte: new Date() }, status: "PUBLISHED" } }, include: { event: true }, orderBy: { event: { startsAt: "asc" } }, take: 3 }),
    leaderboard(range, "DISTANCE", 50),
    db.announcement.findFirst({ orderBy: [{ pinned: "desc" }, { createdAt: "desc" }] }),
  ]);

  const myRank = board.find((r) => r.userId === user.id);
  const top5 = board.slice(0, 5);
  // Consecutive weeks (ending this week or last week) with at least one activity.
  let streak = 0;
  for (let i = o.weeks.length - 1; i >= 0; i--) {
    if (o.weeks[i].count > 0) streak++;
    else if (i === o.weeks.length - 1) continue;
    else break;
  }
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{hello}, {user.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-sm text-muted">{o.activities.length === 0 ? "Let's log your first run." : streak > 1 ? `${streak}-week running streak. Keep it going!` : "Here's how your training is looking."}</p>
        </div>
        <div className="flex gap-2"><Link href="/activities/new" className="btn btn-primary"><Plus size={17} /> Log a run</Link><Link href="/events" className="btn">Find an event</Link></div>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="This week" value={`${o.thisWeek?.distanceKm ?? 0} km`} hint={`${o.thisWeek?.count ?? 0} sessions · ${o.thisWeek?.hours ?? 0} h`} icon={<Gauge size={17} />} />
        <StatCard label="This month" value={`${Math.round(monthKm * 10) / 10} km`} icon={<Target size={17} />} tone="teal" hint={goal ? `${Math.round((monthKm / goal.targetKm) * 100)}% of ${goal.targetKm} km goal` : <Link href="/goals" className="underline">Set a monthly goal</Link>} />
        <StatCard label="Fitness (CTL)" value={o.today ? Math.round(o.today.ctl) : "–"} icon={<TrendingUp size={17} />} tone="good" hint="42-day training load" />
        <div className="card">
          <div className="flex items-start justify-between"><div className="text-xs font-semibold uppercase tracking-wide text-muted">Form</div><span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-warn/15 text-warn"><Flame size={17} /></span></div>
          <div className="display mt-2 text-3xl font-extrabold tabular-nums">{o.today ? Math.round(o.today.tsb) : "–"}</div>
          <div className={`mt-1 text-xs font-semibold ${o.form ? TONE[o.form.tone] : "text-muted"}`}>{o.form?.label ?? "Log runs to see your form"}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <section className="card">
            <h2 className="mb-3 font-bold">Fitness &amp; fatigue</h2>
            <FitnessChart data={o.series} />
          </section>
          <section className="card">
            <h2 className="mb-3 font-bold">Weekly volume <span className="text-sm font-normal text-muted">(hours, last 12 weeks)</span></h2>
            <WeeklyBars data={o.weeks} metric="hours" />
          </section>
          <section className="card !p-2 sm:!p-4">
            <div className="flex items-center justify-between px-2 pb-2 pt-1 sm:px-0"><h2 className="font-bold">Recent activities</h2><Link href="/activities" className="text-sm font-semibold text-brand">View all</Link></div>
            {o.recent.length ? <ActivityTable rows={o.recent} /> : <EmptyState title="Nothing logged yet" action={<Link href="/activities/new" className="btn btn-primary btn-sm">Log a run</Link>} />}
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <section className="card">
            <div className="flex items-center justify-between"><h2 className="font-bold">Upcoming workouts</h2><Link href="/plan" className="text-sm font-semibold text-brand">Plan</Link></div>
            {workouts.length === 0 ? <p className="mt-3 text-sm text-muted">Nothing scheduled. Your coach can add workouts to your plan.</p> : (
              <ul className="mt-3 space-y-3">{workouts.map((w) => (
                <li key={w.id} className="flex gap-3"><span className="rounded-lg bg-teal-soft px-2.5 py-1 text-center text-xs font-bold text-teal">{fmtMonth(w.date)}<br /><span className="text-base">{fmtDay(w.date)}</span></span><div className="min-w-0"><div className="truncate text-sm font-semibold">{w.title}</div><div className="text-xs text-muted">{w.sportType}{w.plannedDistance ? ` · ${w.plannedDistance / 1000} km` : ""}{w.plannedMinutes ? ` · ${w.plannedMinutes} min` : ""}</div></div></li>
              ))}</ul>
            )}
          </section>
          <section className="card">
            <div className="flex items-center justify-between"><h2 className="font-bold">Your next events</h2><Link href="/my-events" className="text-sm font-semibold text-brand">All</Link></div>
            {regs.length === 0 ? <p className="mt-3 text-sm text-muted">You haven&rsquo;t registered for anything yet. <Link href="/events" className="font-semibold text-brand">Browse events</Link></p> : (
              <ul className="mt-3 space-y-3">{regs.map((r) => (
                <li key={r.id}><Link href={`/events/${r.event.slug}`} className="flex gap-3 hover:opacity-80"><CalendarClock size={18} className="mt-0.5 shrink-0 text-brand" /><div className="min-w-0"><div className="truncate text-sm font-semibold">{r.event.title}</div><div className="text-xs text-muted">{fmtWeekday(r.event.startsAt)}, {fmtDateShort(r.event.startsAt)} &middot; {fmtTime(r.event.startsAt)}{r.status === "WAITLIST" ? " · waitlist" : ""}</div></div></Link></li>
              ))}</ul>
            )}
          </section>
          <section className="card">
            <div className="mb-1 flex items-center justify-between"><h2 className="font-bold">Club leaderboard</h2><span className="badge badge-brand">Month</span></div>
            {myRank && myRank.rank > 5 && <p className="mb-1 text-xs text-muted">You&rsquo;re ranked #{myRank.rank} this month.</p>}
            <LeaderboardList rows={top5} unit="km" highlightId={user.id} />
            <Link href="/leaderboard" className="btn btn-sm mt-2 w-full">Full leaderboard</Link>
          </section>
          {latest && (
            <section className="card">
              <div className="flex items-center gap-2"><h2 className="font-bold">Latest announcement</h2>{latest.pinned && <span className="badge badge-brand">Pinned</span>}</div>
              <h3 className="mt-2 text-sm font-semibold">{latest.title}</h3>
              <p className="mt-1 line-clamp-4 text-sm text-muted">{latest.body}</p>
              <Link href="/community" className="mt-2 inline-block text-sm font-semibold text-brand">Read more</Link>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
