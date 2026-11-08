import type { Activity } from "@prisma/client";
import Link from "next/link";
import { fmtDateShort, km, paceOrSpeed } from "@/lib/format";
import { formatDuration } from "@/lib/metrics";

export function ActivityTable({ rows }: { rows: Activity[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead><tr><th>Date</th><th>Activity</th><th className="text-right">Distance</th><th className="text-right">Time</th><th className="text-right">Pace / speed</th><th className="text-right">Load</th></tr></thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <td className="whitespace-nowrap text-muted">{fmtDateShort(a.startDate)}</td>
              <td><Link className="font-medium hover:text-brand" href={`/activities/${a.id}`}>{a.name}</Link><div className="text-xs text-muted">{a.sportType}{a.source !== "MANUAL" && <span className="ml-1.5 badge">{a.source}</span>}</div></td>
              <td className="text-right tabular-nums">{km(a.distance)}</td>
              <td className="text-right tabular-nums">{formatDuration(a.movingTime)}</td>
              <td className="whitespace-nowrap text-right tabular-nums">{paceOrSpeed(a.sportType, a.distance, a.movingTime)}</td>
              <td className="text-right tabular-nums">{Math.round(a.load)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
