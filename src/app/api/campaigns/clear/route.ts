import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// DELETE /api/campaigns/clear — remove todas as campanhas
export async function DELETE() {
  try {
    const r = await db.campaign.deleteMany({});
    return NextResponse.json({ ok: true, deleted: r.count });
  } catch (e) {
    console.error("DELETE /api/campaigns/clear error", e);
    return NextResponse.json({ error: "Falha ao limpar campanhas" }, { status: 500 });
  }
}
