"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type SignupState } from "@/app/(auth)/actions";
import { STATES, TSHIRT_SIZES } from "@/lib/member-fields";
import { Field } from "./ui";

function Err({ msg }: { msg?: string }) {
  return msg ? <p role="alert" className="mt-1 text-xs font-medium text-bad">{msg}</p> : null;
}

export function SignupForm({ stravaRequired, maxDob, minDob }: { stravaRequired: boolean; maxDob: string; minDob: string }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(signup, null);
  const e = state?.errors ?? {};
  const v = state?.values ?? {};
  // Uncontrolled inputs are reset after each submit, so re-fill from the returned values (never passwords).
  const key = state ? JSON.stringify(state.values) : "new";

  return (
    <form action={action} className="space-y-6" key={key} noValidate={false}>
      {e._form && <p role="alert" className="rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">{e._form}</p>}
      {Object.keys(e).length > 0 && !e._form && <p role="alert" className="rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">Please fix the highlighted fields below.</p>}

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-bold">Your account</legend>
        <Field label="Full name" htmlFor="name"><input id="name" name="name" className="input" required minLength={2} maxLength={80} autoComplete="name" defaultValue={v.name} /><Err msg={e.name} /></Field>
        <Field label="Email" htmlFor="email"><input id="email" name="email" type="email" className="input" required autoComplete="email" defaultValue={v.email} /><Err msg={e.email} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" hint="At least 8 characters."><input id="password" name="password" type="password" className="input" required minLength={8} maxLength={128} autoComplete="new-password" /><Err msg={e.password} /></Field>
          <Field label="Confirm password" htmlFor="confirm"><input id="confirm" name="confirm" type="password" className="input" required minLength={8} autoComplete="new-password" /><Err msg={e.confirm} /></Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-bold">About you</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date of birth" htmlFor="dateOfBirth"><input id="dateOfBirth" name="dateOfBirth" type="date" className="input" required min={minDob} max={maxDob} autoComplete="bday" defaultValue={v.dateOfBirth} /><Err msg={e.dateOfBirth} /></Field>
          <Field label="Contact number" htmlFor="phone"><input id="phone" name="phone" type="tel" inputMode="tel" className="input" required autoComplete="tel" placeholder="+91 98765 43210" defaultValue={v.phone} /><Err msg={e.phone} /></Field>
        </div>
        <Field label="T-shirt size" htmlFor="tshirtSize" hint="Used for club and race T-shirts.">
          <select id="tshirtSize" name="tshirtSize" className="input" required defaultValue={v.tshirtSize ?? ""}>
            <option value="" disabled>Choose a size</option>
            {TSHIRT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Err msg={e.tshirtSize} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-bold">Address</legend>
        <Field label="Complete address" htmlFor="address"><textarea id="address" name="address" className="input" required minLength={10} maxLength={300} rows={3} autoComplete="street-address" placeholder="House / flat, street, area" defaultValue={v.address} /><Err msg={e.address} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" htmlFor="city"><input id="city" name="city" className="input" required maxLength={60} autoComplete="address-level2" defaultValue={v.city} /><Err msg={e.city} /></Field>
          <Field label="State" htmlFor="state">
            <select id="state" name="state" className="input" required autoComplete="address-level1" defaultValue={v.state ?? ""}>
              <option value="" disabled>Choose a state</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Err msg={e.state} />
          </Field>
        </div>
        <div className="sm:w-1/2 sm:pr-2"><Field label="Pincode" htmlFor="pincode"><input id="pincode" name="pincode" inputMode="numeric" className="input" required pattern="[1-9][0-9]{5}" maxLength={6} autoComplete="postal-code" placeholder="560001" defaultValue={v.pincode} /><Err msg={e.pincode} /></Field></div>
      </fieldset>

      {stravaRequired && (
        <div className="rounded-xl border border-[#fc4c02]/40 bg-[#fc4c02]/10 p-4 text-sm">
          <p className="font-bold">Strava is required</p>
          <p className="mt-1 text-muted">After you create your account we&rsquo;ll take you to Strava to connect it. Members need a Strava account (it&rsquo;s free) so runs, leaderboards and challenges are accurate. Access is read-only.</p>
        </div>
      )}

      <div>
        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
          <span>I agree to the <Link href="/terms" className="underline" target="_blank">Terms</Link>, <Link href="/privacy" className="underline" target="_blank">Privacy Policy</Link> and <Link href="/conduct" className="underline" target="_blank">Code of Conduct</Link>, and I&rsquo;m {16} or older.</span>
        </label>
        <Err msg={e.consent} />
      </div>

      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={pending} aria-busy={pending}>
        {pending ? "Creating account…" : stravaRequired ? "Create account and connect Strava" : "Create account"}
      </button>
    </form>
  );
}
