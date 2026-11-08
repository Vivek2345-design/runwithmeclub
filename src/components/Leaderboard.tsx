import { Avatar } from "./ui";
import { publicName } from "@/lib/format";

type Row = { rank: number; userId: string; name: string; value: number; km: number; runs: number };

export function LeaderboardList({ rows, unit, highlightId, fullNames }: { rows: Row[]; unit: string; highlightId?: string; fullNames?: boolean }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted">No runs logged yet this period. Be the first!</p>;
  const medal = ["bg-[#f5c542] text-[#4a3500]", "bg-[#c9d1da] text-[#2b3440]", "bg-[#d99a63] text-[#40240c]"];
  return (
    <ol className="divide-y divide-line">
      {rows.map((r) => (
        <li key={r.userId} className={`flex items-center gap-3 py-3 ${r.userId === highlightId ? "-mx-2 rounded-xl bg-brand-soft px-2" : ""}`}>
          <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${medal[r.rank - 1] ?? "bg-surface-2 text-muted"}`}>{r.rank}</span>
          <Avatar name={r.name} size={34} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{fullNames ? r.name : publicName(r.name)}{r.userId === highlightId && <span className="ml-2 text-xs text-brand">you</span>}</div>
            <div className="text-xs text-muted">{r.runs} runs &middot; {r.km} km</div>
          </div>
          <div className="display text-lg font-extrabold tabular-nums">{r.value}<span className="ml-0.5 text-xs font-semibold text-muted">{unit}</span></div>
        </li>
      ))}
    </ol>
  );
}
