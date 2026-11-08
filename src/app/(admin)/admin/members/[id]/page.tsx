import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FitnessChart } from "@/components/Charts";
import { ActivityTable } from "@/components/ActivityTable";
import { ResetPassword } from "@/components/ResetPassword";
import { ConfirmButton, SubmitButton } from "@/components/client";
import { Avatar, Badge, Field, Flash, PageHeader, StatCard } from "@/components/ui";
import { PLANS, type PlanKey } from "@/lib/brand";
import { db } from "@/lib/db";
import { fmtDate, fmtDateShort, km } from "@/lib/format";
import { athleteOverview } from "@/lib/queries";
import { requireStaff } from "@/lib/session";
import { deleteMember, resetMemberPassword, updateMember } from "../../actions";

export const metadata: Metadata = { title: "Member" };
export const dynamic = "force-dynamic";

export default async function MemberPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const u = await db.user.findUnique({ where: { id }, include: { group: true, registrations: { where: { status: { not: "CANCELLED" } }, include: { event: true }, orderBy: { createdAt: "desc" }, take: 8 }, workouts: { where: { date: { gte: new Date(Date.now() - 86400000) } }, orderBy: { date: "asc" }, take: 6 } } });
  if (!u) notFound();
  const [o, groups] = await Promise.all([athleteOverview(u.id), db.group.findMany({ orderBy: { name: "asc" } })]);
  const isAdmin = staff.role === "ADMIN";
  const totalKm = o.activities.reduce((s, a) => s + a.distance, 0);

  return (
    <>
      <PageHeader back={{ href: "/admin/members", label: "Members" }} title={u.name} description={u.email}
        actions={<>{u.status === "SUSPENDED" && <Badge tone="badge-bad">Suspended</Badge>}<Badge tone="badge-brand">{PLANS[u.plan as PlanKey]?.name}</Badge><Badge tone="badge-teal">{u.role}</Badge></>} />
      <Flash ok={sp.ok} error={sp.error} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Runs logged" value={o.activities.length} />
            <StatCard label="Total distance" value={km(totalKm)} tone="teal" />
            <StatCard label="Fitness (CTL)" value={o.today ? Math.round(o.today.ctl) : "–"} tone="good" />
            <StatCard label="Form" value={o.today ? Math.round(o.today.tsb) : "–"} hint={o.form?.label} tone="warn" />
          </div>
          <section className="card"><h2 className="mb-3 font-bold">Fitness &amp; fatigue</h2><FitnessChart data={o.series} /></section>
          <section className="card !p-2 sm:!p-4"><h2 className="mb-2 px-2 font-bold sm:px-0">Recent activities</h2>{o.recent.length ? <ActivityTable rows={o.recent} /> : <p className="px-2 text-sm text-muted">No activities yet.</p>}</section>
          <div className="grid gap-6 md:grid-cols-2">
            <section className="card"><h2 className="mb-3 font-bold">Events</h2>{u.registrations.length === 0 ? <p className="text-sm text-muted">No registrations.</p> : <ul className="space-y-2 text-sm">{u.registrations.map((r) => <li key={r.id} className="flex justify-between gap-2"><Link className="truncate hover:text-brand" href={`/admin/events/${r.eventId}`}>{r.event.title}</Link><span className="shrink-0 text-xs text-muted">{fmtDateShort(r.event.startsAt)}{r.checkedInAt ? " ✓" : ""}</span></li>)}</ul>}</section>
            <section className="card"><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Upcoming workouts</h2><Link href="/admin/workouts" className="text-sm font-semibold text-brand">Assign</Link></div>{u.workouts.length === 0 ? <p className="text-sm text-muted">Nothing scheduled.</p> : <ul className="space-y-2 text-sm">{u.workouts.map((w) => <li key={w.id} className="flex justify-between gap-2"><span className="truncate">{w.title}</span><span className="shrink-0 text-xs text-muted">{fmtDateShort(w.date)}</span></li>)}</ul>}</section>
          </div>
        </div>

        <aside className="min-w-0 space-y-6">
          <section className="card">
            <div className="mb-4 flex items-center gap-3"><Avatar name={u.name} size={48} /><div className="min-w-0 text-sm"><div className="font-bold">{u.name}</div><div className="text-xs text-muted">Joined {fmtDate(u.createdAt)}</div></div></div>
            <dl className="space-y-2 text-sm">
              {([["Phone", u.phone], ["City", u.city], ["Emergency contact", u.emergencyContact], ["Strava", u.stravaId ? "Connected" : "Not connected"]] as const).map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v || "–"}</dd></div>)}
            </dl>
            {u.bio && <p className="mt-3 border-t border-line pt-3 text-sm text-muted">{u.bio}</p>}
          </section>

          <section className="card">
            <h2 className="mb-4 font-bold">Manage member</h2>
            <form action={updateMember.bind(null, u.id)} className="space-y-3">
              <Field label="Pace group" htmlFor="groupId"><select id="groupId" name="groupId" className="input" defaultValue={u.groupId ?? ""}><option value="">No group</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
              {isAdmin && (<>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Role" htmlFor="role"><select id="role" name="role" className="input" defaultValue={u.role}><option value="MEMBER">Member</option><option value="COACH">Coach</option><option value="ADMIN">Admin</option></select></Field>
                  <Field label="Status" htmlFor="status"><select id="status" name="status" className="input" defaultValue={u.status}><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></select></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Plan" htmlFor="plan"><select id="plan" name="plan" className="input" defaultValue={u.plan}>{(Object.keys(PLANS) as PlanKey[]).map((k) => <option key={k} value={k}>{PLANS[k].name}</option>)}</select></Field>
                  <Field label="Valid until" htmlFor="membershipUntil"><input id="membershipUntil" name="membershipUntil" type="date" className="input" defaultValue={u.membershipUntil ? new Date(u.membershipUntil.getTime() + 330 * 60000).toISOString().slice(0, 10) : ""} /></Field>
                </div>
              </>)}
              <Field label="Private notes" htmlFor="adminNotes" hint="Only visible to club staff."><textarea id="adminNotes" name="adminNotes" className="input" rows={4} maxLength={2000} defaultValue={u.adminNotes ?? ""} /></Field>
              <SubmitButton>Save changes</SubmitButton>
            </form>
          </section>

          {isAdmin && (
            <section className="card space-y-4">
              <h2 className="font-bold">Admin tools</h2>
              <ResetPassword action={resetMemberPassword.bind(null, u.id)} />
              {u.id !== staff.id && <form action={deleteMember.bind(null, u.id)}><ConfirmButton message={`Permanently delete ${u.name} and all their data?`} className="btn btn-danger btn-sm">Delete member</ConfirmButton></form>}
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
