import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { BRAND, CONTACT_EMAIL } from "@/lib/brand";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };
export const dynamic = "force-dynamic";

// TEMPLATE: have a lawyer review this before launch (India's DPDP Act 2023 applies to personal and health-related data).
export default function PrivacyPage() {
  return (
    <Legal title="Privacy policy" updated="November 2026">
      <p>This policy explains what {BRAND} collects, why, and the choices you have.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Account details:</b> your name, email and an encrypted password. Optionally your phone number, city, bio and an emergency contact.</li>
        <li><b>Training data:</b> runs you log, upload or import, including date, distance, time, elevation and heart-rate or power summaries. If you upload a GPX file we keep only the summary, not the route points.</li>
        <li><b>Club activity:</b> event registrations and attendance, challenge results, goals and workouts assigned to you.</li>
        <li><b>Messages:</b> anything you send us through the contact form.</li>
        <li><b>Strava{env.requireStrava ? " (required for members)" : " (optional)"}:</b> {env.requireStrava ? "members connect Strava, and we receive their activities with their permission (read-only access). " : "if you connect Strava, we receive your activities with your permission. "}Access tokens are stored encrypted. You can revoke access at any time in your Strava settings, and we then delete the Strava activities we imported.</li>
      </ul>
      <h2>How we use it</h2>
      <p>To run the club: show you your progress, organise events, coach you, and display the leaderboard. We do not sell your data and we do not show ads.</p>
      <h2>Who can see it</h2>
      <ul>
        <li><b>You</b> can see all of your own data.</li>
        <li><b>Club coaches and admins</b> can see members&rsquo; profiles, activities and registrations in order to coach and manage the club.</li>
        <li><b>Other members and the public</b> see only your first name and last initial on leaderboards and event attendee lists, along with the totals shown there.</li>
      </ul>
      <h2>Cookies</h2>
      <p>We use one essential cookie to keep you signed in and, if you choose a theme, a browser setting to remember it. We do not use advertising or tracking cookies.</p>
      <h2>Your choices</h2>
      <p>You can edit your profile any time and delete your account from the Profile page, which removes your profile, activities and registrations. For any other request, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      <h2>Service providers</h2>
      <p>We use trusted providers to run the site: Railway (hosting and database) and Resend (sending emails such as password resets and event confirmations). They process data only on our behalf to provide these services.</p>
      <h2>Security</h2>
      <p>Passwords are hashed, Strava tokens are encrypted, and access to member data is limited to club staff. No system is perfectly secure, so please use a strong, unique password.</p>
    </Legal>
  );
}
