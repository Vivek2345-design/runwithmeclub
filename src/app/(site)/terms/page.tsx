import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { BRAND, CONTACT_EMAIL } from "@/lib/brand";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Terms of use", alternates: { canonical: "/terms" } };
export const dynamic = "force-dynamic";

// TEMPLATE: have a lawyer review this before launch, especially the participation-risk section.
export default function TermsPage() {
  return (
    <Legal title="Terms of use" updated="November 2026">
      <p>By creating an account or taking part in {BRAND} activities you agree to these terms.</p>
      <h2>Your account</h2>
      <p>Provide accurate information, keep your password safe, and tell us if you think your account has been misused. You must be at least 16 to create an account; under-18s need a parent or guardian&rsquo;s consent to take part in events.</p>
      {env.requireStrava && (<><h2>Strava</h2><p>Members connect a Strava account so that runs, leaderboards and challenges are accurate. If you revoke Strava access, member features are paused until you reconnect.</p></>)}
      <h2>Health and participation risk</h2>
      <p>Running and exercise carry an inherent risk of injury. You take part at your own risk, should be in good health, and should check with a doctor if you are unsure. Training plans and metrics such as fitness, fatigue and form are general guidance, not medical advice.</p>
      <h2>Events</h2>
      <p>Please cancel your registration if you cannot attend so that others can take your place. Events may be changed, rescheduled or cancelled, for example because of weather or safety.</p>
      <h2>Community conduct</h2>
      <p>Everyone must follow our Code of Conduct. We may suspend or remove accounts that break it.</p>
      <h2>Memberships and fees</h2>
      <p>Paid memberships and event fees are as described when you sign up and are handled by the club team. Contact us to change or cancel.</p>
      <h2>Content you provide</h2>
      <p>You keep ownership of the data you add. You allow us to use it to provide the service described in our Privacy Policy.</p>
      <h2>Changes and contact</h2>
      <p>We may update these terms and will note the date at the top. Questions: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </Legal>
  );
}
