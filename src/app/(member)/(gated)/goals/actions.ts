"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

const schema = z.object({ year: z.coerce.number().int().min(2000).max(2100), month: z.coerce.number().int().min(0).max(12), targetKm: z.coerce.number().min(1).max(20000) });

export async function saveGoal(formData: FormData) {
  const user = await requireUser("/goals");
  const p = schema.safeParse(Object.fromEntries(formData));
  if (!p.success) redirect("/goals?error=invalid");
  const { year, month, targetKm } = p.data;
  await db.goal.upsert({ where: { userId_year_month: { userId: user.id, year, month } }, create: { userId: user.id, year, month, targetKm }, update: { targetKm } });
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  redirect("/goals?ok=saved");
}

export async function removeGoal(id: string) {
  const user = await requireUser("/goals");
  await db.goal.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/goals");
  revalidatePath("/dashboard");
}
