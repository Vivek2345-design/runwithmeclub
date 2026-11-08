import { Activity, LineChart, ShieldCheck, Trophy } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Flash } from "@/components/ui";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/session";
import { needsStravaConnection } from "@/lib/strava-gate";

export const metadata: Metadata = { title: "Connect Strava", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ConnectStravaPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser("/connect-strava");
  const sp = await searchParams;
  // Nothing to do if Strava is already connected or isn't required for this account.
  if (!needsStravaConnection(user, env.requireStrava)) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-xl py-6">
      <Flash error={sp.error} />
      <div className="card text-center">
        <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fc4c02] text-white"><Activity size={28} /></span>
        <h1 className="text-2xl font-extrabold sm:text-3xl">One last step, {user.name.split(" ")[0]}</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">RunWithMeClub uses Strava to bring in your runs automatically, so every member&rsquo;s training, leaderboard and challenge results are accurate and effortless.</p>
        <ul className="mx-auto mt-6 max-w-sm space-y-3 text-left text-sm">
          <li className="flex gap-3"><LineChart size={18} className="mt-0.5 shrink-0 text-brand" />Your runs and fitness charts fill in on their own</li>
          <li className="flex gap-3"><Trophy size={18} className="mt-0.5 shrink-0 text-brand" />You appear on the leaderboard and in challenges</li>
          <li className="flex gap-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand" />Read-only access. We can never post or change anything on Strava</li>
        </ul>
        <a href="/api/strava/connect" className="btn btn-lg mt-8 w-full !border-transparent !bg-[#fc4c02] !text-white">Connect with Strava</a>
        <p className="mt-3 text-xs text-muted">You&rsquo;ll be taken to Strava to approve access, then brought straight back. You can disconnect later from Strava&rsquo;s settings.</p>
      </div>
    </div>
  );
}
