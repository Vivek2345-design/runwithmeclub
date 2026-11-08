import type { Challenge } from "@prisma/client";
import type { Metric } from "./queries";

export const METRIC_INFO: Record<string, { label: string; unit: string; key: Metric }> = {
  DISTANCE: { label: "Distance", unit: "km", key: "DISTANCE" },
  ELEVATION: { label: "Elevation gain", unit: "m", key: "ELEVATION" },
  ACTIVITIES: { label: "Number of runs", unit: "runs", key: "ACTIVITIES" },
  TIME: { label: "Time running", unit: "h", key: "TIME" },
};

/** Challenge end dates are stored at 23:59:59 IST; ranges are half-open so add a second. */
export const challengeRange = (c: Pick<Challenge, "startDate" | "endDate">) => ({ start: c.startDate, end: new Date(c.endDate.getTime() + 1000) });

export function challengeState(c: Pick<Challenge, "startDate" | "endDate">, now = new Date()): "UPCOMING" | "LIVE" | "ENDED" {
  return now < c.startDate ? "UPCOMING" : now > c.endDate ? "ENDED" : "LIVE";
}
