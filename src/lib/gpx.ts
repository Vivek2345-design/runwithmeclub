// Minimal GPX parser (no dependencies): distance, moving time, elevation gain and start time from <trkpt> points.

export type GpxSummary = {
  name: string | null;
  startDate: Date;
  distanceM: number;
  movingSeconds: number;
  elapsedSeconds: number;
  elevationGain: number;
  points: number;
};

const toRad = (d: number) => (d * Math.PI) / 180;

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function parseGpx(xml: string): GpxSummary {
  const name = /<trk>[\s\S]*?<name>([\s\S]*?)<\/name>/.exec(xml)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || null;
  const pts: { lat: number; lon: number; ele: number | null; t: number | null }[] = [];
  const re = /<trkpt\b([^>]*)>([\s\S]*?)<\/trkpt>/g;
  for (let m = re.exec(xml); m; m = re.exec(xml)) {
    const lat = /lat="([-\d.]+)"/.exec(m[1])?.[1];
    const lon = /lon="([-\d.]+)"/.exec(m[1])?.[1];
    if (lat === undefined || lon === undefined) continue;
    const ele = /<ele>([-\d.]+)<\/ele>/.exec(m[2])?.[1];
    const time = /<time>([^<]+)<\/time>/.exec(m[2])?.[1];
    const t = time ? Date.parse(time) : NaN;
    pts.push({ lat: Number(lat), lon: Number(lon), ele: ele !== undefined ? Number(ele) : null, t: Number.isNaN(t) ? null : t });
  }
  if (pts.length < 2) throw new Error("No track points found in this GPX file.");

  let dist = 0;
  let moving = 0;
  let gain = 0;
  let lastEle: number | null = pts[0].ele;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const d = haversine(a.lat, a.lon, b.lat, b.lon);
    dist += d;
    if (a.t !== null && b.t !== null) {
      const dt = (b.t - a.t) / 1000;
      // Count as moving if faster than ~0.5 m/s; ignore absurd gaps (paused recording).
      if (dt > 0 && dt < 60 && d / dt > 0.5) moving += dt;
    }
    if (b.ele !== null && lastEle !== null && Math.abs(b.ele - lastEle) >= 2) {
      if (b.ele > lastEle) gain += b.ele - lastEle;
      lastEle = b.ele;
    } else if (b.ele !== null && lastEle === null) {
      lastEle = b.ele;
    }
  }
  const first = pts.find((p) => p.t !== null)?.t ?? null;
  const last = [...pts].reverse().find((p) => p.t !== null)?.t ?? null;
  const elapsed = first !== null && last !== null ? Math.round((last - first) / 1000) : 0;
  return {
    name,
    startDate: new Date(first ?? Date.now()),
    distanceM: Math.round(dist),
    movingSeconds: Math.round(moving || elapsed),
    elapsedSeconds: elapsed,
    elevationGain: Math.round(gain),
    points: pts.length,
  };
}
