import { FileUp, PencilLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActivityForm } from "@/components/ActivityForm";
import { SubmitButton } from "@/components/client";
import { Field, Flash, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { createActivity, uploadGpx } from "../actions";

export const metadata: Metadata = { title: "Log activity" };

export default async function NewActivityPage({ searchParams }: { searchParams: Promise<{ tab?: string; error?: string }> }) {
  await requireUser("/activities/new");
  const sp = await searchParams;
  const gpx = sp.tab === "gpx";
  return (
    <>
      <PageHeader back={{ href: "/activities", label: "Activities" }} title="Log an activity" description="Enter it by hand, or upload a GPX file exported from your watch or running app." />
      <div className="mb-5 inline-flex rounded-xl border border-line bg-surface p-1 text-sm font-semibold">
        <Link href="/activities/new" className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 ${!gpx ? "bg-brand text-brand-ink" : "text-muted"}`}><PencilLine size={16} /> Enter manually</Link>
        <Link href="/activities/new?tab=gpx" className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 ${gpx ? "bg-brand text-brand-ink" : "text-muted"}`}><FileUp size={16} /> Upload GPX</Link>
      </div>
      <Flash error={sp.error} />
      <div className="card max-w-2xl">
        {!gpx ? (
          <ActivityForm action={createActivity} submit="Save activity" />
        ) : (
          <form action={uploadGpx} className="space-y-4">
            <Field label="GPX file" htmlFor="file" hint="Up to 5 MB. We read distance, time and elevation; the route itself isn't stored."><input id="file" name="file" type="file" accept=".gpx,application/gpx+xml" required className="input file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:font-semibold file:text-brand" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name (optional)" htmlFor="gname"><input id="gname" name="name" className="input" maxLength={120} placeholder="Uses the name in the file" /></Field>
              <Field label="Sport" htmlFor="gsport"><select id="gsport" name="sportType" className="input">{["Run", "TrailRun", "Walk", "Hike", "Ride"].map((s) => <option key={s}>{s}</option>)}</select></Field>
            </div>
            <SubmitButton pendingText="Reading file…">Upload and save</SubmitButton>
          </form>
        )}
      </div>
    </>
  );
}
