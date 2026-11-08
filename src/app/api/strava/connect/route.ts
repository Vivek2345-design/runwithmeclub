import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getUser } from "@/lib/session";
import { authorizeUrl } from "@/lib/strava";

// Members link Strava from their profile; this starts that flow. Requires being signed in.
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.redirect(`${env.appUrl}/login?next=/profile`);
  if (!env.stravaConfigured) return NextResponse.redirect(`${env.appUrl}/profile?strava=not_configured`);
  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(authorizeUrl(state));
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
