import { Logo } from "@/components/Logo";
import { AppFrame, type NavItem } from "@/components/client";
import { Sidebar } from "@/components/Sidebar";
import { requireUser } from "@/lib/session";

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/activities", label: "Activities", icon: "activity" },
  { href: "/plan", label: "My plan", icon: "plan" },
  { href: "/calendar", label: "Calendar", icon: "calendar" },
  { href: "/my-events", label: "My events", icon: "events" },
  { href: "/challenges", label: "Challenges", icon: "trophy" },
  { href: "/goals", label: "Goals", icon: "target" },
  { href: "/records", label: "Records", icon: "medal" },
  { href: "/community", label: "Announcements", icon: "megaphone" },
  { href: "/profile", label: "Profile", icon: "user" },
];

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppFrame sidebar={<Sidebar user={user} items={ITEMS} area="member" />} topLabel={<Logo size={28} />}>
      {children}
    </AppFrame>
  );
}
