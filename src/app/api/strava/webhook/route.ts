import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { syncSingleActivity } from "@/lib/sync";

// Subscription handshake: Strava calls this once when the subscription is created.
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === env.webhookVerifyToken) {
    return NextResponse.json({ "hub.challenge": p.get("hub.challenge") });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

type Event = {
  object_type: "activity" | "athlete";
  object_id: number;
  aspect_type: "create" | "update" | "delete";
  owner_id: number;
  updates?: Record<string, string>;
};

// Strava events are unsigned, so we only trust the IDs in them and re-fetch the data
// from Strava with the athlete's own token. Respond fast; do the work afterwards.
export async function POST(req: NextRequest) {
  let ev: Event;
  try {
    ev = await req.json();
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
  void handle(ev).catch((e) => console.error("Webhook handling failed", e));
  return new NextResponse("OK", { status: 200 });
}

async function handle(ev: Event) {
  const user = await db.user.findUnique({ where: { stravaId: ev.owner_id } });
  if (!user) return;

  if (ev.object_type === "athlete") {
    // Athlete revoked access on Strava: remove the Strava data we imported.
    // (the member keeps their club account; we only drop the Strava link and imported activities)
    if (ev.updates?.authorized === "false") {
      await db.activity.deleteMany({ where: { userId: user.id, source: "STRAVA" } });
      await db.user.update({
        where: { id: user.id },
        data: { stravaId: null, stravaAccessToken: null, stravaRefreshToken: null, stravaTokenExpiresAt: null, syncStatus: "IDLE" },
      });
    }
    return;
  }
  if (ev.aspect_type === "delete") {
    await db.activity.deleteMany({ where: { stravaId: ev.object_id, userId: user.id } });
    return;
  }
  await syncSingleActivity(user, ev.object_id);
}
