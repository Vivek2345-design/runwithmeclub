import { Flame, Gauge, Mountain, Timer } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActivityForm } from "@/components/ActivityForm";
import { ConfirmButton } from "@/components/client";
import { Badge, Flash, PageHeader, StatCard } from "@/components/ui";
import { db } from "@/lib/db";
import { fmtDateTime, km, paceOrSpeed, stravaUrl } from "@/lib/format";
import { formatDuration } from "@/lib/metrics";
import { requireUser } from "@/lib/session";
import { deleteActivity, updateActivity } from "../actions";

export const metadata: Metadata = { title: "Activity" };
export const dynamic = "force-dynamic";

export default async function ActivityPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/activities/${id}`);
  const sp = await searchParams;
  const a = await db.activity.findFirst({ where: { id, userId: user.id } });
  if (!a) notFound();
  const editable = a.source !== "STRAVA";
  return (
    <>
      <PageHeader back={{ href: "/activities", label: "Activities" }} title={a.name} description={`${a.sportType} · ${fmtDateTime(a.startDate)}`}
        actions={<>
          <Badge>{a.source}</Badge>
          {a.stravaId && <a className="btn btn-sm" href={stravaUrl(a.stravaId)} target="_blank" rel="noreferrer">View on Strava</a>}
          <form action={deleteActivity.bind(null, a.id)}><ConfirmButton message="Delete this activity? This cannot be undone.">Delete</ConfirmButton></form>
        </>} />
      <Flash ok={sp.ok} error={sp.error === "duplicate" ? "invalid" : sp.error} />
      {sp.error === "duplicate" && <p className="mb-5 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn">You&rsquo;ve already logged an activity at this time, so we didn&rsquo;t add a duplicate. Here it is.</p>}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Distance" value={km(a.distance)} icon={<Gauge size={17} />} />
        <StatCard label="Time" value={formatDuration(a.movingTime)} icon={<Timer size={17} />} tone="teal" />
        <StatCard label="Pace / speed" value={paceOrSpeed(a.sportType, a.distance, a.movingTime)} />
        <StatCard label="Elevation" value={`${Math.round(a.elevationGain)} m`} icon={<Mountain size={17} />} tone="warn" hint={`Load ${Math.round(a.load)}`} />
      </div>
      {a.avgHr && <p className="mb-4 flex items-center gap-2 text-sm text-muted"><Flame size={16} className="text-brand" /> Average heart rate {Math.round(a.avgHr)} bpm</p>}
      {editable ? (
        <div className="card max-w-2xl"><h2 className="mb-4 font-bold">Edit activity</h2><ActivityForm action={updateActivity.bind(null, a.id)} a={a} submit="Save changes" /></div>
      ) : (
        <p className="text-sm text-muted">Strava activities are managed in Strava, so they can&rsquo;t be edited here.</p>
      )}
      {a.notes && <div className="card mt-6 max-w-2xl"><h2 className="mb-1 font-bold">Notes</h2><p className="whitespace-pre-line text-sm text-muted">{a.notes}</p></div>}
    </>
  );
}
