import type { Metadata } from "next";
import { ProgressRing } from "@/components/Charts";
import { SubmitButton } from "@/components/client";
import { Field, Flash, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { currentMonthRange, monthDistanceKm, yearDistanceKm } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { removeGoal, saveGoal } from "./actions";

export const metadata: Metadata = { title: "Goals" };
export const dynamic = "force-dynamic";

export default async function GoalsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requireUser("/goals");
  const sp = await searchParams;
  const { year, month } = currentMonthRange();
  const [monthKm, yearKm, mGoal, yGoal] = await Promise.all([
    monthDistanceKm(user.id, year, month), yearDistanceKm(user.id, year),
    db.goal.findUnique({ where: { userId_year_month: { userId: user.id, year, month: month + 1 } } }),
    db.goal.findUnique({ where: { userId_year_month: { userId: user.id, year, month: 0 } } }),
  ]);
  const monthName = new Date(Date.UTC(year, month, 15)).toLocaleDateString("en-IN", { month: "long", timeZone: "UTC" });
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const dayOfMonth = new Date(Date.now() + 330 * 60000).getUTCDate();

  const card = (title: string, sub: string, km: number, goal: typeof mGoal, m: number, extra?: string) => (
    <section className="card">
      <h2 className="font-bold">{title}</h2>
      <p className="text-sm text-muted">{sub}</p>
      <div className="mt-5 flex flex-wrap items-center gap-6">
        <ProgressRing value={km} max={goal?.targetKm ?? 0} label={goal ? "of goal" : "no goal"} />
        <div className="text-sm">
          <div className="display text-3xl font-extrabold tabular-nums">{Math.round(km * 10) / 10}<span className="text-base font-semibold text-muted"> / {goal ? goal.targetKm : "?"} km</span></div>
          {goal && km < goal.targetKm && extra && <p className="mt-1 text-muted">{extra}</p>}
          {goal && km >= goal.targetKm && <p className="mt-1 font-semibold text-good">Goal reached. Brilliant!</p>}
        </div>
      </div>
      <form action={saveGoal} className="mt-5 flex items-end gap-3 border-t border-line pt-4">
        <input type="hidden" name="year" value={year} /><input type="hidden" name="month" value={m} />
        <div className="flex-1"><Field label={goal ? "Change goal (km)" : "Set a goal (km)"} htmlFor={`g${m}`}><input id={`g${m}`} name="targetKm" type="number" min="1" step="1" className="input" required defaultValue={goal?.targetKm} /></Field></div>
        <SubmitButton pendingText="…">Save</SubmitButton>
        {goal && <button formAction={removeGoal.bind(null, goal.id)} className="btn btn-ghost btn-danger" formNoValidate>Remove</button>}
      </form>
    </section>
  );

  const remaining = (g: typeof mGoal, km: number, days: number) => (g ? `${Math.round((g.targetKm - km) * 10) / 10} km to go${days > 0 ? `, about ${Math.round(((g.targetKm - km) / days) * 10) / 10} km a day` : ""}` : "");

  return (
    <>
      <PageHeader title="Goals" description="Set a distance target and watch the ring fill up. Only runs count towards goals." />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-6 lg:grid-cols-2">
        {card(`${monthName} goal`, `${daysInMonth - dayOfMonth} days left this month`, monthKm, mGoal, month + 1, remaining(mGoal, monthKm, daysInMonth - dayOfMonth))}
        {card(`${year} goal`, "Your whole-year distance target", yearKm, yGoal, 0, remaining(yGoal, yearKm, 0))}
      </div>
    </>
  );
}
