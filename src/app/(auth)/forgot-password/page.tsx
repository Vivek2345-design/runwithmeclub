import type { Metadata } from "next";
import Link from "next/link";
import { Field, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { requestPasswordReset } from "../actions";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-extrabold">Forgot your password?</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Enter your email and we&rsquo;ll send you a link to choose a new one.</p>
      <Flash ok={sp.ok} error={sp.error} />
      <form action={requestPasswordReset} className="space-y-4">
        <Field label="Email" htmlFor="email"><input id="email" name="email" type="email" className="input" required autoComplete="email" autoFocus /></Field>
        <SubmitButton className="btn btn-primary w-full" pendingText="Sending…">Send reset link</SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm text-muted"><Link href="/login" className="font-semibold text-brand">Back to log in</Link></p>
    </>
  );
}
