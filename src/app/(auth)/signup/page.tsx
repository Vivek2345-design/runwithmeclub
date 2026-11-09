import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";
import { env } from "@/lib/env";
import { MIN_AGE } from "@/lib/member-fields";

export const metadata: Metadata = { title: "Join the club", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function SignupPage() {
  const now = new Date();
  const ymd = (yearsAgo: number) => `${now.getUTCFullYear() - yearsAgo}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  return (
    <>
      <h1 className="text-3xl font-extrabold">Join RunWithMeClub</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Free to join. It takes a couple of minutes.</p>
      <SignupForm stravaRequired={env.requireStrava} maxDob={ymd(MIN_AGE)} minDob={ymd(100)} />
      <p className="mt-5 text-center text-sm text-muted">Already a member? <Link href="/login" className="font-semibold text-brand">Log in</Link></p>
    </>
  );
}
