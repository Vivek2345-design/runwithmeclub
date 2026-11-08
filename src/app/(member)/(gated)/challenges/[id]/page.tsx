import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeaderboardList } from "@/components/Leaderboard";
import { PageHeader, StatCard } from "@/components/ui";
import { METRIC_INFO, challengeRange, challengeState } from "@/lib/challenges";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { leaderboard } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Challenge" };
export const dynamic = "force-dynamic";

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/challenges/${id}`);
  const c = await db.challenge.findUnique({ where: { id } });
  if (!c) notFound();
  const info = METRIC_INFO[c.metric] ?? METRIC_INFO.DISTANCE;
  const all = await leaderboard(challengeRange(c), info.key, 1000);
  const total = Math.round(all.reduce((s, r) => s + r.value, 0) * 10) / 10;
  const mine = all.find((r) => r.userId === user.id);
  const state = challengeState(c);
  const daysLeft = Math.max(0, Math.ceil((c.endDate.getTime() - Date.now()) / 86400000));
  const pct = c.clubTarget ? Math.min(100, (total / c.clubTarget) * 100) : null;

  return (
    <>
      <PageHeader back={{ href: "/challenges", label: "Challenges" }} title={c.title} description={`${fmtDate(c.startDate)} to ${fmtDate(c.endDate)} · ranked by ${info.label.toLowerCase()}`} actions={<span className={`badge ${state === "LIVE" ? "badge-good" : state === "UPCOMING" ? "badge-warn" : ""}`}>{state === "LIVE" ? `${daysLeft} days left` : state === "UPCOMING" ? "Upcoming" : "Ended"}</span>} />
      <p className="mb-6 max-w-2xl text-muted">{c.description}</p>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Your rank" value={mine ? `#${mine.rank}` : "–"} hint={mine ? `${mine.value} ${info.unit}` : "Log a run to join the board"} />
        <StatCard label="Runners taking part" value={all.length} tone="teal" />
        <StatCard label="Club total" value={`${total} ${info.unit}`} tone="good" hint={c.clubTarget ? `Target ${c.clubTarget} ${info.unit}` : undefined} />
      </div>
      {pct !== null && (
        <div className="card mb-6">
          <div className="mb-2 flex justify-between text-sm"><span className="font-semibold">Club goal</span><span className="text-muted">{Math.round(pct)}%</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-gradient-to-r from-brand to-lime" style={{ width: `${pct}%` }} /></div>
        </div>
      )}
      <div className="card"><h2 className="mb-2 font-bold">Leaderboard</h2><LeaderboardList rows={all.slice(0, 50)} unit={info.unit === "runs" ? "" : info.unit} highlightId={user.id} fullNames /></div>
    </>
  );
}
