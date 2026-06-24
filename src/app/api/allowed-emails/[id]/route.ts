import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function isAdmin(req: Request): boolean {
  const key = req.headers.get("x-admin-key");
  return !!key && key === process.env.NO_ADMIN_KEY;
}

// DELETE /api/allowed-emails/[id] — remove um email da lista (admin)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    await db.allowedEmail.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/allowed-emails/[id] error", e);
    return NextResponse.json({ error: "Falha ao excluir email" }, { status: 500 });
  }
}
