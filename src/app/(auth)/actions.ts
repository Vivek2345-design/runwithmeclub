"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, rateLimited, safeNext, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { mail, sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/notify";
import { MIN_AGE, fields, parseDob } from "@/lib/member-fields";
import { createResetToken, findValidToken } from "@/lib/reset";
import { needsStravaConnection } from "@/lib/strava-gate";
import { createSession, destroySession } from "@/lib/session";

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "local";
}

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).max(200) });

export async function login(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const q = (e: string) => `/login?error=${e}&next=${encodeURIComponent(next)}`;
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(q("invalid_credentials"));
  const { email, password } = parsed.data;

  if (rateLimited(`login:${await clientIp()}:${email}`, 8, 15 * 60 * 1000)) redirect(q("too_many"));

  const user = await db.user.findUnique({ where: { email } });
  const ok = verifyPassword(password, user?.passwordHash);
  if (!user || !ok) redirect(q("invalid_credentials"));
  if (user.status !== "ACTIVE") redirect(q("suspended"));

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  redirect(next);
}

export type SignupState = { errors: Record<string, string>; values: Record<string, string> } | null;

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
    password: z.string().min(8, "Use at least 8 characters.").max(128),
    confirm: z.string(),
    dateOfBirth: z.string().refine((v) => parseDob(v) !== null, `Enter a valid date of birth. Members must be at least ${MIN_AGE}.`),
    phone: fields.phone,
    address: fields.address,
    city: fields.city,
    state: fields.state,
    pincode: fields.pincode,
    tshirtSize: fields.tshirtSize,
    consent: z.literal("on", { message: "Please accept the Terms, Privacy Policy and Code of Conduct." }),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The two passwords don't match." });

const KEEP = ["name", "email", "dateOfBirth", "phone", "address", "city", "state", "pincode", "tshirtSize"];

/** Returns field errors (and the typed values, minus passwords) so the form can be corrected without retyping. */
export async function signup(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = Object.fromEntries(KEEP.map((k) => [k, String(raw[k] ?? "")]));
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { errors, values };
  }
  const d = parsed.data;
  if (rateLimited(`signup:${await clientIp()}`, 6, 60 * 60 * 1000)) return { errors: { _form: "Too many attempts. Please wait a few minutes." }, values };
  if (await db.user.findUnique({ where: { email: d.email } })) return { errors: { email: "An account with this email already exists. Try logging in instead." }, values };

  // The first account on an empty database, and any email in ADMIN_EMAILS, becomes an admin.
  const isFirst = (await db.user.count()) === 0;
  const role = isFirst || env.adminEmails.includes(d.email) ? "ADMIN" : "MEMBER";
  const user = await db.user.create({
    data: {
      name: d.name, email: d.email, passwordHash: hashPassword(d.password), role,
      dateOfBirth: parseDob(d.dateOfBirth), phone: d.phone, address: d.address, city: d.city, state: d.state, pincode: d.pincode, tshirtSize: d.tshirtSize,
    },
  });
  void welcomeEmail(d.name, d.email);
  await createSession(user.id);
  // Strava is mandatory for members: go straight to Strava to connect, then land on the dashboard.
  redirect(needsStravaConnection({ role: user.role, stravaId: null }, env.requireStrava) ? "/api/strava/connect" : "/dashboard?ok=welcome");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

const emailOnly = z.object({ email: z.string().trim().toLowerCase().email().max(254) });

/** Always answers the same way, so the form can't be used to find out which emails have accounts. */
export async function requestPasswordReset(formData: FormData) {
  const p = emailOnly.safeParse(Object.fromEntries(formData));
  if (!p.success) redirect("/forgot-password?error=invalid");
  const ip = await clientIp();
  if (rateLimited(`reset-ip:${ip}`, 10, 60 * 60 * 1000) || rateLimited(`reset:${p.data.email}`, 3, 60 * 60 * 1000)) redirect("/forgot-password?error=too_many");
  const user = await db.user.findUnique({ where: { email: p.data.email } });
  if (user && user.status === "ACTIVE") {
    const token = await createResetToken(user.id);
    void sendEmail(mail(user.email, "Reset your RunWithMeClub password", `Hi ${user.name.split(" ")[0]},\n\nWe got a request to reset your password. This link works for one hour and can be used once.\n\nIf you didn't ask for this, you can safely ignore this email.`, { label: "Choose a new password", url: `${env.appUrl}/reset-password/${token}` }));
  }
  redirect("/forgot-password?ok=reset_sent");
}

const resetSchema = z.object({ password: z.string().min(8).max(128), confirm: z.string() });

export async function resetPassword(token: string, formData: FormData) {
  const p = resetSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) redirect(`/reset-password/${token}?error=weak_password`);
  if (p.data.password !== p.data.confirm) redirect(`/reset-password/${token}?error=mismatch`);
  const t = await findValidToken(token);
  if (!t) redirect("/forgot-password?error=reset_invalid");
  await db.$transaction([
    db.user.update({ where: { id: t.userId }, data: { passwordHash: hashPassword(p.data.password) } }),
    db.passwordResetToken.deleteMany({ where: { userId: t.userId } }),
  ]);
  redirect("/login?ok=password_reset");
}
