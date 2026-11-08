import { Pin } from "lucide-react";
import type { Metadata } from "next";
import { ConfirmButton, SubmitButton } from "@/components/client";
import { EmptyState, Field, Flash, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { requireStaff } from "@/lib/session";
import { createAnnouncement, deleteAnnouncement, togglePin } from "../actions";

export const metadata: Metadata = { title: "Announcements" };
export const dynamic = "force-dynamic";

export default async function AdminAnnouncements({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const posts = await db.announcement.findMany({ orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], include: { author: { select: { name: true } } } });
  return (
    <>
      <PageHeader title="Announcements" description="Post news to members, and optionally to the public News page." />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-6 lg:grid-cols-[1fr_26rem]">
        <div className="space-y-3">
          {posts.length === 0 && <EmptyState title="No announcements yet" />}
          {posts.map((n) => (
            <article key={n.id} className="card">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">{n.pinned && <span className="badge badge-brand"><Pin size={11} /> Pinned</span>}<span className={`badge ${n.isPublic ? "badge-teal" : ""}`}>{n.isPublic ? "Public" : "Members only"}</span><span>{fmtDate(n.createdAt)}{n.author ? ` · ${n.author.name}` : ""}</span></div>
              <h2 className="mt-2 font-bold">{n.title}</h2>
              <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-muted">{n.body}</p>
              <div className="mt-3 flex gap-2">
                <form action={togglePin.bind(null, n.id)}><SubmitButton className="btn btn-sm" pendingText="…">{n.pinned ? "Unpin" : "Pin"}</SubmitButton></form>
                <form action={deleteAnnouncement.bind(null, n.id)}><ConfirmButton message="Delete this announcement?" className="btn btn-sm btn-ghost btn-danger">Delete</ConfirmButton></form>
              </div>
            </article>
          ))}
        </div>
        <section className="card h-fit">
          <h2 className="mb-4 font-bold">New announcement</h2>
          <form action={createAnnouncement} className="space-y-4">
            <Field label="Title" htmlFor="title"><input id="title" name="title" className="input" required minLength={3} maxLength={120} /></Field>
            <Field label="Message" htmlFor="body"><textarea id="body" name="body" className="input" rows={7} required minLength={5} maxLength={5000} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" className="h-4 w-4 accent-[var(--brand)]" /> Pin to the top</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPublic" className="h-4 w-4 accent-[var(--brand)]" /> Also show on the public News page</label>
            <SubmitButton pendingText="Publishing…">Publish</SubmitButton>
          </form>
        </section>
      </div>
    </>
  );
}
