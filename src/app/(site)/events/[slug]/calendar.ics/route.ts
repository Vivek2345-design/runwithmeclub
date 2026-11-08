import { db } from "@/lib/db";
import { env } from "@/lib/env";

const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const e = await db.event.findUnique({ where: { slug: (await params).slug } });
  if (!e || e.status === "DRAFT") return new Response("Not found", { status: 404 });
  const end = e.endsAt ?? new Date(e.startsAt.getTime() + 90 * 60 * 1000);
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//RunWithMeClub//Events//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@runwithmeclub`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(e.startsAt)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(e.title)}`,
    `LOCATION:${esc(e.location)}`,
    `DESCRIPTION:${esc(`${e.description}\n\n${env.appUrl}/events/${e.slug}`)}`,
    e.status === "CANCELLED" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${e.slug}.ics"` } });
}
