import { ArrowRight, CalendarCheck, HeartHandshake, LineChart, Medal, Route, Timer, Users } from "lucide-react";
import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { LeaderboardList } from "@/components/Leaderboard";
import { SectionHeading } from "@/components/ui";
import { BRAND, PLANS } from "@/lib/brand";
import { db } from "@/lib/db";
import { fmtDateShort, inr } from "@/lib/format";
import { PROGRAMS } from "@/lib/programs";
import { clubStats, currentMonthRange, leaderboard, upcomingEvents } from "@/lib/queries";
import { getUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: Users, title: "Run in a pack", text: "Weekly group runs with pace groups from relaxed to racing, so you always have someone at your speed." },
  { icon: LineChart, title: "See your progress", text: "Log runs or connect Strava. Fitness, fatigue, weekly volume and personal records, all in one place." },
  { icon: CalendarCheck, title: "Coached plans", text: "Structured plans for 5K to marathon, with workouts that appear right on your calendar." },
  { icon: Medal, title: "Monthly challenges", text: "Friendly club-wide challenges and a live leaderboard keep you motivated on the flat days." },
  { icon: Route, title: "Events and races", text: "Group runs, workshops, socials and race-day crews. Register in one tap and get a calendar reminder." },
  { icon: HeartHandshake, title: "Warm community", text: "A welcoming club where beginners are celebrated and nobody gets left behind." },
];

