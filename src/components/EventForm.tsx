import type { Event } from "@prisma/client";
import { SubmitButton } from "./client";
import { Field } from "./ui";
import { EVENT_TYPES, toIstInput } from "@/lib/format";

const HUES: [number, string][] = [[18, "Sunrise"], [175, "Sea"], [140, "Forest"], [270, "Violet"], [340, "Rose"], [45, "Gold"], [215, "Ocean"]];

export function EventForm({ action, e, submit }: { action: (fd: FormData) => Promise<void>; e?: Event; submit: string }) {
  return (
    <form action={action} className="space-y-4">
      <Field label="Title" htmlFor="title"><input id="title" name="title" className="input" required minLength={3} maxLength={120} defaultValue={e?.title} placeholder="Saturday Long Run" /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Type" htmlFor="type"><select id="type" name="type" className="input" defaultValue={e?.type ?? "GROUP_RUN"}>{Object.entries(EVENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
        <Field label="Status" htmlFor="status"><select id="status" name="status" className="input" defaultValue={e?.status ?? "PUBLISHED"}><option value="PUBLISHED">Published</option><option value="DRAFT">Draft (hidden)</option><option value="CANCELLED">Cancelled</option></select></Field>
        <Field label="Card colour" htmlFor="hue"><select id="hue" name="hue" className="input" defaultValue={e?.hue ?? 18}>{HUES.map(([h, n]) => <option key={h} value={h}>{n}</option>)}</select></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts (IST)" htmlFor="startsAt"><input id="startsAt" name="startsAt" type="datetime-local" className="input" required defaultValue={e ? toIstInput(e.startsAt) : ""} /></Field>
        <Field label="Ends (IST, optional)" htmlFor="endsAt"><input id="endsAt" name="endsAt" type="datetime-local" className="input" defaultValue={e?.endsAt ? toIstInput(e.endsAt) : ""} /></Field>
      </div>
      <Field label="Location" htmlFor="location"><input id="location" name="location" className="input" required maxLength={200} defaultValue={e?.location} placeholder="Meeting point and area" /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Distance (km)" htmlFor="distanceKm"><input id="distanceKm" name="distanceKm" type="number" step="0.1" min="0" className="input" defaultValue={e?.distanceKm ?? ""} /></Field>
        <Field label="Capacity" htmlFor="capacity" hint="Leave blank for unlimited."><input id="capacity" name="capacity" type="number" min="1" className="input" defaultValue={e?.capacity ?? ""} /></Field>
        <Field label="Fee (₹)" htmlFor="priceInr" hint="0 = free."><input id="priceInr" name="priceInr" type="number" min="0" className="input" defaultValue={e?.priceInr ?? 0} /></Field>
      </div>
      <Field label="Description" htmlFor="description"><textarea id="description" name="description" className="input" rows={6} required minLength={10} maxLength={5000} defaultValue={e?.description} placeholder="What to expect, pace, what to bring…" /></Field>
      <SubmitButton>{submit}</SubmitButton>
    </form>
  );
}
