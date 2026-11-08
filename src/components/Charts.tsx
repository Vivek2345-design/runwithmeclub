import type { FitnessPoint, WeekBucket } from "@/lib/metrics";

/** Fitness (CTL) and fatigue (ATL) lines with form (TSB) shown as a second panel. Pure SVG, no client JS. */
export function FitnessChart({ data }: { data: FitnessPoint[] }) {
  if (data.length < 2) return <Empty text="Not enough data yet. Sync a few activities to see your fitness trend." />;
  const W = 720;
  const H = 220;
  const pad = { l: 36, r: 8, t: 10, b: 22 };
  const max = Math.max(10, ...data.map((d) => Math.max(d.ctl, d.atl))) * 1.1;
  const x = (i: number) => pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const line = (key: "ctl" | "atl") => data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(" ");
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));
  const first = data[0].date;
  const last = data[data.length - 1].date;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Fitness and fatigue over time">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">{t}</text>
          </g>
        ))}
        <path d={line("atl")} fill="none" stroke="var(--brand)" strokeWidth="1.5" />
        <path d={line("ctl")} fill="none" stroke="var(--teal)" strokeWidth="2.5" />
        <text x={pad.l} y={H - 6} fontSize="10" fill="var(--muted)">{first}</text>
        <text x={W - pad.r} y={H - 6} textAnchor="end" fontSize="10" fill="var(--muted)">{last}</text>
      </svg>
      <figcaption className="mt-2 flex gap-4 text-xs text-muted">
        <span><i className="mr-1 inline-block h-2 w-4 rounded-sm bg-teal align-middle" />Fitness (42-day)</span>
        <span><i className="mr-1 inline-block h-2 w-4 rounded-sm bg-brand align-middle" />Fatigue (7-day)</span>
      </figcaption>
    </figure>
  );
}

export function WeeklyBars({ data, metric }: { data: WeekBucket[]; metric: "hours" | "distanceKm" | "load" }) {
  const max = Math.max(1, ...data.map((d) => d[metric]));
  const unit = metric === "hours" ? "h" : metric === "distanceKm" ? "km" : "";
  return (
    <div>
      <div className="flex h-36 items-end gap-1.5" role="img" aria-label={`Weekly ${metric}`}>
        {data.map((d) => (
          <div key={d.weekStart} className="flex h-full flex-1 flex-col justify-end" title={`Week of ${d.weekStart}: ${d[metric]}${unit}`}>
            <div className="rounded-t bg-teal" style={{ height: `${(d[metric] / max) * 100}%`, minHeight: d[metric] > 0 ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>{data[0]?.weekStart.slice(5)}</span>
        <span>this week: {data[data.length - 1]?.[metric]}{unit}</span>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">{text}</p>;
}

export function BarList({ rows, unit = "" }: { rows: { label: string; value: number; sub?: string }[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="truncate font-medium">{r.label}{r.sub && <span className="ml-2 text-xs text-muted">{r.sub}</span>}</span>
            <span className="tabular-nums text-muted">{r.value}{unit}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-gradient-to-r from-brand to-[#ff9a3d]" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ProgressRing({ value, max, label, size = 120 }: { value: number; max: number; label: string; size?: number }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="-rotate-90" width={size} height={size} role="img" aria-label={`${Math.round(pct * 100)}% of goal`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--brand)" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <div className="absolute text-center">
        <div className="display text-2xl font-extrabold tabular-nums">{Math.round(pct * 100)}%</div>
        <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      </div>
    </div>
  );
}
