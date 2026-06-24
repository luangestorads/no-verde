import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toRow } from "@/lib/serialize";
import { getUserId } from "@/lib/session";

// GET /api/campaigns/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;
    const c = await db.campaign.findFirst({ where: { id, userId }, include: { product: true } });
    if (!c) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    return NextResponse.json({ campaign: toRow(c) });
  } catch (e) {
    console.error("GET /api/campaigns/[id] error", e);
    return NextResponse.json({ error: "Falha ao buscar campanha" }, { status: 500 });
  }
}

// PATCH /api/campaigns/[id] — só dono pode alterar
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;
    // Garante posse
    const owned = await db.campaign.findFirst({ where: { id, userId } });
    if (!owned) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.productId !== undefined) {
      // valida que o produto (se informado) é do mesmo usuário
      if (body.productId) {
        const p = await db.product.findFirst({ where: { id: String(body.productId), userId } });
        if (!p) return NextResponse.json({ error: "Produto inválido" }, { status: 400 });
        data.productId = String(body.productId);
      } else {
        data.productId = null;
      }
    }
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.delivery === "string") data.delivery = body.delivery;
    if (body.reportDate) data.reportDate = new Date(body.reportDate);
    const updated = await db.campaign.update({ where: { id }, data, include: { product: true } });
    return NextResponse.json({ campaign: toRow(updated) });
  } catch (e) {
    console.error("PATCH /api/campaigns/[id] error", e);
    return NextResponse.json({ error: "Falha ao atualizar campanha" }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;
    const owned = await db.campaign.findFirst({ where: { id, userId } });
    if (!owned) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    await db.campaign.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/campaigns/[id] error", e);
    return NextResponse.json({ error: "Falha ao excluir campanha" }, { status: 500 });
  }
}
