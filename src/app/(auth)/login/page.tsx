import type { Metadata } from "next";
import Link from "next/link";
import { Field, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { safeNext } from "@/lib/auth";
import { login } from "../actions";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-extrabold">Welcome back</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Log in to see your dashboard, plan and events.</p>
      <Flash ok={sp.ok} error={sp.error} />
      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={safeNext(sp.next)} />
        <Field label="Email" htmlFor="email"><input id="email" name="email" type="email" className="input" required autoComplete="email" autoFocus /></Field>
        <Field label="Password" htmlFor="password"><input id="password" name="password" type="password" className="input" required autoComplete="current-password" /></Field>
        <SubmitButton className="btn btn-primary w-full" pendingText="Logging in…">Log in</SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm text-muted">New here? <Link href="/signup" className="font-semibold text-brand">Create a free account</Link></p>
      <p className="mt-2 text-center text-xs text-muted"><Link href="/forgot-password" className="underline">Forgot your password?</Link></p>
    </>
  );
}
