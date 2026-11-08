import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { isStaff, type SessionUser } from "@/lib/session";
import { Logo } from "./Logo";
import { NavLinks, ThemeToggle, type NavItem } from "./client";
import { Avatar } from "./ui";

export function Sidebar({ user, items, area }: { user: SessionUser; items: NavItem[]; area: "member" | "admin" }) {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="px-5 pb-3 pt-5">
        <Link href={area === "admin" ? "/admin" : "/dashboard"}><Logo /></Link>
        {area === "admin" && <span className="badge badge-brand mt-3">Admin area</span>}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2"><NavLinks items={items} /></div>
      <div className="border-t border-line p-3">
        {area === "member" && isStaff(user) && (
          <Link href="/admin" className="btn btn-sm mb-2 w-full">Open admin area</Link>
        )}
        {area === "admin" && <Link href="/dashboard" className="btn btn-sm mb-2 w-full">Back to my dashboard</Link>}
        <div className="flex items-center gap-2.5 rounded-xl p-2">
          <Avatar name={user.name} size={34} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user.name}</div>
            <div className="truncate text-xs text-muted">{user.role === "ADMIN" ? "Admin" : user.role === "COACH" ? "Coach" : "Member"}</div>
          </div>
          <ThemeToggle />
        </div>
        <form action={logout}><button className="btn btn-ghost btn-sm w-full justify-start" type="submit">Sign out</button></form>
      </div>
    </div>
  );
}
