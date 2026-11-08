import type { Metadata } from "next";
import { Legal } from "@/components/Legal";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Code of conduct", alternates: { canonical: "/conduct" } };

export default function ConductPage() {
  return (
    <Legal title="Code of conduct" updated="November 2026">
      <p>{BRAND} is for everyone. To keep it welcoming and safe, we ask all members and guests to:</p>
      <ul>
        <li>Be kind and respectful. No harassment, discrimination or bullying of any kind.</li>
        <li>Never leave anyone behind. On group runs, wait at turning points and look out for each other.</li>
        <li>Follow run leaders&rsquo; instructions, obey traffic rules and run in a way that is safe for others.</li>
        <li>Respect the people and places around us. No littering, and be considerate to pedestrians and neighbours.</li>
        <li>Respect privacy. Ask before photographing or sharing others.</li>
        <li>Tell us if you see something that is not okay. Reports are taken seriously and handled in confidence.</li>
      </ul>
      <p>Breaking this code can lead to a warning, suspension or removal from the club.</p>
    </Legal>
  );
}
