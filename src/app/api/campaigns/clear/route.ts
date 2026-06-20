import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/session";

// DELETE /api/campaigns/clear — remove TODAS as campanhas DO USUÁRIO logado
export async function DELETE() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const r = await db.campaign.deleteMany({ where: { userId } });
    return NextResponse.json({ ok: true, deleted: r.count });
  } catch (e) {
    console.error("DELETE /api/campaigns/clear error", e);
    return NextResponse.json({ error: "Falha ao limpar campanhas" }, { status: 500 });
  }
}
