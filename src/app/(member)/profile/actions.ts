"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword, rateLimited, verifyPassword } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { destroySession, requireUser } from "@/lib/session";
import { recomputeLoads } from "@/lib/sync";

const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);

const profileSchema = z.object({ name: z.string().trim().min(2).max(80), phone: opt(20), city: opt(60), bio: opt(500), emergencyContact: opt(120) });

export async function updateProfile(formData: FormData) {
  const user = await requireUser("/profile");
  const p = profileSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) redirect("/profile?error=invalid");
  await db.user.update({ where: { id: user.id }, data: p.data });
  revalidatePath("/", "layout");
  redirect("/profile?ok=saved");
}

const optionalInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(min).max(max).nullable());
const trainingSchema = z.object({ maxHr: optionalInt(120, 230), restHr: optionalInt(30, 100), ftp: optionalInt(50, 600) });

export async function updateTraining(formData: FormData) {
  const user = await requireUser("/profile");
  const p = trainingSchema.safeParse(Object.fromEntries(formData));
  if (!p.success || (p.data.maxHr && p.data.restHr && p.data.restHr >= p.data.maxHr)) redirect("/profile?error=invalid");
  await db.user.update({ where: { id: user.id }, data: p.data });
  await recomputeLoads(user.id);
  revalidatePath("/", "layout");
  redirect("/profile?ok=saved");
}

export async function changePassword(formData: FormData) {
  const user = await requireUser("/profile");
  if (rateLimited(`pw:${user.id}`, 6, 15 * 60 * 1000)) redirect("/profile?error=too_many");
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next.length < 8 || next.length > 128) redirect("/profile?error=weak_password");
  if (next !== confirm) redirect("/profile?error=mismatch");
  if (!verifyPassword(current, user.passwordHash)) redirect("/profile?error=wrong_password");
  await db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(next) } });
  redirect("/profile?ok=password_changed");
}

export async function disconnectStrava() {
  const user = await requireUser("/profile");
  if (user.stravaAccessToken && user.stravaTokenExpiresAt && user.stravaTokenExpiresAt > new Date()) {
    try {
      await fetch("https://www.strava.com/oauth/deauthorize", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ access_token: decrypt(user.stravaAccessToken) }) });
    } catch {}
  }
  await db.user.update({ where: { id: user.id }, data: { stravaId: null, stravaAccessToken: null, stravaRefreshToken: null, stravaTokenExpiresAt: null, syncStatus: "IDLE" } });
  revalidatePath("/profile");
  redirect("/profile?ok=disconnected");
}

export async function deleteAccount(formData: FormData) {
  const user = await requireUser("/profile");
  if (!verifyPassword(String(formData.get("password") ?? ""), user.passwordHash)) redirect("/profile?error=wrong_password");
  if (user.role === "ADMIN" && (await db.user.count({ where: { role: "ADMIN", status: "ACTIVE" } })) <= 1) redirect("/profile?error=last_admin");
  await db.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/");
}
