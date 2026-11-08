import { Logo } from "@/components/Logo";
import { AppFrame, type NavItem } from "@/components/client";
import { Sidebar } from "@/components/Sidebar";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const unread = await db.contactMessage.count({ where: { status: "NEW" } });
  const items: NavItem[] = [
    { href: "/admin", label: "Overview", icon: "dashboard", exact: true },
    { href: "/admin/members", label: "Members", icon: "users" },
    { href: "/admin/events", label: "Events", icon: "events" },
    { href: "/admin/workouts", label: "Training plans", icon: "plan" },
    { href: "/admin/groups", label: "Pace groups", icon: "flame" },
    { href: "/admin/challenges", label: "Challenges", icon: "trophy" },
    { href: "/admin/announcements", label: "Announcements", icon: "megaphone" },
    { href: "/admin/messages", label: "Messages", icon: "mail", badge: unread },
  ];
  return (
    <AppFrame sidebar={<Sidebar user={user} items={items} area="admin" />} topLabel={<Logo size={28} />}>
      {children}
    </AppFrame>
  );
}
