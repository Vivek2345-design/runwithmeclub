import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/session";
import { needsStravaConnection } from "@/lib/strava-gate";

// Every member page except Profile and Connect Strava lives under this layout.
export default async function GatedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (needsStravaConnection(user, env.requireStrava)) redirect("/connect-strava");
  return children;
}
