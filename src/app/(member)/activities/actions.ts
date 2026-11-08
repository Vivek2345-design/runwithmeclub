"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseIstInput } from "@/lib/format";
import { parseGpx } from "@/lib/gpx";
import { activityLoad } from "@/lib/metrics";
import { requireUser } from "@/lib/session";

const num = (min: number, max: number) => z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().min(min).max(max).optional());

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  sportType: z.enum(["Run", "TrailRun", "Walk", "Hike", "Ride", "Swim", "Workout"]),
  startDate: z.string(),
  distanceKm: z.preprocess((v) => Number(v), z.number().min(0).max(1000)),
  elevation: num(0, 20000),
  hours: num(0, 99),
  minutes: num(0, 59),
  seconds: num(0, 59),
  avgHr: num(30, 250),
  notes: z.string().trim().max(2000).optional(),
});

function parse(formData: FormData) {
  const p = schema.safeParse(Object.fromEntries(formData));
  if (!p.success) return null;
  const startDate = parseIstInput(p.data.startDate);
  const movingTime = (p.data.hours ?? 0) * 3600 + (p.data.minutes ?? 0) * 60 + (p.data.seconds ?? 0);
  if (!startDate || movingTime <= 0 || startDate.getTime() > Date.now() + 86400000) return null;
  return { ...p.data, startDate, movingTime };
}

export async function createActivity(formData: FormData) {
  const user = await requireUser("/activities/new");
  const d = parse(formData);
  if (!d) redirect("/activities/new?error=invalid");
  const base = { sportType: d.sportType, movingTime: d.movingTime, avgHr: d.avgHr ?? null };
  const a = await db.activity.create({
    data: {
      userId: user.id, source: "MANUAL", name: d.name, sportType: d.sportType, startDate: d.startDate,
      distance: Math.round(d.distanceKm * 1000), movingTime: d.movingTime, elapsedTime: d.movingTime,
      elevationGain: d.elevation ?? 0, avgHr: d.avgHr ?? null, notes: d.notes || null, load: activityLoad(base, user),
    },
  });
  revalidatePath("/", "layout");
  redirect(`/activities/${a.id}?ok=created`);
}

export async function uploadGpx(formData: FormData) {
  const user = await requireUser("/activities/new");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024 || !/\.gpx$/i.test(file.name)) redirect("/activities/new?tab=gpx&error=bad_file");
  let g;
  try {
    g = parseGpx(await file.text());
  } catch {
    redirect("/activities/new?tab=gpx&error=bad_file");
  }
  const sport = z.enum(["Run", "TrailRun", "Walk", "Hike", "Ride"]).catch("Run").parse(formData.get("sportType"));
  const name = String(formData.get("name") ?? "").trim().slice(0, 120) || g.name?.slice(0, 120) || "GPX activity";
  const clash = await db.activity.findFirst({
    where: { userId: user.id, startDate: { gte: new Date(g.startDate.getTime() - 60000), lte: new Date(g.startDate.getTime() + 60000) } },
  });
  if (clash && Math.abs(clash.distance - g.distanceM) < g.distanceM * 0.02) redirect(`/activities/${clash.id}?error=duplicate`);
  const a = await db.activity.create({
    data: {
      userId: user.id, source: "GPX", name, sportType: sport, startDate: g.startDate, distance: g.distanceM,
      movingTime: g.movingSeconds, elapsedTime: g.elapsedSeconds || g.movingSeconds, elevationGain: g.elevationGain,
      load: activityLoad({ sportType: sport, movingTime: g.movingSeconds }, user),
    },
  });
  revalidatePath("/", "layout");
  redirect(`/activities/${a.id}?ok=created`);
}

export async function updateActivity(id: string, formData: FormData) {
  const user = await requireUser();
  const existing = await db.activity.findFirst({ where: { id, userId: user.id } });
  if (!existing) redirect("/activities?error=not_found");
  const d = parse(formData);
  if (!d) redirect(`/activities/${id}?error=invalid`);
  await db.activity.update({
    where: { id },
    data: {
      name: d.name, sportType: d.sportType, startDate: d.startDate, distance: Math.round(d.distanceKm * 1000),
      movingTime: d.movingTime, elapsedTime: Math.max(existing.elapsedTime, d.movingTime), elevationGain: d.elevation ?? 0,
      avgHr: d.avgHr ?? null, notes: d.notes || null,
      load: activityLoad({ ...existing, sportType: d.sportType, movingTime: d.movingTime, avgHr: d.avgHr ?? null }, user),
    },
  });
  revalidatePath("/", "layout");
  redirect(`/activities/${id}?ok=updated`);
}

export async function deleteActivity(id: string) {
  const user = await requireUser();
  await db.activity.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/", "layout");
  redirect("/activities?ok=deleted");
}
