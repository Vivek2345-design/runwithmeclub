import { describe, expect, it } from "vitest";
import { haversine, parseGpx } from "./gpx";

const trkpt = (lat: number, lon: number, ele: number, t: string) => `<trkpt lat="${lat}" lon="${lon}"><ele>${ele}</ele><time>${t}</time></trkpt>`;

describe("haversine", () => {
  it("measures about 111 km per degree of latitude", () => {
    expect(haversine(0, 0, 1, 0)).toBeGreaterThan(110000);
    expect(haversine(0, 0, 1, 0)).toBeLessThan(112000);
  });
  it("is zero for identical points", () => expect(haversine(12.9, 77.6, 12.9, 77.6)).toBe(0));
});

describe("parseGpx", () => {
  // ~111 m north every 30 s = 3.7 m/s, climbing 3 m per point
  const pts = Array.from({ length: 11 }, (_, i) => trkpt(12 + i * 0.001, 77, 900 + i * 3, `2026-11-01T00:${String(Math.floor((i * 30) / 60)).padStart(2, "0")}:${String((i * 30) % 60).padStart(2, "0")}Z`)).join("");
  const xml = `<?xml version="1.0"?><gpx><trk><name><![CDATA[Morning run]]></name><trkseg>${pts}</trkseg></trk></gpx>`;

  it("computes distance, time, elevation and name", () => {
    const g = parseGpx(xml);
    expect(g.name).toBe("Morning run");
    expect(g.points).toBe(11);
    expect(g.distanceM).toBeGreaterThan(1090);
    expect(g.distanceM).toBeLessThan(1130);
    expect(g.elapsedSeconds).toBe(300);
    expect(g.movingSeconds).toBe(300);
    expect(g.elevationGain).toBe(30);
    expect(g.startDate.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });
  it("rejects files without track points", () => {
    expect(() => parseGpx("<gpx></gpx>")).toThrow(/No track points/);
  });
  it("ignores paused time (long gaps) when computing moving time", () => {
    const g = parseGpx(`<gpx><trk><trkseg>${trkpt(12, 77, 0, "2026-11-01T00:00:00Z")}${trkpt(12.001, 77, 0, "2026-11-01T00:00:30Z")}${trkpt(12.002, 77, 0, "2026-11-01T01:00:00Z")}</trkseg></trk></gpx>`);
    expect(g.movingSeconds).toBe(30);
    expect(g.elapsedSeconds).toBe(3600);
  });
});
