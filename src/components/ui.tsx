import Link from "next/link";
import { hueFor, initials } from "@/lib/format";

export function Badge({ children, tone = "" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const h = hueFor(name);
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, hsl(${h} 70% 52%), hsl(${(h + 40) % 360} 70% 42%))` }}
    >
      {initials(name)}
    </span>
  );
}

export function PageHeader({ title, description, actions, back }: { title: string; description?: string; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-1 inline-block text-sm text-muted hover:text-ink">
            &larr; {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, tone }: { label: string; value: React.ReactNode; hint?: React.ReactNode; icon?: React.ReactNode; tone?: "brand" | "teal" | "good" | "warn" }) {
  const toneCls = { brand: "bg-brand-soft text-brand", teal: "bg-teal-soft text-teal", good: "bg-good/15 text-good", warn: "bg-warn/15 text-warn" }[tone ?? "brand"];
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
        {icon && <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${toneCls}`}>{icon}</span>}
      </div>
      <div className="display mt-2 text-3xl font-extrabold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      {icon && <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-muted">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, text, center }: { eyebrow?: string; title: string; text?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-base text-muted sm:text-lg">{text}</p>}
    </div>
  );
}

const MESSAGES: Record<string, string> = {
  saved: "Saved.",
  created: "Created.",
  deleted: "Deleted.",
  updated: "Updated.",
  sent: "Message sent. We'll get back to you soon.",
  password_changed: "Password changed.",
  going: "You're in! See you there.",
  waitlist: "The event is full, so you're on the waitlist. We'll let you know if a spot opens.",
  cancelled: "Registration cancelled.",
  admin_only: "Only admins can do that.",
  invalid: "Please check the form and try again.",
  too_many: "Too many attempts. Please wait a few minutes.",
  wrong_password: "Your current password is incorrect.",
  not_found: "We couldn't find that.",
  full: "Sorry, that event is full.",
  closed: "Registration for this event is closed.",
  self: "You can't do that to your own account.",
  last_admin: "There must be at least one admin.",
  bad_file: "That file couldn't be read. Please upload a valid .gpx file under 5 MB.",
  connected: "Strava connected. Importing your activities now.",
  syncing: "Sync started. New activities will appear shortly.",
  not_configured: "Strava isn't set up on this site yet.",
  denied: "Strava access was not granted.",
  bad_state: "That sign-in link expired. Please try again.",
  missing_scope: "Please allow access to your activities on Strava.",
  already_linked: "That Strava account is linked to another member.",
  error: "Something went wrong. Please try again.",
  disconnected: "Strava disconnected.",
  strava_required: "Strava is required for club members, so it can't be disconnected. Contact the club if you need help.",
  strava_first: "Please connect Strava first. It's required to use the member area.",
  invalid_credentials: "That email and password don't match. Please try again.",
  email_taken: "An account with that email already exists. Try logging in instead.",
  weak_password: "Please use a password of at least 8 characters.",
  mismatch: "The two passwords don't match.",
  consent: "Please accept the Terms and Privacy Policy to join.",
  welcome: "Welcome to the club! Start by logging your first run or browsing events.",
  suspended: "This account has been suspended. Please contact the club.",
  reset_sent: "If an account exists for that email, we've sent a link to reset the password. It works for one hour.",
  password_reset: "Password updated. You can log in with your new password.",
  reset_invalid: "That reset link is invalid or has expired. Please request a new one.",
  published: "Published.",
  temp_password: "Temporary password set. Share it with the member securely; they should change it after signing in.",
};

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  const code = error ?? ok;
  if (!code) return null;
  const isError = Boolean(error);
  return (
    <p
      role={isError ? "alert" : "status"}
      className={`mb-5 rounded-xl border px-4 py-3 text-sm ${isError ? "border-bad/40 bg-bad/10 text-bad" : "border-good/40 bg-good/10 text-good"}`}
    >
      {MESSAGES[code] ?? (isError ? "Something went wrong." : "Done.")}
    </p>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
