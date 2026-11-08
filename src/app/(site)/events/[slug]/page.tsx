import { CalendarPlus, Clock, IndianRupee, MapPin, Route, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { EVENT_TYPES, fmtDateLong, fmtTime, inr, publicName } from "@/lib/format";
import { getUser } from "@/lib/session";
import { cancelRsvp, rsvp } from "../actions";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  return db.event.findUnique({
    where: { slug },
    include: { registrations: { where: { status: { in: ["GOING", "WAITLIST"] } }, orderBy: { createdAt: "asc" }, include: { user: { select: { id: true, name: true } } } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = await load((await params).slug);
  if (!e || e.status === "DRAFT") return { title: "Event not found" };
  return { title: e.title, description: e.description.slice(0, 155), alternates: { canonical: `/events/${e.slug}` } };
}

export default async function EventPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const [e, user] = await Promise.all([load(slug), getUser()]);
  if (!e || e.status === "DRAFT") notFound();

  const going = e.registrations.filter((r) => r.status === "GOING");
  const waitlist = e.registrations.filter((r) => r.status === "WAITLIST");
  const mine = user ? e.registrations.find((r) => r.userId === user.id) : undefined;
  const full = e.capacity !== null && going.length >= e.capacity;
  const past = e.startsAt.getTime() < Date.now();
  const open = e.status === "PUBLISHED" && !past;
  const t = EVENT_TYPES[e.type] ?? EVENT_TYPES.GROUP_RUN;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    startDate: e.startsAt.toISOString(),
    ...(e.endsAt ? { endDate: e.endsAt.toISOString() } : {}),
    eventStatus: e.status === "CANCELLED" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: e.location },
    description: e.description,
    offers: { "@type": "Offer", price: e.priceInr, priceCurrency: "INR", url: `${env.appUrl}/events/${e.slug}` },
    organizer: { "@type": "Organization", name: "RunWithMeClub", url: env.appUrl },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, hsl(${e.hue} 85% 48%), hsl(${(e.hue + 40) % 360} 75% 30%))` }}>
        <svg className="absolute inset-0 h-full w-full opacity-20" viewBox="0 0 800 240" preserveAspectRatio="none" aria-hidden="true"><path d="M-20 200 C 150 40, 250 260, 420 120 S 680 20, 840 130" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" /></svg>
        <div className="container-x relative py-14">
          <Link href="/events" className="text-sm text-white/80 hover:text-white">&larr; All events</Link>
          <div className="mt-4 flex flex-wrap items-center gap-2"><span className="badge !bg-black/35 !text-white backdrop-blur">{t.label}</span>{e.status === "CANCELLED" && <span className="badge !bg-black/35 !text-white">Cancelled</span>}{past && e.status !== "CANCELLED" && <span className="badge !bg-black/35 !text-white">Past event</span>}</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold sm:text-5xl">{e.title}</h1>
          <p className="mt-3 text-lg text-white/90">{fmtDateLong(e.startsAt)} &middot; {fmtTime(e.startsAt)}</p>
        </div>
      </div>

      <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <Flash ok={sp.ok} error={sp.error} />
          <h2 className="text-xl font-bold">About this event</h2>
          <p className="mt-3 whitespace-pre-line leading-7 text-muted">{e.description}</p>

          <h2 className="mt-10 text-xl font-bold">Who&rsquo;s going ({going.length})</h2>
          {going.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Be the first to register.</p>
          ) : (
            <ul className="mt-4 flex flex-wrap gap-3">
              {going.slice(0, 30).map((r) => (
                <li key={r.id} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-sm"><Avatar name={r.user.name} size={26} />{publicName(r.user.name)}</li>
              ))}
              {going.length > 30 && <li className="self-center text-sm text-muted">+{going.length - 30} more</li>}
            </ul>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card space-y-4">
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3"><Clock size={18} className="mt-0.5 shrink-0 text-brand" /><span>{fmtDateLong(e.startsAt)}<br /><span className="text-muted">{fmtTime(e.startsAt)}{e.endsAt ? ` to ${fmtTime(e.endsAt)}` : ""} IST</span></span></li>
              <li className="flex gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-brand" /><span>{e.location}</span></li>
              {e.distanceKm ? <li className="flex gap-3"><Route size={18} className="mt-0.5 shrink-0 text-brand" /><span>{e.distanceKm} km</span></li> : null}
              <li className="flex gap-3"><IndianRupee size={18} className="mt-0.5 shrink-0 text-brand" /><span>{inr(e.priceInr)}</span></li>
              <li className="flex gap-3"><Users size={18} className="mt-0.5 shrink-0 text-brand" /><span>{going.length}{e.capacity ? ` of ${e.capacity}` : ""} going{waitlist.length > 0 && <span className="text-muted"> &middot; {waitlist.length} waitlisted</span>}</span></li>
            </ul>

            {open && (
              <div className="border-t border-line pt-4">
                {!user ? (
                  <Link href={`/login?next=${encodeURIComponent(`/events/${e.slug}`)}`} className="btn btn-primary w-full">Log in to register</Link>
                ) : mine && mine.status !== "CANCELLED" ? (
                  <div className="space-y-2">
                    <p className="rounded-xl bg-good/10 px-3 py-2 text-center text-sm font-semibold text-good">{mine.status === "GOING" ? "You're going" : "You're on the waitlist"}</p>
                    <form action={cancelRsvp.bind(null, e.id, "event")}><SubmitButton className="btn w-full">Cancel my spot</SubmitButton></form>
                  </div>
                ) : (
                  <form action={rsvp.bind(null, e.id, "event")}><SubmitButton className="btn btn-primary w-full" pendingText="Registering\u2026">{full ? "Join the waitlist" : "Register now"}</SubmitButton></form>
                )}
              </div>
            )}
            {!open && <p className="border-t border-line pt-4 text-sm text-muted">{e.status === "CANCELLED" ? "This event has been cancelled." : "Registration is closed for this event."}</p>}
          </div>
          {open && <a href={`/events/${e.slug}/calendar.ics`} className="btn w-full"><CalendarPlus size={17} /> Add to calendar</a>}
        </aside>
      </div>
    </div>
  );
}
