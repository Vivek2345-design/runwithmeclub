// Runs once when the production server starts. Refuses to boot with unsafe configuration.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;

  const problems: string[] = [];
  const secret = process.env.SESSION_SECRET ?? "";
  if (secret.length < 32 || /change-me/i.test(secret)) problems.push("SESSION_SECRET must be a random string of at least 32 characters");
  if (!/^https:\/\/[^/]+$/.test(process.env.APP_URL ?? "")) problems.push("APP_URL must be your site's https address with no trailing slash, e.g. https://runwithme.club");
  const db = process.env.DATABASE_URL ?? "";
  if (!db.startsWith("postgres")) problems.push("DATABASE_URL must be a PostgreSQL connection string");
  else if (/@(localhost|127\.0\.0\.1)[:/]/.test(db)) problems.push("DATABASE_URL points at localhost; use the Railway database URL");
  if (problems.length) throw new Error(`Invalid production configuration:\n - ${problems.join("\n - ")}`);

  if (!process.env.RESEND_API_KEY) console.warn("[config] RESEND_API_KEY is not set: password reset and notification emails will not be sent.");
}
