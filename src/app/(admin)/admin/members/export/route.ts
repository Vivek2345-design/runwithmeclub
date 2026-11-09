import { PLANS, type PlanKey } from "@/lib/brand";
import { toCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { getUser, isStaff } from "@/lib/session";

export async function GET(req: Request) {
  const me = await getUser();
  if (!me || !isStaff(me)) return new Response("Forbidden", { status: 403 });
  const p = new URL(req.url).searchParams;
  const q = p.get("q")?.trim();
  const rows = await db.user.findMany({
    where: {
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }, { city: { contains: q, mode: "insensitive" as const } }] } : {}),
      ...(p.get("role") ? { role: p.get("role")! } : {}), ...(p.get("plan") ? { plan: p.get("plan")! } : {}),
      ...(p.get("status") ? { status: p.get("status")! } : {}), ...(p.get("group") ? { groupId: p.get("group")! } : {}),
    },
    orderBy: { name: "asc" }, include: { group: true, _count: { select: { activities: true } } },
  });
  const csv = toCsv([
    ["Name", "Email", "Phone", "Date of birth", "T-shirt size", "Address", "City", "State", "Pincode", "Role", "Status", "Plan", "Member until", "Group", "Runs logged", "Joined", "Last login"],
    ...rows.map((u) => [u.name, u.email, u.phone, u.dateOfBirth?.toISOString().slice(0, 10), u.tshirtSize, u.address, u.city, u.state, u.pincode, u.role, u.status, PLANS[u.plan as PlanKey]?.name ?? u.plan, u.membershipUntil?.toISOString().slice(0, 10), u.group?.name, u._count.activities, u.createdAt.toISOString().slice(0, 10), u.lastLoginAt?.toISOString().slice(0, 10)]),
  ]);
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="members-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
