import { auth } from "@/lib/auth";
import { syncUserTrades } from "@/lib/exchange";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncUserTrades(session.user.id);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/trades/sync] Error:", err);
    return NextResponse.json(
      { error: "Sync failed", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
