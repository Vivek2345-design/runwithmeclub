import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmButton, SubmitButton } from "@/components/client";
import { EmptyState, Field, Flash, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { requireStaff } from "@/lib/session";
import { assignWorkout, deleteWorkout } from "../actions";

export const metadata: Metadata = { title: "Training plans" };
export const dynamic = "force-dynamic";

export default async function AdminWorkouts({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; user?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const [groups, members, upcoming] = await Promise.all([
    db.group.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { members: true } } } }),
    db.user.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.workout.findMany({ where: { date: { gte: new Date(Date.now() - 86400000) } }, orderBy: [{ date: "asc" }, { title: "asc" }], take: 80, include: { user: { select: { id: true, name: true } } } }),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <PageHeader title="Training plans" description="Schedule workouts for one member, a pace group or the whole club. They show up on each member's plan and calendar." />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-6 xl:grid-cols-[26rem_minmax(0,1fr)]">
        <section className="card h-fit">
          <h2 className="mb-4 font-bold">Assign a workout</h2>
          <form action={assignWorkout} className="space-y-4">
            <Field label="Assign to" htmlFor="target">
              <select id="target" name="target" className="input" defaultValue={sp.user ? `user:${sp.user}` : "all"}>
                <option value="all">Everyone (all active members)</option>
                {groups.length > 0 && <optgroup label="Pace groups">{groups.map((g) => <option key={g.id} value={`group:${g.id}`}>{g.name} ({g._count.members})</option>)}</optgroup>}
                <optgroup label="Individual members">{members.map((m) => <option key={m.id} value={`user:${m.id}`}>{m.name}</option>)}</optgroup>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" htmlFor="date"><input id="date" name="date" type="date" className="input" required defaultValue={today} /></Field>
              <Field label="Sport" htmlFor="sportType"><select id="sportType" name="sportType" className="input">{["Run", "Ride", "Swim", "Walk", "Workout"].map((s) => <option key={s}>{s}</option>)}</select></Field>
            </div>
            <Field label="Title" htmlFor="title"><input id="title" name="title" className="input" required maxLength={120} placeholder="Tempo 6 x 1 km" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Distance (km)" htmlFor="plannedDistance"><input id="plannedDistance" name="plannedDistance" type="number" step="0.1" min="0" className="input" /></Field>
              <Field label="Minutes" htmlFor="plannedMinutes"><input id="plannedMinutes" name="plannedMinutes" type="number" min="0" className="input" /></Field>
            </div>
            <Field label="Instructions" htmlFor="description"><textarea id="description" name="description" className="input" rows={4} maxLength={2000} placeholder="Warm-up, main set, cool-down…" /></Field>
            <SubmitButton pendingText="Scheduling…">Add to plans</SubmitButton>
          </form>
        </section>
        <section className="card !p-2 sm:!p-4">
          <h2 className="mb-2 px-2 font-bold sm:px-0">Upcoming scheduled workouts</h2>
          {upcoming.length === 0 ? <EmptyState title="Nothing scheduled" text="Use the form to add the first workout." /> : (
            <div className="overflow-x-auto"><table className="table">
              <thead><tr><th>Date</th><th>Workout</th><th>Member</th><th>Status</th><th /></tr></thead>
              <tbody>{upcoming.map((w) => (
                <tr key={w.id}>
                  <td className="whitespace-nowrap text-muted">{fmtDate(w.date)}</td>
                  <td><div className="font-medium">{w.title}</div><div className="text-xs text-muted">{w.sportType}{w.plannedDistance ? ` · ${w.plannedDistance / 1000} km` : ""}{w.plannedMinutes ? ` · ${w.plannedMinutes} min` : ""}</div></td>
                  <td><Link href={`/admin/members/${w.user.id}`} className="hover:text-brand">{w.user.name}</Link></td>
                  <td><span className={`badge ${w.status === "DONE" ? "badge-good" : w.status === "SKIPPED" ? "badge-warn" : ""}`}>{w.status === "PLANNED" ? "Planned" : w.status === "DONE" ? "Done" : "Skipped"}</span></td>
                  <td className="text-right"><form action={deleteWorkout.bind(null, w.id)}><ConfirmButton message="Delete this workout?" className="btn btn-sm btn-ghost btn-danger">Delete</ConfirmButton></form></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </section>
      </div>
    </>
  );
}
