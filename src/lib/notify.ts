import { db } from "./db";
import { env } from "./env";
import { mail, sendEmail } from "./email";
import { fmtDateLong, fmtTime } from "./format";

export function welcomeEmail(name: string, email: string) {
  return sendEmail(mail(email, "Welcome to RunWithMeClub", `Hi ${name.split(" ")[0]},\n\nWelcome to the club! Your account is ready.\n\nGood first steps: log your first run, check the upcoming events, and set a monthly distance goal.`, { label: "Open your dashboard", url: `${env.appUrl}/dashboard` }));
}

/** Confirms a registration, or tells a waitlisted member that a place has opened up. */
export async function eventEmail(userId: string, eventId: string, kind: "going" | "waitlist" | "promoted") {
  const [user, e] = await Promise.all([db.user.findUnique({ where: { id: userId } }), db.event.findUnique({ where: { id: eventId } })]);
  if (!user || !e) return false;
  const when = `${fmtDateLong(e.startsAt)}, ${fmtTime(e.startsAt)} IST`;
  const lead = kind === "going" ? "You're registered." : kind === "promoted" ? "Good news: a place opened up and you're now registered." : "The event is full, so you're on the waitlist. We'll email you if a place opens up.";
  const subject = kind === "waitlist" ? `Waitlisted: ${e.title}` : `You're in: ${e.title}`;
  return sendEmail(mail(user.email, subject, `Hi ${user.name.split(" ")[0]},\n\n${lead}\n\n${e.title}\n${when}\n${e.location}\n\nCan't make it? Please cancel on the event page so someone else can take your place.`, { label: "View event", url: `${env.appUrl}/events/${e.slug}` }));
}
