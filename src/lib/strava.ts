import type { User } from "@prisma/client";
import { db } from "./db";
import { decrypt, encrypt } from "./crypto";
import { env } from "./env";

const OAUTH = "https://www.strava.com/oauth";
const API = "https://www.strava.com/api/v3";

export class StravaRateLimitError extends Error {
  constructor() {
    super("Strava rate limit reached");
  }
}

export type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id: number; firstname: string; lastname: string; profile?: string };
};

export type StravaActivity = {
  id: number;
  name: string;
  sport_type?: string;
  type?: string;
  start_date: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  trainer?: boolean;
};

export function authorizeUrl(state: string): string {
  const q = new URLSearchParams({
    client_id: env.stravaClientId,
    redirect_uri: `${env.appUrl}/api/strava/callback`,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all",
    state,
  });
  return `${OAUTH}/authorize?${q}`;
}

async function tokenRequest(body: Record<string, string>): Promise<StravaTokenResponse> {
  const res = await fetch(`${OAUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.stravaClientId,
      client_secret: env.stravaClientSecret,
      ...body,
    }),
  });
  if (res.status === 429) throw new StravaRateLimitError();
  if (!res.ok) throw new Error(`Strava token request failed (${res.status})`);
  return res.json();
}

export function exchangeCode(code: string) {
  return tokenRequest({ code, grant_type: "authorization_code" });
}

/** Returns a valid access token, refreshing (and persisting) it when it expires within 5 minutes. */
export async function accessTokenFor(user: User): Promise<string> {
  if (!user.stravaAccessToken || !user.stravaRefreshToken || !user.stravaTokenExpiresAt) {
    throw new Error("Strava is not connected for this member");
  }
  if (user.stravaTokenExpiresAt.getTime() - Date.now() > 5 * 60 * 1000) {
    return decrypt(user.stravaAccessToken);
  }
  const t = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: decrypt(user.stravaRefreshToken),
  });
  await db.user.update({
    where: { id: user.id },
    data: {
      stravaAccessToken: encrypt(t.access_token),
      stravaRefreshToken: encrypt(t.refresh_token),
      stravaTokenExpiresAt: new Date(t.expires_at * 1000),
    },
  });
  return t.access_token;
}

async function apiGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 429) throw new StravaRateLimitError();
  if (!res.ok) throw new Error(`Strava API ${path} failed (${res.status})`);
  return res.json();
}

export function listActivities(token: string, afterEpoch: number, page: number) {
  return apiGet<StravaActivity[]>(token, `/athlete/activities?after=${afterEpoch}&per_page=200&page=${page}`);
}

export function getActivity(token: string, id: number) {
  return apiGet<StravaActivity>(token, `/activities/${id}`);
}
