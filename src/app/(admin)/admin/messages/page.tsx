import { Mail } from "lucide-react";
import type { Metadata } from "next";
import { ConfirmButton, SubmitButton } from "@/components/client";
import { EmptyState, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { requireStaff } from "@/lib/session";
import { deleteMessage, setMessageStatus } from "../actions";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const archived = sp.view === "archived";
  const msgs = await db.contactMessage.findMany({ where: { status: archived ? "ARCHIVED" : { not: "ARCHIVED" } }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <PageHeader title="Messages" description="Enquiries sent through the Contact form." actions={<a href={archived ? "/admin/messages" : "/admin/messages?view=archived"} className="btn btn-sm">{archived ? "Show inbox" : "Show archived"}</a>} />
      {msgs.length === 0 ? <EmptyState icon={<Mail size={22} />} title={archived ? "No archived messages" : "Inbox zero"} text="New enquiries will appear here." /> : (
        <ul className="space-y-3">{msgs.map((m) => (
          <li key={m.id} className={`card ${m.status === "NEW" ? "!border-brand/50" : ""}`}>
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{m.subject}</h2>{m.status === "NEW" && <span className="badge badge-brand">New</span>}</div>
            <p className="text-xs text-muted">{m.name} &middot; <a className="underline" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>{m.email}</a> &middot; {fmtDateTime(m.createdAt)}</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-6">{m.body}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a className="btn btn-sm btn-primary" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>Reply by email</a>
              {m.status === "NEW" && <form action={setMessageStatus.bind(null, m.id, "READ")}><SubmitButton className="btn btn-sm" pendingText="…">Mark as read</SubmitButton></form>}
              {m.status !== "ARCHIVED" ? <form action={setMessageStatus.bind(null, m.id, "ARCHIVED")}><SubmitButton className="btn btn-sm" pendingText="…">Archive</SubmitButton></form> : <form action={setMessageStatus.bind(null, m.id, "READ")}><SubmitButton className="btn btn-sm" pendingText="…">Move to inbox</SubmitButton></form>}
              <form action={deleteMessage.bind(null, m.id)}><ConfirmButton message="Delete this message permanently?" className="btn btn-sm btn-ghost btn-danger">Delete</ConfirmButton></form>
            </div>
          </li>
        ))}</ul>
      )}
    </>
  );
}
