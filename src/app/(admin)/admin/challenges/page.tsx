import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmButton, SubmitButton } from "@/components/client";
import { EmptyState, Field, Flash, PageHeader } from "@/components/ui";
import { METRIC_INFO, challengeState } from "@/lib/challenges";
import { db } from "@/lib/db";
import { fmtDateShort } from "@/lib/format";
import { requireStaff } from "@/lib/session";
import { createChallenge, deleteChallenge } from "../actions";

export const metadata: Metadata = { title: "Challenges" };
export const dynamic = "force-dynamic";

export default async function AdminChallenges({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const list = await db.challenge.findMany({ orderBy: { startDate: "desc" } });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return (
    <>
      <PageHeader title="Challenges" description="Create monthly or custom challenges. Every active member is entered automatically and ranked from their logged runs." />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-3">
          {list.length === 0 && <EmptyState title="No challenges yet" text="Create one to get the club motivated." />}
          {list.map((c) => {
            const st = challengeState(c);
            return (
              <div key={c.id} className="card flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{c.title}</h2><span className={`badge ${st === "LIVE" ? "badge-good" : st === "UPCOMING" ? "badge-warn" : ""}`}>{st === "LIVE" ? "Live" : st === "UPCOMING" ? "Upcoming" : "Ended"}</span></div>
                  <p className="text-xs text-muted">{fmtDateShort(c.startDate)} to {fmtDateShort(c.endDate)} &middot; {METRIC_INFO[c.metric]?.label}{c.clubTarget ? ` &middot; club target ${c.clubTarget} ${METRIC_INFO[c.metric]?.unit}`.replace("&middot;", "·") : ""}</p>
                </div>
                <Link href={`/challenges/${c.id}`} className="btn btn-sm">View</Link>
                <form action={deleteChallenge.bind(null, c.id)}><ConfirmButton message="Delete this challenge?" className="btn btn-sm btn-ghost btn-danger">Delete</ConfirmButton></form>
              </div>
            );
          })}
        </div>
        <section className="card h-fit">
          <h2 className="mb-4 font-bold">New challenge</h2>
          <form action={createChallenge} className="space-y-4">
            <Field label="Title" htmlFor="title"><input id="title" name="title" className="input" required minLength={3} maxLength={100} placeholder="November 200 km Club Challenge" /></Field>
            <Field label="Description" htmlFor="description"><textarea id="description" name="description" className="input" rows={3} required minLength={5} maxLength={1000} /></Field>
            <Field label="Ranked by" htmlFor="metric"><select id="metric" name="metric" className="input">{Object.entries(METRIC_INFO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts" htmlFor="startDate"><input id="startDate" name="startDate" type="date" className="input" required defaultValue={iso(monthStart)} /></Field>
              <Field label="Ends" htmlFor="endDate"><input id="endDate" name="endDate" type="date" className="input" required defaultValue={iso(monthEnd)} /></Field>
            </div>
            <Field label="Club target (optional)" htmlFor="clubTarget" hint="A shared goal for the whole club, in the unit above."><input id="clubTarget" name="clubTarget" type="number" min="1" className="input" /></Field>
            <SubmitButton>Create challenge</SubmitButton>
          </form>
        </section>
      </div>
    </>
  );
}
