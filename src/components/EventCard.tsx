import { Calendar, Clock, MapPin, Route, Users } from "lucide-react";
import Link from "next/link";
import { EVENT_TYPES, fmtDay, fmtMonth, fmtTime, fmtWeekday, inr } from "@/lib/format";
import { Badge } from "./ui";

type EventLike = {
  slug: string; title: string; type: string; status: string; startsAt: Date; location: string;
  distanceKm: number | null; capacity: number | null; priceInr: number; hue: number;
  _count?: { registrations: number };
};

export function EventCard({ e }: { e: EventLike }) {
  const t = EVENT_TYPES[e.type] ?? EVENT_TYPES.GROUP_RUN;
  const going = e._count?.registrations ?? 0;
  const full = e.capacity !== null && going >= e.capacity;
  return (
    <Link href={`/events/${e.slug}`} className="card hover-lift group flex flex-col overflow-hidden !p-0">
      <div
        className="relative flex h-28 items-end justify-between p-4 text-white"
        style={{ background: `linear-gradient(135deg, hsl(${e.hue} 85% 52%), hsl(${(e.hue + 35) % 360} 80% 38%))` }}
      >
        <svg className="absolute inset-0 h-full w-full opacity-25" viewBox="0 0 300 112" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-10 90 C 50 20, 90 110, 150 50 S 250 10, 320 60" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <div className="relative rounded-xl bg-white px-3 py-1.5 text-center text-[#12161c] shadow">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#5d6877]">{fmtMonth(e.startsAt)}</div>
          <div className="display text-xl font-extrabold leading-none">{fmtDay(e.startsAt)}</div>
        </div>
        <span className="badge relative !bg-black/35 !text-white backdrop-blur">{t.label}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-bold leading-snug group-hover:text-brand">{e.title}</h3>
        <ul className="mt-3 space-y-1.5 text-sm text-muted">
          <li className="flex items-center gap-2"><Clock size={15} />{fmtWeekday(e.startsAt)}, {fmtTime(e.startsAt)}</li>
          <li className="flex items-center gap-2"><MapPin size={15} /><span className="truncate">{e.location}</span></li>
          {e.distanceKm ? <li className="flex items-center gap-2"><Route size={15} />{e.distanceKm} km</li> : null}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
          <span className="flex items-center gap-1.5 text-muted"><Users size={15} />{going}{e.capacity ? ` / ${e.capacity}` : ""} going</span>
          {e.status === "CANCELLED" ? <Badge tone="badge-bad">Cancelled</Badge> : full ? <Badge tone="badge-warn">Full</Badge> : <span className="font-semibold">{inr(e.priceInr)}</span>}
        </div>
      </div>
    </Link>
  );
}

export function DateChip({ d }: { d: Date }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted"><Calendar size={15} />{fmtMonth(d)} {fmtDay(d)}</span>
  );
}
