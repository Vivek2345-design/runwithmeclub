import { Download, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, Badge, EmptyState, Flash, PageHeader } from "@/components/ui";
import { PLANS, type PlanKey } from "@/lib/brand";
import { db } from "@/lib/db";
import { fmtDateShort, timeAgo } from "@/lib/format";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Members" };
export const dynamic = "force-dynamic";
const PAGE = 25;

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; plan?: string; status?: string; group?: string; page?: string; ok?: string; error?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim();
  const where = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }, { city: { contains: q, mode: "insensitive" as const } }] } : {}),
    ...(sp.role ? { role: sp.role } : {}), ...(sp.plan ? { plan: sp.plan } : {}), ...(sp.status ? { status: sp.status } : {}), ...(sp.group ? { groupId: sp.group } : {}),
  };
  const [rows, total, groups] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { group: true, _count: { select: { activities: true } } } }),
    db.user.count({ where }),
    db.group.findMany({ orderBy: { name: "asc" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (p: number) => `/admin/members?${new URLSearchParams(Object.entries({ ...sp, page: String(p) }).filter(([k, v]) => v && k !== "ok" && k !== "error") as [string, string][])}`;
  const exportHref = `/admin/members/export?${new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && ["q", "role", "plan", "status", "group"].includes(k)) as [string, string][])}`;

  return (
    <>
      <PageHeader title="Members" description={`${total} ${total === 1 ? "member" : "members"} match your filters.`} actions={<a href={exportHref} className="btn btn-sm"><Download size={16} /> Export CSV</a>} />
      <Flash ok={sp.ok} error={sp.error} />
      <form className="card mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]" method="get">
        <div className="relative"><Search size={16} className="absolute left-3 top-3 text-muted" /><input name="q" defaultValue={q} placeholder="Search name, email or city" className="input !pl-9" aria-label="Search members" /></div>
        <select name="role" defaultValue={sp.role ?? ""} className="input" aria-label="Role"><option value="">Any role</option><option value="MEMBER">Member</option><option value="COACH">Coach</option><option value="ADMIN">Admin</option></select>
        <select name="plan" defaultValue={sp.plan ?? ""} className="input" aria-label="Plan"><option value="">Any plan</option>{(Object.keys(PLANS) as PlanKey[]).map((k) => <option key={k} value={k}>{PLANS[k].name}</option>)}</select>
        <select name="status" defaultValue={sp.status ?? ""} className="input" aria-label="Status"><option value="">Any status</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></select>
        <select name="group" defaultValue={sp.group ?? ""} className="input" aria-label="Group"><option value="">Any group</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
        <button className="btn btn-dark" type="submit">Filter</button>
      </form>
      {rows.length === 0 ? <EmptyState title="No members found" text="Try changing your filters." /> : (
        <div className="card overflow-x-auto !p-2 sm:!p-3">
          <table className="table">
            <thead><tr><th>Member</th><th>Plan</th><th>Group</th><th className="text-right">Runs</th><th>Joined</th><th>Last login</th></tr></thead>
            <tbody>{rows.map((u) => (
              <tr key={u.id}>
                <td><Link href={`/admin/members/${u.id}`} className="flex items-center gap-3 hover:opacity-80"><Avatar name={u.name} size={34} /><div className="min-w-0"><div className="truncate font-semibold">{u.name}</div><div className="truncate text-xs text-muted">{u.email}</div></div></Link></td>
                <td><div className="flex flex-wrap gap-1"><Badge tone={u.plan === "FREE" ? "" : "badge-brand"}>{PLANS[u.plan as PlanKey]?.name ?? u.plan}</Badge>{u.role !== "MEMBER" && <Badge tone="badge-teal">{u.role === "ADMIN" ? "Admin" : "Coach"}</Badge>}{u.status === "SUSPENDED" && <Badge tone="badge-bad">Suspended</Badge>}</div></td>
                <td className="text-muted">{u.group?.name ?? "–"}</td>
                <td className="text-right tabular-nums">{u._count.activities}</td>
                <td className="whitespace-nowrap text-muted">{fmtDateShort(u.createdAt)}</td>
                <td className="whitespace-nowrap text-muted">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : "never"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {pages > 1 && <div className="mt-4 flex items-center justify-between text-sm text-muted"><span>Page {page} of {pages}</span><div className="flex gap-2">{page > 1 && <Link className="btn btn-sm" href={link(page - 1)}>Previous</Link>}{page < pages && <Link className="btn btn-sm" href={link(page + 1)}>Next</Link>}</div></div>}
    </>
  );
}
