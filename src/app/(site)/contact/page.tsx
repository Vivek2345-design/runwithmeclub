import { Mail, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { Field, Flash, SectionHeading } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { CONTACT_EMAIL } from "@/lib/brand";
import { sendMessage } from "./actions";

export const metadata: Metadata = { title: "Contact us", description: "Questions about joining, events or memberships? Get in touch with RunWithMeClub.", alternates: { canonical: "/contact" } };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; subject?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="container-x grid gap-10 py-14 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <SectionHeading eyebrow="Contact" title="Let&rsquo;s talk running" text="Questions about joining, memberships, events or partnerships? Send us a note and a coach or run leader will reply." />
        <ul className="mt-8 space-y-4 text-sm">
          <li className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><Mail size={19} /></span><a className="hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
          <li className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-soft text-teal"><MessageCircle size={19} /></span>We usually reply within two working days.</li>
        </ul>
      </div>
      <form action={sendMessage} className="card space-y-4">
        <Flash ok={sp.ok} error={sp.error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" htmlFor="name"><input id="name" name="name" className="input" required minLength={2} maxLength={80} autoComplete="name" /></Field>
          <Field label="Email" htmlFor="email"><input id="email" name="email" type="email" className="input" required autoComplete="email" /></Field>
        </div>
        <Field label="Subject" htmlFor="subject"><input id="subject" name="subject" className="input" required minLength={2} maxLength={120} defaultValue={sp.subject ?? ""} /></Field>
        <Field label="Message" htmlFor="body"><textarea id="body" name="body" className="input" required minLength={10} maxLength={4000} rows={6} /></Field>
        <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <SubmitButton pendingText="Sending…">Send message</SubmitButton>
      </form>
    </div>
  );
}
