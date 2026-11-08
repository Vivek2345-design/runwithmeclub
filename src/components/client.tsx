"use client";

import {
  Activity, Bell, CalendarDays, ClipboardList, Dumbbell, Flame, Footprints, LayoutDashboard, LogOut, Mail, Medal, Megaphone,
  Menu, Moon, Settings, ShieldCheck, Sun, Target, Trophy, User, Users, X, Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";

const ICONS = {
  dashboard: LayoutDashboard, activity: Activity, calendar: CalendarDays, plan: ClipboardList, events: Footprints, trophy: Trophy,
  target: Target, medal: Medal, megaphone: Megaphone, user: User, users: Users, shield: ShieldCheck, mail: Mail, dumbbell: Dumbbell,
  settings: Settings, bell: Bell, flame: Flame, zap: Zap, logout: LogOut,
};
export type IconKey = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon: IconKey; exact?: boolean; badge?: number };

export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {items.map((it) => {
        const Icon = ICONS[it.icon];
        const active = it.exact ? path === it.href : path === it.href || path.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <Icon size={18} aria-hidden />
            <span className="flex-1">{it.label}</span>
            {it.badge ? <span className="rounded-full bg-brand px-1.5 text-[10px] font-bold text-brand-ink">{it.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Sidebar on desktop, slide-in drawer on mobile. `sidebar` is server-rendered and passed in. */
export function AppFrame({ sidebar, topLabel, children }: { sidebar: React.ReactNode; topLabel: React.ReactNode; children: React.ReactNode }) {
  const path = usePathname();
  // The drawer is "open" only for the page it was opened on, so navigating closes it without an effect.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === path;
  const setOpen = (v: boolean) => setOpenedAt(v ? path : null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-surface lg:flex">{sidebar}</aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
          {topLabel}
          <button className="btn btn-sm" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            <Menu size={18} />
          </button>
        </header>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-label="Close menu" />
            <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-2xl">
              <button className="btn btn-ghost btn-sm absolute right-2 top-2" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
              {sidebar}
            </div>
          </div>
        )}
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function subscribeTheme(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => { mo.disconnect(); mq.removeEventListener("change", cb); };
}
function isDark() {
  const t = document.documentElement.getAttribute("data-theme");
  return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeTheme, isDark, () => false);
  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch {}
  }
  return (
    <button type="button" onClick={toggle} className="btn btn-ghost btn-sm" aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} suppressHydrationWarning>
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

export function SubmitButton({ children, className = "btn btn-primary", pendingText }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? (pendingText ?? "Working…") : children}
    </button>
  );
}

/** Submit button that asks for confirmation first (for destructive actions). */
export function ConfirmButton({ children, message, className = "btn btn-danger btn-sm" }: { children: React.ReactNode; message: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export function SiteMenu({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === path;
  const setOpen = (v: boolean) => setOpenedAt(v ? path : null);
  return (
    <>
      <button className="btn btn-sm md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open && <div className="absolute inset-x-0 top-full border-b border-line bg-surface p-4 shadow-lg md:hidden">{children}</div>}
    </>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-sm"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch {}
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}
