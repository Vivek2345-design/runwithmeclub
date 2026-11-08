import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "FAQ", description: "Answers to common questions about joining RunWithMeClub.", alternates: { canonical: "/faq" } };

export const dynamic = "force-dynamic";

const faqs = (stravaRequired: boolean): [string, string][] => [
  ["Do I need to be fast or fit to join?", "No. We have pace groups from relaxed beginners to competitive racers. If you can walk briskly for 30 minutes, we have a place for you."],
  ["What does it cost?", "Creating an account, tracking your runs and joining open community runs is free. Paid memberships add coached sessions, training plans and priority event registration. See the Membership page for details."],
  ["What should I bring to my first run?", "Comfortable running shoes, water, and a positive attitude. For evening runs, bring something reflective or a light."],
  ["How do I log my runs?", "Add runs manually, upload a GPX file from your watch or phone, or link your Strava account in your profile and we will import your activities automatically."],
  ["Do I have to use Strava?", stravaRequired ? "Yes. Members connect Strava so runs, leaderboards and challenges are accurate and effortless. It is free, and our access is read-only." : "No. Strava is optional. You can use the club fully with manual logging and GPX uploads."],
  ["Who can see my activity data?", "You can see your own data. Club coaches and admins can see members' activities so they can coach you. The public leaderboard only shows first names and an initial. See our Privacy Policy for the full details."],
  ["How do event spots and waitlists work?", "Register on the event page. If an event is full you join the waitlist, and you are moved up automatically if someone cancels. Please cancel if you can't make it so others can take your place."],
  ["Can I cancel or delete my account?", "Yes, any time from your profile. Deleting your account removes your profile, activities and registrations."],
  ["I'm injured or have a health condition. Can I still run with you?", "Please talk to your doctor first. Tell a coach about it and they can suggest suitable sessions."],
];

export default function FaqPage() {
  return (
    <div className="container-x max-w-3xl py-14">
      <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
      <div className="mt-10 space-y-3">
        {faqs(env.requireStrava).map(([q, a]) => (
          <details key={q} className="card group !p-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold [&::-webkit-details-marker]:hidden">{q}<span className="text-xl text-brand transition-transform group-open:rotate-45">+</span></summary>
            <p className="px-5 pb-5 text-sm leading-6 text-muted">{a}</p>
          </details>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted">Still have a question? <Link href="/contact" className="underline">Contact us</Link>.</p>
    </div>
  );
}
