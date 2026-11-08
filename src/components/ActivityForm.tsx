import type { Activity } from "@prisma/client";
import { SubmitButton } from "./client";
import { Field } from "./ui";
import { toIstInput } from "@/lib/format";

export const SPORTS = ["Run", "TrailRun", "Walk", "Hike", "Ride", "Swim", "Workout"];

export function ActivityForm({ action, a, submit }: { action: (fd: FormData) => Promise<void>; a?: Activity; submit: string }) {
  const hms = a ? [Math.floor(a.movingTime / 3600), Math.floor((a.movingTime % 3600) / 60), a.movingTime % 60] : [0, 30, 0];
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name"><input id="name" name="name" className="input" required maxLength={120} defaultValue={a?.name ?? "Morning run"} /></Field>
        <Field label="Sport" htmlFor="sportType">
          <select id="sportType" name="sportType" className="input" defaultValue={a?.sportType ?? "Run"}>{SPORTS.map((s) => <option key={s}>{s}</option>)}</select>
        </Field>
      </div>
      <Field label="Date and time (IST)" htmlFor="startDate"><input id="startDate" name="startDate" type="datetime-local" className="input" required defaultValue={toIstInput(a?.startDate ?? new Date())} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Distance (km)" htmlFor="distanceKm"><input id="distanceKm" name="distanceKm" type="number" step="0.01" min="0" max="1000" className="input" required defaultValue={a ? Math.round(a.distance / 10) / 100 : ""} placeholder="5.0" /></Field>
        <Field label="Elevation gain (m)" htmlFor="elevation"><input id="elevation" name="elevation" type="number" min="0" max="20000" className="input" defaultValue={a ? Math.round(a.elevationGain) : ""} placeholder="optional" /></Field>
      </div>
      <fieldset>
        <legend className="label">Duration</legend>
        <div className="grid grid-cols-3 gap-3">
          {(["hours", "minutes", "seconds"] as const).map((k, i) => (
            <div key={k}><input aria-label={k} name={k} type="number" min="0" max={i === 0 ? 99 : 59} className="input" defaultValue={hms[i]} /><p className="hint">{k}</p></div>
          ))}
        </div>
      </fieldset>
      <Field label="Average heart rate (bpm)" htmlFor="avgHr" hint="Optional. Makes the training-load score more accurate."><input id="avgHr" name="avgHr" type="number" min="30" max="250" className="input" defaultValue={a?.avgHr ? Math.round(a.avgHr) : ""} /></Field>
      <Field label="Notes" htmlFor="notes"><textarea id="notes" name="notes" className="input" maxLength={2000} defaultValue={a?.notes ?? ""} placeholder="How did it feel?" /></Field>
      <SubmitButton>{submit}</SubmitButton>
    </form>
  );
}
