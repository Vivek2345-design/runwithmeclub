"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, rateLimited, safeNext, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { mail, sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/notify";
import { createResetToken, findValidToken } from "@/lib/reset";
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

const signupSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8).max(128),
    confirm: z.string(),
    consent: z.literal("on"),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "mismatch" });

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const key = String(issue.path[0]);
    redirect(`/signup?error=${key === "password" ? "weak_password" : key === "confirm" ? "mismatch" : key === "consent" ? "consent" : "invalid"}`);
  }
  const { name, email, password } = parsed.data;
  if (rateLimited(`signup:${await clientIp()}`, 6, 60 * 60 * 1000)) redirect("/signup?error=too_many");

  if (await db.user.findUnique({ where: { email } })) redirect("/signup?error=email_taken");

  // The first account on an empty database, and any email in ADMIN_EMAILS, becomes an admin.
  const isFirst = (await db.user.count()) === 0;
  const user = await db.user.create({
    data: { name, email, passwordHash: hashPassword(password), role: isFirst || env.adminEmails.includes(email) ? "ADMIN" : "MEMBER" },
  });
  void welcomeEmail(name, email);
  await createSession(user.id);
  redirect("/dashboard?ok=welcome");
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
