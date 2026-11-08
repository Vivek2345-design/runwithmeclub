import type { Metadata } from "next";
import Link from "next/link";
import { Field, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { signup } from "../actions";

export const metadata: Metadata = { title: "Join the club", robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-extrabold">Join RunWithMeClub</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Free to join. Takes under a minute.</p>
      <Flash error={sp.error} />
      <form action={signup} className="space-y-4">
        <Field label="Full name" htmlFor="name"><input id="name" name="name" className="input" required minLength={2} maxLength={80} autoComplete="name" autoFocus /></Field>
        <Field label="Email" htmlFor="email"><input id="email" name="email" type="email" className="input" required autoComplete="email" /></Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters."><input id="password" name="password" type="password" className="input" required minLength={8} maxLength={128} autoComplete="new-password" /></Field>
        <Field label="Confirm password" htmlFor="confirm"><input id="confirm" name="confirm" type="password" className="input" required minLength={8} autoComplete="new-password" /></Field>
        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
          <span>I agree to the <Link href="/terms" className="underline" target="_blank">Terms</Link>, <Link href="/privacy" className="underline" target="_blank">Privacy Policy</Link> and <Link href="/conduct" className="underline" target="_blank">Code of Conduct</Link>.</span>
        </label>
        <SubmitButton className="btn btn-primary w-full" pendingText="Creating account…">Create account</SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm text-muted">Already a member? <Link href="/login" className="font-semibold text-brand">Log in</Link></p>
    </>
  );
}
