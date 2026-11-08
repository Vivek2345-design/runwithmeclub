import { Plus, Route } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActivityTable } from "@/components/ActivityTable";
import { EmptyState, Flash, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Activities" };
export const dynamic = "force-dynamic";
const PAGE = 25;

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<{ page?: string; sport?: string; ok?: string; error?: string }> }) {
  const user = await requireUser("/activities");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = { userId: user.id, ...(sp.sport ? { sportType: sp.sport } : {}) };
  const [rows, total, sports] = await Promise.all([
    db.activity.findMany({ where, orderBy: { startDate: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
    db.activity.count({ where }),
    db.activity.groupBy({ by: ["sportType"], where: { userId: user.id }, _count: true }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (p: number) => `?${new URLSearchParams({ ...(sp.sport ? { sport: sp.sport } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Activities" description="Every run you've logged, uploaded or imported." actions={<Link href="/activities/new" className="btn btn-primary"><Plus size={17} /> Log activity</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      {sports.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Link href="/activities" className={`btn btn-sm ${!sp.sport ? "btn-dark" : ""}`}>All</Link>
          {sports.map((s) => <Link key={s.sportType} href={`/activities?sport=${encodeURIComponent(s.sportType)}`} className={`btn btn-sm ${sp.sport === s.sportType ? "btn-dark" : ""}`}>{s.sportType} ({s._count})</Link>)}
        </div>
      )}
      {rows.length === 0 ? (
        <EmptyState icon={<Route size={22} />} title="No activities yet" text="Log your first run, upload a GPX file from your watch, or connect Strava in your profile." action={<Link href="/activities/new" className="btn btn-primary">Log your first run</Link>} />
      ) : (
        <>
          <div className="card !p-2 sm:!p-4"><ActivityTable rows={rows} /></div>
          <div className="mt-4 flex items-center justify-between text-sm text-muted">
            <span>{total} activities</span>
            <div className="flex items-center gap-2">
              {page > 1 && <Link className="btn btn-sm" href={qs(page - 1)}>Previous</Link>}
              <span>Page {page} of {pages}</span>
              {page < pages && <Link className="btn btn-sm" href={qs(page + 1)}>Next</Link>}
            </div>
          </div>
        </>
      )}
    </>
  );
}
