import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toRow } from "@/lib/serialize";

// GET /api/campaigns/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const c = await db.campaign.findUnique({ where: { id }, include: { product: true } });
    if (!c) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    return NextResponse.json({ campaign: toRow(c) });
  } catch (e) {
    console.error("GET /api/campaigns/[id] error", e);
    return NextResponse.json({ error: "Falha ao buscar campanha" }, { status: 500 });
  }
}

// PATCH /api/campaigns/[id] — atualiza campos (usado p/ vincular produto)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    // Aceita productId (string | null) e outros campos editáveis
    const data: Record<string, unknown> = {};
    if (body.productId !== undefined) {
      data.productId = body.productId === "" || body.productId === null ? null : String(body.productId);
    }
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.delivery === "string") data.delivery = body.delivery;
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
    const { id } = await params;
    await db.campaign.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/campaigns/[id] error", e);
    return NextResponse.json({ error: "Falha ao excluir campanha" }, { status: 500 });
  }
}
