import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, news] = await Promise.all([
    db.event.findMany({ where: { status: { not: "DRAFT" } }, select: { slug: true, startsAt: true } }),
    db.announcement.findMany({ where: { isPublic: true }, select: { id: true, createdAt: true } }),
  ]);
  const base = ["", "/about", "/events", "/programs", "/leaderboard", "/news", "/join", "/faq", "/contact", "/privacy", "/terms", "/conduct"];
  return [
    ...base.map((p) => ({ url: `${env.appUrl}${p}` })),
    ...events.map((e) => ({ url: `${env.appUrl}/events/${e.slug}`, lastModified: e.startsAt })),
    ...news.map((n) => ({ url: `${env.appUrl}/news/${n.id}`, lastModified: n.createdAt })),
  ];
}
