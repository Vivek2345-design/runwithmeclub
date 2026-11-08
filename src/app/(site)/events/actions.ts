"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { cancelRegistration, register } from "@/lib/events";
import { eventEmail } from "@/lib/notify";
import { requireUser } from "@/lib/session";

async function slugFor(eventId: string) {
  return (await db.event.findUnique({ where: { id: eventId }, select: { slug: true } }))?.slug;
}

export async function rsvp(eventId: string, from: string) {
  const slug = await slugFor(eventId);
  const user = await requireUser(slug ? `/events/${slug}` : "/events");
  const result = await register(eventId, user.id);
  if (result === "going" || result === "waitlist") void eventEmail(user.id, eventId, result);
  revalidatePath("/events");
  revalidatePath("/my-events");
  if (slug) revalidatePath(`/events/${slug}`);
  const back = z.enum(["event", "my"]).catch("event").parse(from) === "my" ? "/my-events" : `/events/${slug}`;
  redirect(`${back}?${result === "going" || result === "waitlist" ? "ok" : "error"}=${result === "not_found" ? "not_found" : result}`);
}

export async function cancelRsvp(eventId: string, from: string) {
  const user = await requireUser();
  const promoted = await cancelRegistration(eventId, user.id);
  for (const id of promoted) void eventEmail(id, eventId, "promoted");
  const slug = await slugFor(eventId);
  revalidatePath("/events");
  revalidatePath("/my-events");
  if (slug) revalidatePath(`/events/${slug}`);
  redirect(`${from === "my" ? "/my-events" : `/events/${slug}`}?ok=cancelled`);
}
