import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// For uptime monitors and Railway's health check. Exposes nothing beyond up/down.
export async function GET() {
  try {
    // Touch a real table, not just the connection, so a database with missing migrations reports as down.
    await db.user.findFirst({ select: { id: true } });
    return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
