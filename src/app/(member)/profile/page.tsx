import type { Metadata } from "next";
import { SubmitButton, ConfirmButton } from "@/components/client";
import { Avatar, Badge, Field, Flash, PageHeader } from "@/components/ui";
import { PLANS, type PlanKey } from "@/lib/brand";
import { env } from "@/lib/env";
import { fmtDate } from "@/lib/format";
import { STATES, TSHIRT_SIZES, ageOn } from "@/lib/member-fields";
import { needsStravaConnection } from "@/lib/strava-gate";
import { requireUser } from "@/lib/session";
import { changePassword, deleteAccount, disconnectStrava, updateProfile, updateTraining } from "./actions";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; strava?: string }> }) {
  const user = await requireUser("/profile");
  const sp = await searchParams;
  const plan = PLANS[(user.plan as PlanKey) in PLANS ? (user.plan as PlanKey) : "FREE"];
  const stravaMsg = sp.strava;
  const stravaRequired = needsStravaConnection({ role: user.role, stravaId: null }, env.requireStrava);

  return (
    <>
      <PageHeader title="Profile & settings" />
      <Flash ok={sp.ok ?? (["connected", "syncing", "disconnected"].includes(stravaMsg ?? "") ? stravaMsg : undefined)} error={sp.error ?? (stravaMsg && !["connected", "syncing", "disconnected"].includes(stravaMsg) ? stravaMsg : undefined)} />

      <div className="card mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={user.name} size={64} />
        <div className="min-w-0 flex-1">
          <div className="text-xl font-extrabold">{user.name}</div>
          <div className="text-sm text-muted">{user.email} &middot; joined {fmtDate(user.createdAt)}</div>
          <div className="mt-2 flex flex-wrap gap-2"><Badge tone="badge-brand">{plan.name} plan</Badge>{user.group && <Badge tone="badge-teal">{user.group.name}</Badge>}{user.role !== "MEMBER" && <Badge>{user.role === "ADMIN" ? "Admin" : "Coach"}</Badge>}{user.membershipUntil && <Badge>Valid until {fmtDate(user.membershipUntil)}</Badge>}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 font-bold">Personal details</h2>
          <form action={updateProfile} className="space-y-4">
            <Field label="Full name" htmlFor="name"><input id="name" name="name" className="input" required minLength={2} maxLength={80} defaultValue={user.name} /></Field>
            {user.dateOfBirth && <p className="text-sm text-muted">Date of birth: <span className="font-medium text-ink">{fmtDate(user.dateOfBirth)}</span> ({ageOn(user.dateOfBirth)} years). To correct it, contact the club.</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact number" htmlFor="phone"><input id="phone" name="phone" type="tel" className="input" maxLength={20} defaultValue={user.phone ?? ""} autoComplete="tel" /></Field>
              <Field label="T-shirt size" htmlFor="tshirtSize"><select id="tshirtSize" name="tshirtSize" className="input" defaultValue={user.tshirtSize ?? ""}><option value="">Not set</option>{TSHIRT_SIZES.map((t) => <option key={t}>{t}</option>)}</select></Field>
            </div>
            <Field label="Complete address" htmlFor="address"><textarea id="address" name="address" className="input" rows={3} maxLength={300} defaultValue={user.address ?? ""} autoComplete="street-address" /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City" htmlFor="city"><input id="city" name="city" className="input" maxLength={60} defaultValue={user.city ?? ""} /></Field>
              <Field label="State" htmlFor="state"><select id="state" name="state" className="input" defaultValue={user.state ?? ""}><option value="">Not set</option>{STATES.map((st) => <option key={st}>{st}</option>)}</select></Field>
              <Field label="Pincode" htmlFor="pincode"><input id="pincode" name="pincode" inputMode="numeric" className="input" maxLength={6} defaultValue={user.pincode ?? ""} /></Field>
            </div>
            <Field label="Emergency contact" htmlFor="emergencyContact" hint="Name and phone. Only club coaches can see this."><input id="emergencyContact" name="emergencyContact" className="input" maxLength={120} defaultValue={user.emergencyContact ?? ""} /></Field>
            <Field label="About you" htmlFor="bio"><textarea id="bio" name="bio" className="input" maxLength={500} defaultValue={user.bio ?? ""} placeholder="Your running goals, favourite distance…" /></Field>
            <SubmitButton>Save details</SubmitButton>
          </form>
        </section>

        <div className="space-y-6">
          <section className="card">
            <h2 className="font-bold">Training settings</h2>
            <p className="mb-4 mt-1 text-sm text-muted">Used to score each workout. With an FTP, rides and runs with power use power; otherwise heart rate; otherwise sport defaults (max HR 190, resting 55).</p>
            <form action={updateTraining} className="grid gap-4 sm:grid-cols-3">
              <Field label="Max HR" htmlFor="maxHr"><input id="maxHr" name="maxHr" type="number" className="input" defaultValue={user.maxHr ?? ""} /></Field>
              <Field label="Resting HR" htmlFor="restHr"><input id="restHr" name="restHr" type="number" className="input" defaultValue={user.restHr ?? ""} /></Field>
              <Field label="FTP (watts)" htmlFor="ftp"><input id="ftp" name="ftp" type="number" className="input" defaultValue={user.ftp ?? ""} /></Field>
              <div className="sm:col-span-3"><SubmitButton>Save and recalculate</SubmitButton></div>
            </form>
          </section>

          <section className="card">
            <div className="flex items-center justify-between"><h2 className="font-bold">Strava</h2>{user.stravaId ? <Badge tone="badge-good">Connected</Badge> : <Badge tone={stravaRequired ? "badge-warn" : ""}>{stravaRequired ? "Required" : "Optional"}</Badge>}</div>
            {user.stravaId ? (
              <>
                <p className="mt-2 text-sm text-muted">Your Strava activities are imported automatically. {user.lastSyncAt ? `Last synced ${fmtDate(user.lastSyncAt)}.` : "Waiting for the first sync."}{user.syncStatus === "RATE_LIMITED" && " Strava's rate limit was hit; the next sync will continue."}{user.syncStatus === "ERROR" && " The last sync failed; try again shortly."}</p>
                <div className="mt-4 flex gap-2">
                  <form action="/api/strava/sync" method="post"><SubmitButton className="btn btn-sm" pendingText="Syncing…">Sync now</SubmitButton></form>
                  {stravaRequired ? <p className="self-center text-xs text-muted">Strava is required for club members.</p> : <form action={disconnectStrava}><ConfirmButton message="Disconnect Strava? Activities already imported stay in your log.">Disconnect</ConfirmButton></form>}
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted">Link Strava to import your runs automatically. {stravaRequired ? "It is required for club members." : "You can use the club fully without it."}</p>
                {env.stravaConfigured ? <a className="btn btn-primary btn-sm mt-4" href="/api/strava/connect">Connect Strava</a> : <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">Strava isn&rsquo;t set up on this site yet. Log runs manually or upload GPX files in the meantime.</p>}
              </>
            )}
          </section>

          <section className="card">
            <h2 className="mb-4 font-bold">Change password</h2>
            <form action={changePassword} className="space-y-3">
              <Field label="Current password" htmlFor="current"><input id="current" name="current" type="password" className="input" required autoComplete="current-password" /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="New password" htmlFor="next"><input id="next" name="next" type="password" className="input" required minLength={8} autoComplete="new-password" /></Field>
                <Field label="Confirm" htmlFor="confirm"><input id="confirm" name="confirm" type="password" className="input" required minLength={8} autoComplete="new-password" /></Field>
              </div>
              <SubmitButton>Update password</SubmitButton>
            </form>
          </section>

          <section className="card !border-bad/40">
            <h2 className="font-bold">Delete account</h2>
            <p className="mb-3 mt-1 text-sm text-muted">Permanently removes your profile, activities, registrations and goals. This can&rsquo;t be undone.</p>
            <form action={deleteAccount} className="flex flex-wrap items-end gap-3">
              <div className="min-w-48 flex-1"><Field label="Confirm with your password" htmlFor="dpw"><input id="dpw" name="password" type="password" className="input" required autoComplete="current-password" /></Field></div>
              <ConfirmButton message="Permanently delete your account and all your data?" className="btn btn-danger">Delete my account</ConfirmButton>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
