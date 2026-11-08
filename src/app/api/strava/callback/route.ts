import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { env } from "@/lib/env";
import { getUser } from "@/lib/session";
import { exchangeCode } from "@/lib/strava";
import { syncUser } from "@/lib/sync";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const back = (q: string) => NextResponse.redirect(`${env.appUrl}/profile?strava=${q}`);

  const user = await getUser();
  if (!user) return NextResponse.redirect(`${env.appUrl}/login?next=/profile`);

  if (p.get("error")) return back("denied");
  const code = p.get("code");
  const state = p.get("state");
  if (!code || !state || state !== req.cookies.get("oauth_state")?.value) return back("bad_state");
  if (!(p.get("scope") ?? "").includes("activity:read")) return back("missing_scope");

  let token;
  try {
    token = await exchangeCode(code);
  } catch {
    return back("error");
  }
  if (!token.athlete) return back("error");

  const taken = await db.user.findUnique({ where: { stravaId: token.athlete.id } });
  if (taken && taken.id !== user.id) return back("already_linked");

  await db.user.update({
    where: { id: user.id },
    data: {
      stravaId: token.athlete.id,
      stravaAccessToken: encrypt(token.access_token),
      stravaRefreshToken: encrypt(token.refresh_token),
      stravaTokenExpiresAt: new Date(token.expires_at * 1000),
    },
  });
  void syncUser(user.id);
  const res = env.requireStrava ? NextResponse.redirect(`${env.appUrl}/dashboard?ok=connected`) : back("connected");
  res.cookies.delete("oauth_state");
  return res;
}
