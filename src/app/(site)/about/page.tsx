import { HeartHandshake, ShieldCheck, Smile, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui";
import { clubStats } from "@/lib/queries";

export const metadata: Metadata = { title: "About us", description: "Meet RunWithMeClub: a welcoming, structured running club for every pace.", alternates: { canonical: "/about" } };
export const dynamic = "force-dynamic";

const VALUES = [
  { icon: HeartHandshake, title: "Everyone belongs", text: "Every pace, every age, every background. We celebrate the first 5K as loudly as the fastest marathon." },
  { icon: TrendingUp, title: "Consistency over heroics", text: "Small, steady runs beat occasional big ones. We help you build a habit that lasts." },
  { icon: ShieldCheck, title: "Safe and smart", text: "Sensible progression, proper warm-ups and coaches who care about your long-term health." },
  { icon: Smile, title: "Fun first", text: "Running is better together. Good company, good coffee, good vibes." },
];

export default async function AboutPage() {
  const s = await clubStats();
  return (
    <>
      <section className="hero-bg">
        <div className="container-x py-20">
          <SectionHeading eyebrow="About us" title="A running club built around people, not pace." text="RunWithMeClub started with a simple idea: running is easier, more fun and more sustainable when you do it with others. We combine friendly group runs with real coaching and simple tools to track your progress." />
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/signup" className="btn btn-primary btn-lg">Join the club</Link><Link href="/events" className="btn btn-lg">Come to a run</Link></div>
        </div>
      </section>
      <section className="border-y border-line bg-surface">
        <div className="container-x grid grid-cols-2 gap-6 py-8 text-center md:grid-cols-3">
          {[[s.members.toLocaleString("en-IN"), "members"], [s.kmAllTime.toLocaleString("en-IN"), "km run together"], [String(s.upcomingEvents), "upcoming events"]].map(([n, l]) => (
            <div key={l}><div className="display text-3xl font-extrabold">{n}</div><div className="text-sm text-muted">{l}</div></div>
          ))}
        </div>
      </section>
      <section className="container-x py-20">
        <SectionHeading center eyebrow="What we believe" title="Our values" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card flex gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><Icon size={22} /></span>
              <div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm text-muted">{text}</p></div>
            </div>
          ))}
        </div>
      </section>
      <section className="container-x pb-20">
        <div className="card text-center">
          <h2 className="text-2xl font-extrabold">Ready to lace up?</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">Create a free account and join your first run this week.</p>
          <Link href="/signup" className="btn btn-primary mt-5">Join RunWithMeClub</Link>
        </div>
      </section>
    </>
  );
}