export default async function HomePage() {
  const [user, stats, events, board, news] = await Promise.all([
    getUser(),
    clubStats(),
    upcomingEvents(3),
    leaderboard(currentMonthRange(), "DISTANCE", 5),
    db.announcement.findMany({ where: { isPublic: true }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 3 }),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="hero-bg relative overflow-hidden">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="container-x relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="fade-up mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-good opacity-75" style={{ animation: "pulse-ring 1.8s infinite" }} /><span className="relative inline-flex h-2 w-2 rounded-full bg-good" /></span>
              {stats.upcomingEvents > 0 ? `${stats.upcomingEvents} upcoming events, spots open` : "New members always welcome"}
            </p>
            <h1 className="fade-up d1 text-5xl font-extrabold leading-[1.02] sm:text-7xl">
              Run with <span className="grad-text">people</span> who make you better.
            </h1>
            <p className="fade-up d2 mt-6 max-w-xl text-lg text-muted">
              {BRAND} is a friendly, structured running club. Weekly group runs, coached training plans and monthly challenges for every pace, from your first 5K to your next marathon.
            </p>
            <div className="fade-up d3 mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link href="/dashboard" className="btn btn-primary btn-lg">Go to my dashboard <ArrowRight size={18} /></Link>
              ) : (
                <Link href="/signup" className="btn btn-primary btn-lg">Join the club, it&rsquo;s free <ArrowRight size={18} /></Link>
              )}
              <Link href="/events" className="btn btn-lg">See upcoming runs</Link>
            </div>
            <p className="fade-up d4 mt-4 text-sm text-muted">No fitness test. No pressure. Just show up in running shoes.</p>
          </div>

          {/* Hero visual: animated route + live stat cards */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="card relative aspect-[4/3] overflow-hidden !p-0" style={{ background: "linear-gradient(160deg, color-mix(in srgb, var(--brand) 14%, var(--surface)), var(--surface) 70%)" }}>
              <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <defs><linearGradient id="rt" x1="0" x2="1"><stop offset="0" stopColor="#0f766e" /><stop offset="0.6" stopColor="#f2541b" /><stop offset="1" stopColor="#c7f23a" /></linearGradient></defs>
                <g opacity=".5" stroke="var(--line)" strokeWidth="1">{[50, 100, 150, 200, 250].map((y) => <line key={y} x1="0" x2="400" y1={y} y2={y} />)}{[80, 160, 240, 320].map((x) => <line key={x} y1="0" y2="300" x1={x} x2={x} />)}</g>
                <path className="route-draw" d="M30 240 C 70 150, 110 270, 160 190 S 230 60, 280 130 S 340 210, 372 70" fill="none" stroke="url(#rt)" strokeWidth="7" strokeLinecap="round" />
                <circle cx="30" cy="240" r="8" fill="#0f766e" /><circle cx="372" cy="70" r="9" fill="#c7f23a" stroke="#12161c" strokeWidth="2" />
              </svg>
              <div className="float absolute left-4 top-4 rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-lg backdrop-blur">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted">This month</div>
                <div className="display text-2xl font-extrabold">{stats.kmThisMonth.toLocaleString("en-IN")} <span className="text-sm text-muted">km</span></div>
              </div>
              <div className="float absolute bottom-4 right-4 rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-lg backdrop-blur" style={{ animationDelay: "-3s" }}>
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Runners</div>
                <div className="display text-2xl font-extrabold">{stats.members.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE STATS */}
      <section className="border-y border-line bg-surface">
        <div className="container-x grid grid-cols-2 gap-6 py-8 text-center md:grid-cols-4">
          {[
            [stats.members.toLocaleString("en-IN"), "active members"],
            [stats.kmThisMonth.toLocaleString("en-IN"), "km run this month"],
            [stats.runsThisMonth.toLocaleString("en-IN"), "runs logged this month"],
            [stats.kmAllTime.toLocaleString("en-IN"), "km run together, all time"],
          ].map(([n, l]) => (
            <div key={l}><div className="display text-3xl font-extrabold sm:text-4xl">{n}</div><div className="mt-1 text-sm text-muted">{l}</div></div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="container-x py-20">
        <SectionHeading center eyebrow="Why RunWithMeClub" title="Everything a runner needs, in one club" text="Training, community and tracking, without juggling five apps and three WhatsApp groups." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card hover-lift">
              <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand"><Icon size={22} /></span>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EVENTS */}
      <section className="bg-surface-2/60 py-20">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="What's next" title="Upcoming events" />
            <Link href="/events" className="btn">All events <ArrowRight size={16} /></Link>
          </div>
          {events.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center text-muted">New events are on the way. Check back soon.</p>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => <EventCard key={e.id} e={e} />)}
            </div>
          )}
        </div>
      </section>

      {/* PROGRAMS + LEADERBOARD */}
      <section className="container-x grid gap-10 py-20 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <SectionHeading eyebrow="Training programs" title="A plan for every goal" text="Pick a goal, follow the plan, and your coach will schedule the workouts for you." />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {PROGRAMS.slice(0, 4).map((p) => (
              <li key={p.slug} className="card-flat hover-lift flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-teal"><Timer size={20} /></span>
                <div><div className="font-semibold">{p.name}</div><div className="text-xs text-muted">{p.weeks} weeks &middot; {p.sessions} runs a week &middot; {p.level}</div></div>
              </li>
            ))}
          </ul>
          <Link href="/programs" className="btn mt-6">Explore all programs <ArrowRight size={16} /></Link>
        </div>
        <div className="card">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xl font-extrabold">Leaderboard</h2>
            <span className="badge badge-brand">This month</span>
          </div>
          <LeaderboardList rows={board} unit="km" />
          <Link href="/leaderboard" className="btn btn-sm mt-3 w-full">Full leaderboard</Link>
        </div>
      </section>

      {/* NEWS */}
      {news.length > 0 && (
        <section className="container-x pb-20">
          <SectionHeading eyebrow="Club news" title="Latest from the club" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {news.map((n) => (
              <Link key={n.id} href={`/news/${n.id}`} className="card hover-lift">
                <div className="text-xs text-muted">{fmtDateShort(n.createdAt)}{n.pinned && <span className="ml-2 badge badge-brand">Pinned</span>}</div>
                <h3 className="mt-2 text-lg font-bold">{n.title}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-muted">{n.body}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* MEMBERSHIP CTA */}
      <section className="container-x pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-center text-bg sm:px-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-3xl" style={{ background: "var(--brand)" }} />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full opacity-25 blur-3xl" style={{ background: "var(--teal)" }} />
          <h2 className="relative text-3xl font-extrabold sm:text-5xl">Your first run is on us.</h2>
          <p className="relative mx-auto mt-4 max-w-xl opacity-80">Create a free account, join an open run, and see if we&rsquo;re your kind of people. Full membership starts at {inr(PLANS.MEMBER.price)} a month.</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="btn btn-primary btn-lg">Create free account</Link>
            <Link href="/join" className="btn btn-lg !border-white/25 !bg-white/10 !text-white hover:!bg-white/20">Compare memberships</Link>
          </div>
        </div>
      </section>
    </>
  );
}
