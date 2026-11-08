import type { Metadata } from "next";
import { EventForm } from "@/components/EventForm";
import { Flash, PageHeader } from "@/components/ui";
import { requireStaff } from "@/lib/session";
import { createEvent } from "../../actions";

export const metadata: Metadata = { title: "New event" };

export default async function NewEvent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  return (
    <>
      <PageHeader back={{ href: "/admin/events", label: "Events" }} title="New event" />
      <Flash error={sp.error} />
      <div className="card max-w-3xl"><EventForm action={createEvent} submit="Create event" /></div>
    </>
  );
}
