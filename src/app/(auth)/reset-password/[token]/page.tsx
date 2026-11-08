import type { Metadata } from "next";
import Link from "next/link";
import { Field, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { findValidToken } from "@/lib/reset";
import { resetPassword } from "../../actions";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const sp = await searchParams;
  const valid = await findValidToken(token);
  if (!valid) {
    return (
      <>
        <h1 className="text-3xl font-extrabold">Link expired</h1>
        <p className="mb-6 mt-1 text-sm text-muted">This reset link is invalid or has already been used. Reset links work for one hour.</p>
        <Link href="/forgot-password" className="btn btn-primary w-full">Request a new link</Link>
      </>
    );
  }
  return (
    <>
      <h1 className="text-3xl font-extrabold">Choose a new password</h1>
      <p className="mb-6 mt-1 text-sm text-muted">For {valid.user.email}</p>
      <Flash error={sp.error} />
      <form action={resetPassword.bind(null, token)} className="space-y-4">
        <Field label="New password" htmlFor="password" hint="At least 8 characters."><input id="password" name="password" type="password" className="input" required minLength={8} maxLength={128} autoComplete="new-password" autoFocus /></Field>
        <Field label="Confirm password" htmlFor="confirm"><input id="confirm" name="confirm" type="password" className="input" required minLength={8} autoComplete="new-password" /></Field>
        <SubmitButton className="btn btn-primary w-full" pendingText="Saving…">Update password</SubmitButton>
      </form>
    </>
  );
}
