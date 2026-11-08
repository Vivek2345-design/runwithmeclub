import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  // Always do the same amount of work so timing does not reveal whether the account exists.
  const [scheme, saltB64, hashB64] = (stored ?? "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAA").split("$");
  const salt = Buffer.from(saltB64 ?? "", "base64");
  const expected = Buffer.from(hashB64 ?? "", "base64");
  const actual = scryptSync(password, salt, Math.max(expected.length, 1));
  return Boolean(stored) && scheme === "scrypt" && expected.length === KEYLEN && timingSafeEqual(actual, expected);
}

export function generateTempPassword(): string {
  // 12 chars, no look-alike characters
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

// Small in-memory limiter for login/signup/contact. For multiple server instances, move this to Redis.
const hits = new Map<string, number[]>();

export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  return false;
}

/** Only allow same-site relative redirects after login. */
export function safeNext(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/dashboard";
}
