import { CheckCircle2, ClipboardList, RotateCcw, SkipForward } from "lucide-react";
import type { Metadata } from "next";
import { SubmitButton } from "@/components/client";
import { EmptyState, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { fmtDateLong } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { setWorkoutStatus } from "./actions";

export const metadata: Metadata = { title: "My plan" };
export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const user = await requireUser("/plan");
  const today = new Date(Date.now() - 86400000);
  const [upcoming, recent] = await Promise.all([
    db.workout.findMany({ where: { userId: user.id, date: { gte: today } }, orderBy: { date: "asc" }, include: { author: { select: { name: true } } }, take: 60 }),
    db.workout.findMany({ where: { userId: user.id, date: { lt: today } }, orderBy: { date: "desc" }, take: 15 }),
  ]);
  const row = (w: (typeof upcoming)[number] | (typeof recent)[number]) => (
    <li key={w.id} className="card flex flex-wrap items-center gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><h3 className={`font-bold ${w.status === "SKIPPED" ? "text-muted line-through" : ""}`}>{w.title}</h3><span className="badge">{w.sportType}</span>{w.status === "DONE" && <span className="badge badge-good">Done</span>}{w.status === "SKIPPED" && <span className="badge badge-warn">Skipped</span>}</div>
        <p className="mt-0.5 text-xs text-muted">{fmtDateLong(w.date)}{w.plannedDistance ? ` · ${w.plannedDistance / 1000} km` : ""}{w.plannedMinutes ? ` · ${w.plannedMinutes} min` : ""}{"author" in w && w.author ? ` · from ${w.author.name}` : ""}</p>
        {w.description && <p className="mt-2 whitespace-pre-line text-sm text-muted">{w.description}</p>}
      </div>
      <div className="flex gap-2">
        {w.status === "PLANNED" ? (<>
          <form action={setWorkoutStatus.bind(null, w.id, "DONE")}><SubmitButton className="btn btn-sm btn-primary" pendingText="…"><CheckCircle2 size={15} /> Done</SubmitButton></form>
          <form action={setWorkoutStatus.bind(null, w.id, "SKIPPED")}><SubmitButton className="btn btn-sm" pendingText="…"><SkipForward size={15} /> Skip</SubmitButton></form>
        </>) : (
          <form action={setWorkoutStatus.bind(null, w.id, "PLANNED")}><SubmitButton className="btn btn-sm btn-ghost" pendingText="…"><RotateCcw size={15} /> Undo</SubmitButton></form>
        )}
      </div>
    </li>
  );
  return (
    <>
      <PageHeader title="My training plan" description="Workouts your coaches have scheduled for you. Tick them off as you go." />
      {upcoming.length === 0 ? <EmptyState icon={<ClipboardList size={22} />} title="No workouts scheduled" text="When a coach adds workouts to your plan, they'll show up here and on your calendar." /> : <ul className="space-y-3">{upcoming.map(row)}</ul>}
      {recent.length > 0 && (<><h2 className="mb-3 mt-10 text-lg font-bold">Recent</h2><ul className="space-y-3">{recent.map(row)}</ul></>)}
    </>
  );
}
