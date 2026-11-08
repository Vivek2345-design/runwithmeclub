import { Megaphone, Pin } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Announcements" };
export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  await requireUser("/community");
  const posts = await db.announcement.findMany({ orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 50, include: { author: { select: { name: true } } } });
  return (
    <>
      <PageHeader title="Announcements" description="News and updates from your coaches and the club team." />
      {posts.length === 0 ? <EmptyState icon={<Megaphone size={22} />} title="Nothing here yet" /> : (
        <ul className="space-y-4">{posts.map((n) => (
          <li key={n.id} className={`card ${n.pinned ? "!border-brand/50" : ""}`}>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">{n.pinned && <span className="badge badge-brand"><Pin size={11} /> Pinned</span>}<span>{fmtDate(n.createdAt)}</span>{n.author && <span>&middot; {n.author.name}</span>}{!n.isPublic && <span className="badge">Members only</span>}</div>
            <h2 className="mt-2 text-lg font-bold">{n.title}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{n.body}</p>
          </li>
        ))}</ul>
      )}
    </>
  );
}
