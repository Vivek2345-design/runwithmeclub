function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

export const env = {
  get appUrl() {
    return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  },
  get sessionSecret() {
    return required("SESSION_SECRET");
  },
  get stravaClientId() {
    return required("STRAVA_CLIENT_ID");
  },
  get stravaClientSecret() {
    return required("STRAVA_CLIENT_SECRET");
  },
  get webhookVerifyToken() {
    return required("STRAVA_WEBHOOK_VERIFY_TOKEN");
  },
  /** Emails that become ADMIN when they sign up. The very first account on an empty database is also an admin. */
  get adminEmails(): string[] {
    return (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  },
  get resendApiKey() {
    return process.env.RESEND_API_KEY ?? "";
  },
  /** Verified sender in Resend. Must be on the domain you verified there. */
  get emailFrom() {
    return process.env.EMAIL_FROM ?? "RunWithMeClub <connect@runwithme.club>";
  },
  get stravaConfigured() {
    return Boolean(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET);
  },
  /**
   * Members must connect Strava to use the member area. ON by default as soon as Strava keys are set;
   * set REQUIRE_STRAVA=false to turn it off. Without keys it is always off, so a missing key can never
   * lock everyone out. Admins and coaches are exempt.
   */
  get requireStrava() {
    return process.env.REQUIRE_STRAVA !== "false" && Boolean(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET);
  },
};
