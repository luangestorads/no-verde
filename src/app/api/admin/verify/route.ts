import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { key } = await req.json();

  if (key === process.env.NO_ADMIN_KEY) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Chave inválida" }, { status: 401 });
}