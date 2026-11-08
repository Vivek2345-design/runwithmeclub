import { describe, expect, it } from "vitest";
import { activityLoad, fitnessSeries, formStatus, formatPace, personalRecords, weeklyVolume } from "./metrics";

describe("activityLoad", () => {
  it("scores one hour at FTP as 100", () => {
    expect(activityLoad({ sportType: "Ride", movingTime: 3600, avgWatts: 250 }, { ftp: 250 })).toBe(100);
  });
  it("scores by power in preference to heart rate", () => {
    const withPower = activityLoad({ sportType: "Ride", movingTime: 3600, avgWatts: 125, avgHr: 180 }, { ftp: 250 });
    expect(withPower).toBe(25);
  });
  it("uses heart rate reserve when there is no power", () => {
    // reserve = (155-55)/(190-55)=0.7407; IF = 0.7407/0.85 = 0.8715; load = 75.9
    expect(activityLoad({ sportType: "Run", movingTime: 3600, avgHr: 155 })).toBeCloseTo(75.9, 0);
  });
  it("falls back to a sport default with no sensors", () => {
    expect(activityLoad({ sportType: "Run", movingTime: 3600 })).toBeCloseTo(56.3, 1);
  });
  it("returns 0 for zero duration and clamps absurd intensity", () => {
    expect(activityLoad({ sportType: "Run", movingTime: 0 })).toBe(0);
    expect(activityLoad({ sportType: "Run", movingTime: 3600, avgHr: 400 })).toBeLessThanOrEqual(196);
  });
});

describe("fitnessSeries", () => {
  it("is empty without activities", () => {
    expect(fitnessSeries([])).toEqual([]);
  });
  it("builds CTL/ATL day by day, ATL reacting faster than CTL", () => {
    const s = fitnessSeries([{ startDate: new Date("2026-01-01T08:00:00Z"), load: 100 }], new Date("2026-01-03T00:00:00Z"));
    expect(s.map((p) => p.date)).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
    expect(s[0].atl).toBeGreaterThan(s[0].ctl);
    expect(s[2].atl).toBeLessThan(s[0].atl); // decays with rest
    expect(s[0].tsb).toBeCloseTo(s[0].ctl - s[0].atl, 1);
  });
  it("files an early-morning IST run under its IST date, not the UTC date", () => {
    // 2026-01-02 05:00 IST == 2026-01-01 23:30 UTC
    const s = fitnessSeries([{ startDate: new Date("2026-01-01T23:30:00Z"), load: 50 }], new Date("2026-01-01T23:30:00Z"));
    expect(s[0].date).toBe("2026-01-02");
  });
  it("sums multiple activities on one day", () => {
    const s = fitnessSeries(
      [{ startDate: new Date("2026-01-01T06:00:00Z"), load: 40 }, { startDate: new Date("2026-01-01T18:00:00Z"), load: 60 }],
      new Date("2026-01-01T12:00:00Z"),
    );
    expect(s).toHaveLength(1);
    expect(s[0].load).toBe(100);
  });
});

describe("formStatus", () => {
  it("labels ranges", () => {
    expect(formStatus(10).label).toBe("Fresh");
    expect(formStatus(0).label).toBe("Balanced");
    expect(formStatus(-20).label).toBe("Building");
    expect(formStatus(-40).label).toBe("Overreaching");
  });
});

describe("weeklyVolume", () => {
  it("buckets by Monday-start week and returns exactly N weeks", () => {
    const now = new Date("2026-11-08T12:00:00Z"); // Sunday
    const w = weeklyVolume(
      [
        { startDate: new Date("2026-11-02T06:00:00Z"), movingTime: 3600, distance: 10000, load: 50 },
        { startDate: new Date("2026-11-08T06:00:00Z"), movingTime: 1800, distance: 5000, load: 20 },
        { startDate: new Date("2020-01-01T06:00:00Z"), movingTime: 9999, distance: 1, load: 1 },
      ],
      4,
      now,
    );
    expect(w).toHaveLength(4);
    expect(w[3]).toMatchObject({ weekStart: "2026-11-02", hours: 1.5, distanceKm: 15, count: 2, load: 70 });
    expect(w[0].count).toBe(0);
  });
});

describe("personalRecords", () => {
  const a = (o: object) => ({ id: "1", name: "x", sportType: "Run", startDate: new Date("2026-01-01"), distance: 10000, movingTime: 3000, elevationGain: 0, ...o });
  it("picks the fastest run over a threshold distance", () => {
    const r = personalRecords([a({ id: "1", distance: 5200, movingTime: 1500 }), a({ id: "2", distance: 6000, movingTime: 1500 })]);
    const five = r.find((x) => x.label.includes("5 km"))!;
    expect(five.activityId).toBe("2");
  });
  it("ignores activities with no distance", () => {
    expect(personalRecords([a({ distance: 0 })]).find((x) => x.label === "Longest run")).toBeUndefined();
  });
});

describe("formatPace", () => {
  it("formats seconds per km", () => expect(formatPace(300)).toBe("5:00 /km"));
});
