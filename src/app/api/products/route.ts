import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toProductRow } from "@/lib/serialize";
import type { ProductRow } from "@/lib/campaign-types";

// GET /api/products — lista todos os produtos
export async function GET() {
  try {
    const products = await db.product.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ products: products.map(toProductRow) });
  } catch (e) {
    console.error("GET /api/products error", e);
    return NextResponse.json({ error: "Falha ao listar produtos", products: [] }, { status: 500 });
  }
}

// POST /api/products — cria um produto
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ProductRow>;
    const data = {
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
