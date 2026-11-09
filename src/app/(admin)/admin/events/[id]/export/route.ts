import { toCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { getUser, isStaff } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getUser();
  if (!me || !isStaff(me)) return new Response("Forbidden", { status: 403 });
  const e = await db.event.findUnique({ where: { id: (await params).id }, include: { registrations: { where: { status: { in: ["GOING", "WAITLIST"] } }, orderBy: { createdAt: "asc" }, include: { user: true } } } });
  if (!e) return new Response("Not found", { status: 404 });
  const csv = toCsv([
    ["Name", "Email", "Phone", "T-shirt size", "Emergency contact", "Status", "Registered at", "Checked in"],
    ...e.registrations.map((r) => [r.user.name, r.user.email, r.user.phone, r.user.tshirtSize, r.user.emergencyContact, r.status, r.createdAt.toISOString(), r.checkedInAt?.toISOString() ?? ""]),
  ]);
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${e.slug}-attendees.csv"` } });
}
