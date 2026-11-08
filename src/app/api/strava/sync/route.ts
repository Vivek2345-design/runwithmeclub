import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getUser } from "@/lib/session";
import { isSyncRunning, syncUser } from "@/lib/sync";

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // Throttle manual syncs to one every 2 minutes to stay well inside Strava's rate limits.
  const recent = user.lastSyncAt && Date.now() - user.lastSyncAt.getTime() < 2 * 60 * 1000;
  if (user.stravaId && !isSyncRunning(user.id) && !recent) void syncUser(user.id);
  return NextResponse.redirect(`${env.appUrl}/profile?strava=syncing`, 303);
}
