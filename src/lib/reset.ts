import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";

export const RESET_TTL_MS = 60 * 60 * 1000;

export const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");

/** Creates a one-hour reset token for the user (invalidating earlier ones) and returns the raw value to email. Only its hash is stored. */
export async function createResetToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  await db.$transaction([
    db.passwordResetToken.deleteMany({ where: { userId } }),
    db.passwordResetToken.create({ data: { userId, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + RESET_TTL_MS) } }),
  ]);
  return raw;
}

/** Returns the token row (with its user) if the raw token is unused, unexpired, and the account is active. */
export async function findValidToken(raw: string) {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(raw)) return null;
  const t = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(raw) }, include: { user: true } });
  if (!t || t.usedAt || t.expiresAt < new Date() || t.user.status !== "ACTIVE") return null;
  return t;
}
