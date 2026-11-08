import { CalendarCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/client";
import { EmptyState, Flash, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { fmtDateLong, fmtTime } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { cancelRsvp } from "../../../(site)/events/actions";

export const metadata: Metadata = { title: "My events" };
export const dynamic = "force-dynamic";

export default async function MyEventsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requireUser("/my-events");
  const sp = await searchParams;
  const regs = await db.registration.findMany({ where: { userId: user.id, status: { in: ["GOING", "WAITLIST"] } }, include: { event: true }, orderBy: { event: { startsAt: "asc" } } });
  const now = Date.now();
  const upcoming = regs.filter((r) => r.event.startsAt.getTime() >= now - 3 * 3600000);
  const past = regs.filter((r) => r.event.startsAt.getTime() < now - 3 * 3600000).reverse();
  return (
    <>
      <PageHeader title="My events" description="Events you've registered for." actions={<Link href="/events" className="btn btn-primary">Browse events</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      {upcoming.length === 0 ? <EmptyState icon={<CalendarCheck size={22} />} title="No upcoming events" text="Find a group run or race and register in one tap." action={<Link href="/events" className="btn btn-primary">Browse events</Link>} /> : (
        <ul className="space-y-3">{upcoming.map((r) => (
          <li key={r.id} className="card flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1"><Link href={`/events/${r.event.slug}`} className="font-bold hover:text-brand">{r.event.title}</Link><p className="text-sm text-muted">{fmtDateLong(r.event.startsAt)} &middot; {fmtTime(r.event.startsAt)} &middot; {r.event.location}</p></div>
            <span className={`badge ${r.status === "GOING" ? "badge-good" : "badge-warn"}`}>{r.status === "GOING" ? "Going" : "Waitlist"}</span>
            <form action={cancelRsvp.bind(null, r.eventId, "my")}><SubmitButton className="btn btn-sm" pendingText="…">Cancel</SubmitButton></form>
          </li>
        ))}</ul>
      )}
      {past.length > 0 && (<><h2 className="mb-3 mt-10 text-lg font-bold">Past events</h2><ul className="space-y-2">{past.map((r) => <li key={r.id} className="card-flat flex items-center justify-between text-sm"><span>{r.event.title} <span className="text-muted">&middot; {fmtDateLong(r.event.startsAt)}</span></span>{r.checkedInAt && <span className="badge badge-good">Attended</span>}</li>)}</ul></>)}
    </>
  );
}
