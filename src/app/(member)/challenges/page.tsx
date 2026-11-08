import { Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";
import { METRIC_INFO, challengeState } from "@/lib/challenges";
import { db } from "@/lib/db";
import { fmtDateShort } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Challenges" };
export const dynamic = "force-dynamic";

const TONE = { LIVE: "badge-good", UPCOMING: "badge-warn", ENDED: "" } as const;

export default async function ChallengesPage() {
  await requireUser("/challenges");
  const all = await db.challenge.findMany({ orderBy: { startDate: "desc" } });
  const groups = { LIVE: all.filter((c) => challengeState(c) === "LIVE"), UPCOMING: all.filter((c) => challengeState(c) === "UPCOMING"), ENDED: all.filter((c) => challengeState(c) === "ENDED") };
  return (
    <>
      <PageHeader title="Challenges" description="Friendly club-wide competitions. Everyone is entered automatically, so just keep running." />
      {all.length === 0 && <EmptyState icon={<Trophy size={22} />} title="No challenges yet" text="Your coaches will post monthly challenges here." />}
      {(["LIVE", "UPCOMING", "ENDED"] as const).map((k) => groups[k].length > 0 && (
        <section key={k} className="mb-8">
          <h2 className="mb-3 text-lg font-bold">{k === "LIVE" ? "Happening now" : k === "UPCOMING" ? "Coming up" : "Past challenges"}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {groups[k].map((c) => (
              <Link key={c.id} href={`/challenges/${c.id}`} className="card hover-lift">
                <div className="flex items-center justify-between"><span className={`badge ${TONE[k]}`}>{k === "LIVE" ? "Live" : k === "UPCOMING" ? "Upcoming" : "Ended"}</span><span className="text-xs text-muted">{fmtDateShort(c.startDate)} to {fmtDateShort(c.endDate)}</span></div>
                <h3 className="mt-3 text-lg font-bold">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{c.description}</p>
                <p className="mt-3 text-xs font-semibold text-brand">Ranked by {METRIC_INFO[c.metric]?.label.toLowerCase()}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
