"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { rateLimited } from "@/lib/auth";
import { CONTACT_EMAIL } from "@/lib/brand";
import { db } from "@/lib/db";
import { mail, sendEmail } from "@/lib/email";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(2).max(120),
  body: z.string().trim().min(10).max(4000),
  website: z.string().max(0).optional(), // honeypot: real people leave this empty
});

export async function sendMessage(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/contact?error=invalid");
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(`contact:${ip}`, 4, 60 * 60 * 1000)) redirect("/contact?error=too_many");
  const { name, email, subject, body } = parsed.data;
  await db.contactMessage.create({ data: { name, email, subject, body } });
  // Notify the club inbox; replying to the email goes straight to the sender.
  void sendEmail(mail(CONTACT_EMAIL, `[Website] ${subject}`, `From: ${name} <${email}>\n\n${body}`, undefined, email));
  redirect("/contact?ok=sent");
}
