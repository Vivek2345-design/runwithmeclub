import { CalendarDays, Gauge, Mail, Users, UserPlus, Activity } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BarList, WeeklyBars } from "@/components/Charts";
import { Avatar, Badge, Flash, PageHeader, StatCard } from "@/components/ui";
import { db } from "@/lib/db";
import { fmtDate, fmtDateShort, timeAgo } from "@/lib/format";
import { weeklyVolume } from "@/lib/metrics";
import { RUN_TYPES, currentMonthRange, leaderboard, monthRangeIST } from "@/lib/queries";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Admin overview" };
export const dynamic = "force-dynamic";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const range = currentMonthRange();
  const prev = monthRangeIST(range.month === 0 ? range.year - 1 : range.year, (range.month + 11) % 12);
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86400000);
  const d7 = new Date(now.getTime() - 7 * 86400000);
  const d84 = new Date(now.getTime() - 84 * 86400000);
  const soon = new Date(now.getTime() + 14 * 86400000);

  const [members, newMembers, monthAgg, prevAgg, activeRunners, acts, upcoming, unread, expiring, byPlan, recent, board] = await Promise.all([
    db.user.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { createdAt: { gte: d30 } } }),
    db.activity.aggregate({ where: { startDate: { gte: range.start, lt: range.end }, sportType: { in: RUN_TYPES } }, _sum: { distance: true }, _count: true }),
    // Compare like with like: the same number of days into last month, not the whole month.
    db.activity.aggregate({ where: { startDate: { gte: prev.start, lt: new Date(Math.min(prev.end.getTime(), prev.start.getTime() + (now.getTime() - range.start.getTime()))) }, sportType: { in: RUN_TYPES } }, _sum: { distance: true } }),
    db.activity.groupBy({ by: ["userId"], where: { startDate: { gte: d7 } } }),
    db.activity.findMany({ where: { startDate: { gte: d84 }, sportType: { in: RUN_TYPES } }, select: { startDate: true, movingTime: true, distance: true, load: true } }),
    db.event.findMany({ where: { status: "PUBLISHED", startsAt: { gte: now } }, orderBy: { startsAt: "asc" }, take: 5, include: { _count: { select: { registrations: { where: { status: "GOING" } } } } } }),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.user.findMany({ where: { status: "ACTIVE", plan: { not: "FREE" }, membershipUntil: { gte: now, lte: soon } }, orderBy: { membershipUntil: "asc" }, take: 5 }),
    db.user.groupBy({ by: ["plan"], where: { status: "ACTIVE" }, _count: true }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    leaderboard(range, "DISTANCE", 5),
  ]);

  const kmNow = Math.round((monthAgg._sum.distance ?? 0) / 1000);
  const kmPrev = Math.round((prevAgg._sum.distance ?? 0) / 1000);
  const delta = kmPrev > 0 ? Math.round(((kmNow - kmPrev) / kmPrev) * 100) : null;
  const weeks = weeklyVolume(acts, 12);
  const planCount = Object.fromEntries(byPlan.map((p) => [p.plan, p._count]));

  return (
    <>
      <PageHeader title="Club overview" description="How the club is doing right now." actions={<><Link href="/admin/events/new" className="btn btn-primary btn-sm">New event</Link><Link href="/admin/announcements" className="btn btn-sm">Post announcement</Link></>} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active members" value={members} icon={<Users size={17} />} />
        <StatCard label="New (30 days)" value={newMembers} icon={<UserPlus size={17} />} tone="teal" />
        <StatCard label="Km this month" value={kmNow.toLocaleString("en-IN")} icon={<Gauge size={17} />} hint={delta === null ? `${monthAgg._count} runs` : `${delta >= 0 ? "+" : ""}${delta}% vs same days last month`} tone="good" />
        <StatCard label="Active this week" value={activeRunners.length} icon={<Activity size={17} />} hint={members ? `${Math.round((activeRunners.length / members) * 100)}% of members` : undefined} />
        <StatCard label="Upcoming events" value={upcoming.length} icon={<CalendarDays size={17} />} tone="warn" />
        <Link href="/admin/messages"><StatCard label="Unread messages" value={unread} icon={<Mail size={17} />} tone={unread ? "brand" : "teal"} /></Link>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-6">
          <section className="card"><h2 className="mb-3 font-bold">Club distance per week <span className="text-sm font-normal text-muted">(km, last 12 weeks)</span></h2><WeeklyBars data={weeks} metric="distanceKm" /></section>
          <section className="card">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Upcoming events</h2><Link href="/admin/events" className="text-sm font-semibold text-brand">Manage</Link></div>
            {upcoming.length === 0 ? <p className="text-sm text-muted">Nothing scheduled. <Link href="/admin/events/new" className="font-semibold text-brand">Create an event</Link></p> : (
              <ul className="divide-y divide-line">{upcoming.map((e) => (
                <li key={e.id}><Link href={`/admin/events/${e.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80"><div className="min-w-0"><div className="truncate font-semibold">{e.title}</div><div className="text-xs text-muted">{fmtDate(e.startsAt)}</div></div><Badge tone={e.capacity && e._count.registrations >= e.capacity ? "badge-warn" : "badge-good"}>{e._count.registrations}{e.capacity ? ` / ${e.capacity}` : ""} going</Badge></Link></li>
              ))}</ul>
            )}
          </section>
          <section className="card">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Newest members</h2><Link href="/admin/members" className="text-sm font-semibold text-brand">All members</Link></div>
            <ul className="divide-y divide-line">{recent.map((u) => (
              <li key={u.id}><Link href={`/admin/members/${u.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80"><Avatar name={u.name} size={34} /><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{u.name}</div><div className="truncate text-xs text-muted">{u.email}</div></div><span className="text-xs text-muted">{timeAgo(u.createdAt)}</span></Link></li>
            ))}</ul>
          </section>
        </div>
        <div className="min-w-0 space-y-6">
          <section className="card"><h2 className="mb-3 font-bold">Top runners this month</h2>{board.length ? <BarList rows={board.map((r) => ({ label: r.name, value: r.km, sub: `${r.runs} runs` }))} unit=" km" /> : <p className="text-sm text-muted">No runs logged yet.</p>}</section>
          <section className="card"><h2 className="mb-3 font-bold">Members by plan</h2><BarList rows={[{ label: "Guest (free)", value: planCount.FREE ?? 0 }, { label: "Member", value: planCount.MEMBER ?? 0 }, { label: "Performance", value: planCount.ELITE ?? 0 }]} /></section>
          <section className="card">
            <h2 className="mb-3 font-bold">Memberships expiring soon</h2>
            {expiring.length === 0 ? <p className="text-sm text-muted">None in the next 14 days.</p> : <ul className="space-y-2.5">{expiring.map((u) => <li key={u.id}><Link href={`/admin/members/${u.id}`} className="flex items-center justify-between text-sm hover:opacity-80"><span className="font-medium">{u.name}</span><span className="text-xs text-warn">{fmtDateShort(u.membershipUntil!)}</span></Link></li>)}</ul>}
          </section>
        </div>
      </div>
    </>
  );
}
