"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function setWorkoutStatus(id: string, status: string) {
  const user = await requireUser("/plan");
  const s = z.enum(["PLANNED", "DONE", "SKIPPED"]).parse(status);
  await db.workout.updateMany({ where: { id, userId: user.id }, data: { status: s } });
  revalidatePath("/plan");
  revalidatePath("/dashboard");
}
