import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toProductRow } from "@/lib/serialize";
import { getUserId } from "@/lib/session";
import type { ProductRow } from "@/lib/campaign-types";

// GET /api/products — lista os produtos DO USUÁRIO logado
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autenticado", products: [] }, { status: 401 });
    const products = await db.product.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ products: products.map(toProductRow) });
  } catch (e) {
    console.error("GET /api/products error", e);
    return NextResponse.json({ error: "Falha ao listar produtos", products: [] }, { status: 500 });
  }
}

// POST /api/products — cria um produto vinculado ao usuário logado
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const body = (await req.json()) as Partial<ProductRow>;
    const data = {
      userId,
      name: (body.name || "").trim() || "Novo Produto",
      description: body.description?.trim() || null,
      price: num(body.price),
      orderBumpName: body.orderBumpName?.trim() || null,
      orderBumpPrice: num(body.orderBumpPrice),
      upsellName: body.upsellName?.trim() || null,
      upsellPrice: num(body.upsellPrice),
      downsellName: body.downsellName?.trim() || null,
      downsellPrice: num(body.downsellPrice),
      url: body.url?.trim() || null,
    };
    const created = await db.product.create({ data });
    return NextResponse.json({ product: toProductRow(created) }, { status: 201 });
  } catch (e) {
    console.error("POST /api/products error", e);
    return NextResponse.json({ error: "Falha ao criar produto" }, { status: 500 });
  }
}

function num(v: unknown): number {
  const n = Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}
