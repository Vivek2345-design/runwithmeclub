import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui";
import { PROGRAMS } from "@/lib/programs";

export const metadata: Metadata = { title: "Training programs", description: "Structured running plans from your first 5K to the marathon, coached by RunWithMeClub.", alternates: { canonical: "/programs" } };

const TONE = { Beginner: "badge-good", Intermediate: "badge-warn", Advanced: "badge-bad" } as const;

export default function ProgramsPage() {
  return (
    <div className="container-x py-14">
      <SectionHeading eyebrow="Training programs" title="Pick a goal. Follow the plan." text="Every program is built around three simple ideas: mostly easy running, a little hard running, and plenty of rest. Members get the weekly workouts scheduled straight onto their calendar." />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {PROGRAMS.map((p) => (
          <article key={p.slug} id={p.slug} className="card hover-lift flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-extrabold">{p.name}</h2>
              <span className={`badge ${TONE[p.level]}`}>{p.level}</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-brand">Goal: {p.goal}</p>
            <p className="mt-2 text-sm text-muted">{p.who}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
              <div className="rounded-xl bg-surface-2 py-2"><div className="display text-xl font-extrabold">{p.weeks}</div><div className="text-xs text-muted">weeks</div></div>
              <div className="rounded-xl bg-surface-2 py-2"><div className="display text-xl font-extrabold">{p.sessions}</div><div className="text-xs text-muted">runs per week</div></div>
            </div>
            <h3 className="mt-5 text-sm font-bold">A typical week</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">{p.week.map((w) => <li key={w} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-teal" />{w}</li>)}</ul>
            <p className="mt-4 flex-1 text-sm"><span className="font-semibold">You&rsquo;ll finish with:</span> {p.outcome}</p>
            <Link href="/signup" className="btn btn-primary mt-5">Start this program</Link>
          </article>
        ))}
      </div>
      <p className="mt-10 rounded-2xl bg-surface-2 p-5 text-sm text-muted">Plans are general guidance, not medical advice. If you have a health condition or injury, check with a doctor before starting a new training program.</p>
    </div>
  );
}
