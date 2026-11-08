import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { db } from "./db";
import { env } from "./env";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  return new TextEncoder().encode(env.sessionSecret);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Current user, or null. Suspended accounts are treated as signed out. Cached per request. */
export const getUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.uid !== "string") return null;
    const user = await db.user.findUnique({ where: { id: payload.uid }, include: { group: true } });
    return user && user.status === "ACTIVE" ? user : null;
  } catch {
    return null;
  }
});

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getUser>>>;

export const isStaff = (u: { role: string }) => u.role === "ADMIN" || u.role === "COACH";

export async function requireUser(next = "/dashboard") {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireStaff() {
  const user = await requireUser("/admin");
  if (!isStaff(user)) redirect("/dashboard");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "ADMIN") redirect("/admin?error=admin_only");
  return user;
}
