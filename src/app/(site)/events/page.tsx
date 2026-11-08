import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { EmptyState, SectionHeading } from "@/components/ui";
import { db } from "@/lib/db";
import { EVENT_TYPES } from "@/lib/format";

export const metadata: Metadata = { title: "Events", description: "Group runs, races, workshops and socials. Find your next run with RunWithMeClub.", alternates: { canonical: "/events" } };
export const dynamic = "force-dynamic";

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ type?: string; past?: string }> }) {
  const sp = await searchParams;
  const past = sp.past === "1";
  const type = sp.type && EVENT_TYPES[sp.type] ? sp.type : undefined;
  const now = new Date(Date.now() - 3 * 3600 * 1000);
  const events = await db.event.findMany({
    where: { status: { in: ["PUBLISHED", "CANCELLED"] }, startsAt: past ? { lt: now } : { gte: now }, ...(type ? { type } : {}) },
    orderBy: { startsAt: past ? "desc" : "asc" },
    take: 60,
    include: { _count: { select: { registrations: { where: { status: "GOING" } } } } },
  });
  const q = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ type, past: past ? "1" : undefined, ...o }).filter(([, v]) => v) as [string, string][]);
    return `/events${p.size ? `?${p}` : ""}`;
  };
  return (
    <div className="container-x py-14">
      <SectionHeading eyebrow="Events" title={past ? "Past events" : "Upcoming events"} text="Register in one tap. If an event is full, join the waitlist and we'll move you up when a spot opens." />
      <div className="mb-8 mt-8 flex flex-wrap items-center gap-2">
        <Link href={q({ type: undefined })} className={`btn btn-sm ${!type ? "btn-dark" : ""}`}>All</Link>
        {Object.entries(EVENT_TYPES).map(([k, v]) => (
          <Link key={k} href={q({ type: k })} className={`btn btn-sm ${type === k ? "btn-dark" : ""}`}>{v.label}</Link>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
        <Link href={q({ past: past ? undefined : "1" })} className="btn btn-ghost btn-sm">{past ? "Show upcoming" : "Show past events"}</Link>
      </div>
      {events.length === 0 ? (
        <EmptyState title="No events here yet" text="Try another filter, or check back soon for new runs." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{events.map((e) => <EventCard key={e.id} e={e} />)}</div>
      )}
    </div>
  );
}
