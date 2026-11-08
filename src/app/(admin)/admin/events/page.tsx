import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, EmptyState, Flash, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { EVENT_TYPES, fmtDate, fmtTime, inr } from "@/lib/format";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Manage events" };
export const dynamic = "force-dynamic";

export default async function AdminEvents({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; past?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const past = sp.past === "1";
  const events = await db.event.findMany({
    where: { startsAt: past ? { lt: new Date() } : { gte: new Date() } },
    orderBy: { startsAt: past ? "desc" : "asc" },
    include: { registrations: { select: { status: true, checkedInAt: true } } },
  });
  return (
    <>
      <PageHeader title="Events" description="Create runs, races and workshops, and manage registrations." actions={<><Link href={past ? "/admin/events" : "/admin/events?past=1"} className="btn btn-sm">{past ? "Show upcoming" : "Show past"}</Link><Link href="/admin/events/new" className="btn btn-primary btn-sm"><Plus size={16} /> New event</Link></>} />
      <Flash ok={sp.ok} error={sp.error} />
      {events.length === 0 ? <EmptyState title={past ? "No past events" : "No upcoming events"} action={<Link href="/admin/events/new" className="btn btn-primary btn-sm">Create an event</Link>} /> : (
        <div className="card overflow-x-auto !p-2 sm:!p-3">
          <table className="table">
            <thead><tr><th>Event</th><th>When</th><th>Status</th><th className="text-right">Going</th><th className="text-right">Waitlist</th><th className="text-right">Checked in</th><th className="text-right">Fee</th></tr></thead>
            <tbody>{events.map((e) => {
              const going = e.registrations.filter((r) => r.status === "GOING");
              return (
                <tr key={e.id}>
                  <td><Link href={`/admin/events/${e.id}`} className="font-semibold hover:text-brand">{e.title}</Link><div className="text-xs text-muted">{EVENT_TYPES[e.type]?.label} &middot; {e.location}</div></td>
                  <td className="whitespace-nowrap text-muted">{fmtDate(e.startsAt)}<br />{fmtTime(e.startsAt)}</td>
                  <td><Badge tone={e.status === "PUBLISHED" ? "badge-good" : e.status === "DRAFT" ? "badge-warn" : "badge-bad"}>{e.status === "PUBLISHED" ? "Published" : e.status === "DRAFT" ? "Draft" : "Cancelled"}</Badge></td>
                  <td className="text-right tabular-nums">{going.length}{e.capacity ? ` / ${e.capacity}` : ""}</td>
                  <td className="text-right tabular-nums">{e.registrations.filter((r) => r.status === "WAITLIST").length}</td>
                  <td className="text-right tabular-nums">{going.filter((r) => r.checkedInAt).length}</td>
                  <td className="text-right">{inr(e.priceInr)}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
