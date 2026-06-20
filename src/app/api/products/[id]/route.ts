import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toProductRow } from "@/lib/serialize";
import type { ProductRow } from "@/lib/campaign-types";

// PATCH /api/products/[id] — atualiza um produto
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json()) as Partial<ProductRow>;
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.price !== undefined) data.price = num(body.price);
    if (body.orderBumpName !== undefined) data.orderBumpName = body.orderBumpName?.trim() || null;
    if (body.orderBumpPrice !== undefined) data.orderBumpPrice = num(body.orderBumpPrice);
    if (body.upsellName !== undefined) data.upsellName = body.upsellName?.trim() || null;
    if (body.upsellPrice !== undefined) data.upsellPrice = num(body.upsellPrice);
    if (body.downsellName !== undefined) data.downsellName = body.downsellName?.trim() || null;
    if (body.downsellPrice !== undefined) data.downsellPrice = num(body.downsellPrice);
    if (body.url !== undefined) data.url = body.url?.trim() || null;
    const updated = await db.product.update({ where: { id }, data });
    return NextResponse.json({ product: toProductRow(updated) });
  } catch (e) {
    console.error("PATCH /api/products/[id] error", e);
    return NextResponse.json({ error: "Falha ao atualizar produto" }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/products/[id] error", e);
    return NextResponse.json({ error: "Falha ao excluir produto" }, { status: 500 });
  }
}

function num(v: unknown): number {
  const n = Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}
