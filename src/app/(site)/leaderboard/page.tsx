import type { Metadata } from "next";
import Link from "next/link";
import { LeaderboardList } from "@/components/Leaderboard";
import { SectionHeading } from "@/components/ui";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { leaderboard, monthRangeIST, nowIST, type Metric } from "@/lib/queries";

export const metadata: Metadata = { title: "Leaderboard", description: "Who is running the most this month at RunWithMeClub.", alternates: { canonical: "/leaderboard" } };
export const dynamic = "force-dynamic";

const METRICS: Record<string, { key: Metric; label: string; unit: string }> = {
  distance: { key: "DISTANCE", label: "Distance", unit: "km" },
  elevation: { key: "ELEVATION", label: "Elevation", unit: "m" },
  runs: { key: "ACTIVITIES", label: "Number of runs", unit: "" },
  time: { key: "TIME", label: "Time", unit: "h" },
};

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ m?: string; metric?: string }> }) {
  const sp = await searchParams;
  const now = nowIST();
  const match = /^(\d{4})-(\d{2})$/.exec(sp.m ?? "");
  const year = match ? Number(match[1]) : now.year;
  const month = match ? Math.min(Math.max(Number(match[2]), 1), 12) - 1 : now.month;
  const metric = METRICS[sp.metric ?? "distance"] ?? METRICS.distance;
  const range = monthRangeIST(year, month);
  const [user, rows, challenge] = await Promise.all([
    getUser(),
    leaderboard(range, metric.key, 25),
    db.challenge.findFirst({ where: { startDate: { lte: new Date() }, endDate: { gte: new Date() } }, orderBy: { endDate: "asc" } }),
  ]);
  const label = new Date(Date.UTC(year, month, 15)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
  const ym = (y: number, m: number) => { const d = new Date(Date.UTC(y, m, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`; };
  const href = (o: { m?: string; metric?: string }) => `/leaderboard?${new URLSearchParams({ m: o.m ?? ym(year, month), metric: o.metric ?? sp.metric ?? "distance" })}`;

  return (
    <div className="container-x py-14">
      <SectionHeading eyebrow="Leaderboard" title={label} text="Rankings are based on runs logged by members. Every run counts, so keep showing up." />
      <div className="mb-6 mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {Object.entries(METRICS).map(([k, v]) => <Link key={k} href={href({ metric: k })} className={`btn btn-sm ${metric === v ? "btn-dark" : ""}`}>{v.label}</Link>)}
        </div>
        <div className="flex gap-2">
          <Link href={href({ m: ym(year, month - 1) })} className="btn btn-sm">&larr; Previous</Link>
          <Link href={href({ m: ym(now.year, now.month) })} className="btn btn-sm">This month</Link>
          <Link href={href({ m: ym(year, month + 1) })} className="btn btn-sm">Next &rarr;</Link>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="card"><LeaderboardList rows={rows} unit={metric.unit} highlightId={user?.id} /></div>
        <aside className="space-y-4">
          {challenge && (
            <div className="card">
              <span className="badge badge-brand">Live challenge</span>
              <h2 className="mt-2 text-lg font-bold">{challenge.title}</h2>
              <p className="mt-1 text-sm text-muted">{challenge.description}</p>
              <Link href={user ? `/challenges/${challenge.id}` : "/signup"} className="btn btn-primary btn-sm mt-4">{user ? "View challenge" : "Join to take part"}</Link>
            </div>
          )}
          {!user && (
            <div className="card">
              <h2 className="text-lg font-bold">Want to see your name here?</h2>
              <p className="mt-1 text-sm text-muted">Create a free account, log your runs, and climb the board.</p>
              <Link href="/signup" className="btn btn-primary btn-sm mt-4">Join the club</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
