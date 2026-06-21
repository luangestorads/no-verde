import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper de autorização admin: precisa do header x-admin-key correto.
function isAdmin(req: Request): boolean {
  const key = req.headers.get("x-admin-key");
  return !!key && key === process.env.NO_ADMIN_KEY;
}

// GET /api/allowed-emails — lista todos os emails autorizados (admin)
export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const list = await db.allowedEmail.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ allowedEmails: list });
}

// POST /api/allowed-emails — adiciona um email de comprador (admin)
// Body: { email: string, note?: string }
export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const email = (body?.email || "").trim().toLowerCase();
    const note = (body?.note || "").trim() || null;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (!email.endsWith("@gmail.com")) {
      return NextResponse.json({ error: "Cadastre apenas emails Gmail (ex.: cliente@gmail.com)" }, { status: 400 });
    }

    const existing = await db.allowedEmail.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Este email já está na lista" }, { status: 409 });
    }

    const created = await db.allowedEmail.create({ data: { email, note } });
    return NextResponse.json({ allowedEmail: created }, { status: 201 });
  } catch (e) {
    console.error("POST /api/allowed-emails error", e);
    return NextResponse.json({ error: "Falha ao adicionar email" }, { status: 500 });
  }
}
