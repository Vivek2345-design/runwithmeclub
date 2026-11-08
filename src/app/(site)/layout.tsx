import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SiteMenu, ThemeToggle } from "@/components/client";
import { BRAND, CONTACT_EMAIL } from "@/lib/brand";
import { getUser } from "@/lib/session";

const NAV = [
  ["/events", "Events"],
  ["/programs", "Programs"],
  ["/leaderboard", "Leaderboard"],
  ["/news", "News"],
  ["/about", "About"],
  ["/join", "Membership"],
] as const;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const links = (
    <>
      {NAV.map(([href, label]) => (
        <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink">
          {label}
        </Link>
      ))}
    </>
  );
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
        <div className="container-x relative flex h-16 items-center justify-between gap-4">
          <Link href="/" aria-label={`${BRAND} home`}><Logo /></Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">{links}</nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">My dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">Log in</Link>
                <Link href="/signup" className="btn btn-primary btn-sm">Join the club</Link>
              </>
            )}
            <SiteMenu>
              <div className="flex flex-col gap-1">{links}{!user && <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-muted">Log in</Link>}</div>
            </SiteMenu>
          </div>
        </div>
      </header>
      <main id="main" className="flex-1">{children}</main>
      <footer className="border-t border-line bg-surface">
        <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted">A friendly running club for every pace. Weekly group runs, coached training, monthly challenges and good company.</p>
          </div>
          <FooterCol title="Club" links={[["/about", "About us"], ["/events", "Events"], ["/programs", "Training programs"], ["/leaderboard", "Leaderboard"], ["/news", "News"]]} />
          <FooterCol title="Members" links={[["/join", "Membership"], ["/signup", "Join the club"], ["/login", "Log in"], ["/faq", "FAQ"]]} />
          <FooterCol title="Legal & help" links={[["/contact", "Contact us"], ["/privacy", "Privacy policy"], ["/terms", "Terms of use"], ["/conduct", "Code of conduct"]]} />
        </div>
        <div className="border-t border-line">
          <div className="container-x flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-muted">
            <span>&copy; {new Date().getFullYear()} {BRAND}. All rights reserved.</span>
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink">{CONTACT_EMAIL}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold">{title}</h3>
      <ul className="space-y-2 text-sm text-muted">
        {links.map(([href, label]) => (
          <li key={href}><Link href={href} className="hover:text-ink">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
