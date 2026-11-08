import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui";
import { PLANS, type PlanKey } from "@/lib/brand";
import { inr } from "@/lib/format";
import { getUser } from "@/lib/session";

export const metadata: Metadata = { title: "Membership", description: "Join RunWithMeClub for free, or upgrade for coached sessions, training plans and priority event access.", alternates: { canonical: "/join" } };

export default async function JoinPage() {
  const user = await getUser();
  return (
    <div className="container-x py-14">
      <SectionHeading center eyebrow="Membership" title="Start free. Upgrade when you&rsquo;re ready." text="Everyone can create an account, track runs and join open community runs. Paid memberships add coaching and structure." />
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {(Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]).map(([key, p]) => {
          const featured = key === "MEMBER";
          return (
            <div key={key} className={`card relative flex flex-col ${featured ? "!border-brand ring-2 ring-brand/30" : ""}`}>
              {featured && <span className="badge badge-brand absolute -top-3 left-6">Most popular</span>}
              <h2 className="text-xl font-extrabold">{p.name}</h2>
              <p className="mt-1 text-sm text-muted">{p.blurb}</p>
              <div className="my-5"><span className="display text-4xl font-extrabold">{p.price === 0 ? "Free" : inr(p.price)}</span>{p.price > 0 && <span className="text-sm text-muted"> / month</span>}</div>
              <ul className="flex-1 space-y-2.5 text-sm">{p.perks.map((perk) => <li key={perk} className="flex gap-2"><Check size={17} className="mt-0.5 shrink-0 text-good" />{perk}</li>)}</ul>
              <Link href={user ? "/contact?subject=Membership" : "/signup"} className={`btn mt-6 ${featured ? "btn-primary" : ""}`}>{key === "FREE" ? (user ? "You're in" : "Create free account") : "Talk to us to upgrade"}</Link>
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm text-muted">Paid memberships are activated by the club team after you get in touch. Questions? See the <Link href="/faq" className="underline">FAQ</Link> or <Link href="/contact" className="underline">contact us</Link>.</p>
    </div>
  );
}
