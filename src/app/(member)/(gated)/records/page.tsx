import { Medal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { athleteOverview } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Personal records" };
export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const user = await requireUser("/records");
  const { records } = await athleteOverview(user.id);
  return (
    <>
      <PageHeader title="Personal records" description="Your best efforts, found automatically. 'Fastest run' ranks whole runs of at least that distance by average pace, so it's an approximation of your true best." />
      {records.length === 0 ? <EmptyState icon={<Medal size={22} />} title="No records yet" text="Log a few runs and your bests appear here." action={<Link href="/activities/new" className="btn btn-primary">Log a run</Link>} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((r) => (
            <Link key={r.label} href={`/activities/${r.activityId}`} className="card hover-lift">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"><Medal size={15} className="text-brand" />{r.label}</div>
              <div className="display mt-2 text-3xl font-extrabold tabular-nums text-brand">{r.value}</div>
              <div className="mt-1 truncate text-sm font-medium">{r.activityName}</div>
              <div className="text-xs text-muted">{fmtDate(r.date)}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
