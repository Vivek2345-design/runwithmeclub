import { Download, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/EventForm";
import { ConfirmButton, SubmitButton } from "@/components/client";
import { Avatar, Badge, Flash, PageHeader, StatCard } from "@/components/ui";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { requireStaff } from "@/lib/session";
import { deleteEvent, removeRegistration, toggleCheckIn, updateEvent } from "../../actions";

export const metadata: Metadata = { title: "Event" };
export const dynamic = "force-dynamic";

export default async function AdminEvent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const e = await db.event.findUnique({ where: { id }, include: { registrations: { where: { status: { in: ["GOING", "WAITLIST"] } }, orderBy: { createdAt: "asc" }, include: { user: true } } } });
  if (!e) notFound();
  const going = e.registrations.filter((r) => r.status === "GOING");
  const wait = e.registrations.filter((r) => r.status === "WAITLIST");
  const checked = going.filter((r) => r.checkedInAt).length;

  const row = (r: (typeof e.registrations)[number], idx: number) => (
    <tr key={r.id}>
      <td className="w-8 text-muted">{idx + 1}</td>
      <td><Link href={`/admin/members/${r.userId}`} className="flex items-center gap-2.5 hover:opacity-80"><Avatar name={r.user.name} size={30} /><div className="min-w-0"><div className="truncate font-medium">{r.user.name}</div><div className="truncate text-xs text-muted">{r.user.phone ?? r.user.email}</div></div></Link></td>
      <td className="whitespace-nowrap text-xs text-muted">{fmtDateTime(r.createdAt)}</td>
      <td className="text-right">
        <div className="flex justify-end gap-2">
          {r.status === "GOING" && <form action={toggleCheckIn.bind(null, r.id, e.id)}><SubmitButton className={`btn btn-sm ${r.checkedInAt ? "btn-primary" : ""}`} pendingText="…">{r.checkedInAt ? "✓ Checked in" : "Check in"}</SubmitButton></form>}
          <form action={removeRegistration.bind(null, r.id, e.id)}><ConfirmButton message={`Remove ${r.user.name} from this event?`} className="btn btn-sm btn-ghost btn-danger">Remove</ConfirmButton></form>
        </div>
      </td>
    </tr>
  );

  return (
    <>
      <PageHeader back={{ href: "/admin/events", label: "Events" }} title={e.title} description={fmtDateTime(e.startsAt)}
        actions={<><Badge tone={e.status === "PUBLISHED" ? "badge-good" : e.status === "DRAFT" ? "badge-warn" : "badge-bad"}>{e.status}</Badge>{e.status !== "DRAFT" && <Link href={`/events/${e.slug}`} className="btn btn-sm" target="_blank"><ExternalLink size={15} /> Public page</Link>}<a href={`/admin/events/${e.id}/export`} className="btn btn-sm"><Download size={15} /> Attendees CSV</a></>} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Going" value={going.length} hint={e.capacity ? `of ${e.capacity} places` : "unlimited"} />
        <StatCard label="Waitlist" value={wait.length} tone="warn" />
        <StatCard label="Checked in" value={checked} tone="good" hint={going.length ? `${Math.round((checked / going.length) * 100)}% of going` : undefined} />
        <StatCard label="Fee" value={e.priceInr ? `₹${e.priceInr}` : "Free"} tone="teal" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="min-w-0 space-y-6">
          <section className="card !p-2 sm:!p-4">
            <h2 className="mb-2 px-2 font-bold sm:px-0">Going ({going.length})</h2>
            {going.length === 0 ? <p className="px-2 pb-2 text-sm text-muted">No registrations yet.</p> : <div className="overflow-x-auto"><table className="table"><tbody>{going.map(row)}</tbody></table></div>}
          </section>
          {wait.length > 0 && <section className="card !p-2 sm:!p-4"><h2 className="mb-2 px-2 font-bold sm:px-0">Waitlist ({wait.length})</h2><div className="overflow-x-auto"><table className="table"><tbody>{wait.map(row)}</tbody></table></div></section>}
        </div>
        <aside className="min-w-0 space-y-6">
          <section className="card"><h2 className="mb-4 font-bold">Edit event</h2><EventForm action={updateEvent.bind(null, e.id)} e={e} submit="Save changes" /></section>
          <section className="card !border-bad/40"><h2 className="font-bold">Delete event</h2><p className="mb-3 mt-1 text-sm text-muted">Removes the event and all its registrations. To keep history, cancel it instead.</p><form action={deleteEvent.bind(null, e.id)}><ConfirmButton message="Delete this event and all registrations?" className="btn btn-danger btn-sm">Delete event</ConfirmButton></form></section>
        </aside>
      </div>
    </>
  );
}
