import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fmtDateLong } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const n = await db.announcement.findFirst({ where: { id: (await params).id, isPublic: true } });
  return n ? { title: n.title, description: n.body.slice(0, 155) } : { title: "Not found" };
}

export default async function NewsPost({ params }: { params: Promise<{ id: string }> }) {
  const n = await db.announcement.findFirst({ where: { id: (await params).id, isPublic: true }, include: { author: { select: { name: true } } } });
  if (!n) notFound();
  return (
    <article className="container-x max-w-3xl py-14">
      <Link href="/news" className="text-sm text-muted hover:text-ink">&larr; All news</Link>
      <h1 className="mt-3 text-4xl font-extrabold">{n.title}</h1>
      <p className="mt-2 text-sm text-muted">{fmtDateLong(n.createdAt)}{n.author ? ` · ${n.author.name}` : ""}</p>
      <div className="prose-club mt-8 whitespace-pre-line">{n.body}</div>
    </article>
  );
}
