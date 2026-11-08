import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, SectionHeading } from "@/components/ui";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = { title: "Club news", description: "News, results and announcements from RunWithMeClub.", alternates: { canonical: "/news" } };
export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const posts = await db.announcement.findMany({ where: { isPublic: true }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 50 });
  return (
    <div className="container-x py-14">
      <SectionHeading eyebrow="News" title="Club news and announcements" />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {posts.length === 0 && <div className="md:col-span-2"><EmptyState title="No news yet" text="Check back soon." /></div>}
        {posts.map((n) => (
          <Link key={n.id} href={`/news/${n.id}`} className="card hover-lift">
            <div className="flex items-center gap-2 text-xs text-muted">{fmtDate(n.createdAt)}{n.pinned && <span className="badge badge-brand">Pinned</span>}</div>
            <h2 className="mt-2 text-xl font-bold">{n.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm text-muted">{n.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
