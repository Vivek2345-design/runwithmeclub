import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmButton, SubmitButton } from "@/components/client";
import { EmptyState, Field, Flash, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { createGroup, deleteGroup } from "../actions";

export const metadata: Metadata = { title: "Pace groups" };
export const dynamic = "force-dynamic";

export default async function GroupsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const groups = await db.group.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { members: true } } } });
  return (
    <>
      <PageHeader title="Pace groups" description="Organise members by pace or purpose, then assign workouts to a whole group at once." />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.length === 0 && <div className="sm:col-span-2"><EmptyState title="No groups yet" text="Create your first pace group, for example 'Easy 6:30/km'." /></div>}
          {groups.map((g) => (
            <div key={g.id} className="card" style={{ borderTop: `4px solid ${g.color}` }}>
              <div className="flex items-start justify-between gap-2"><h2 className="text-lg font-bold">{g.name}</h2><span className="badge">{g._count.members} members</span></div>
              {g.paceLabel && <p className="mt-1 text-sm font-semibold" style={{ color: g.color }}>{g.paceLabel}</p>}
              {g.description && <p className="mt-2 text-sm text-muted">{g.description}</p>}
              <div className="mt-4 flex gap-2"><Link href={`/admin/members?group=${g.id}`} className="btn btn-sm">View members</Link><form action={deleteGroup.bind(null, g.id)}><ConfirmButton message={`Delete the ${g.name} group? Members stay in the club but lose this group.`} className="btn btn-sm btn-ghost btn-danger">Delete</ConfirmButton></form></div>
            </div>
          ))}
        </div>
        <section className="card h-fit">
          <h2 className="mb-4 font-bold">New group</h2>
          <form action={createGroup} className="space-y-4">
            <Field label="Name" htmlFor="name"><input id="name" name="name" className="input" required minLength={2} maxLength={50} placeholder="Easy Movers" /></Field>
            <Field label="Pace" htmlFor="paceLabel"><input id="paceLabel" name="paceLabel" className="input" maxLength={40} placeholder="6:30 to 7:30 /km" /></Field>
            <Field label="Description" htmlFor="description"><textarea id="description" name="description" className="input" rows={3} maxLength={300} /></Field>
            <Field label="Colour" htmlFor="color"><input id="color" name="color" type="color" defaultValue="#f2541b" className="h-10 w-full cursor-pointer rounded-lg border border-line bg-surface" /></Field>
            <SubmitButton>Create group</SubmitButton>
          </form>
        </section>
      </div>
    </>
  );
}
