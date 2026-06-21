import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// POST /api/auth/register
// Cria um novo usuário — mas SOMENTE se:
// 1. O email for Gmail (termina em @gmail.com)
// 2. O email estiver na lista de AllowedEmail (comprador autorizado)
// 3. Ainda não tiver sido usado (used = false)
// A senha é por escolha própria do usuário (mínimo 6 caracteres), hasheada com bcrypt.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email || "").trim().toLowerCase();
    const password = body?.password || "";
    const name = (body?.name || "").trim();

    // Validação 1: formato de email
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Validação 2: SÓ Gmail
    if (!email.endsWith("@gmail.com")) {
      return NextResponse.json({
        error: "Só aceitamos emails do Gmail (ex.: seu.email@gmail.com). Use um Gmail para se cadastrar.",
      }, { status: 400 });
    }

    // Validação 3: senha mínima
    if (password.length < 6) {
      return NextResponse.json({ error: "A senha precisa ter pelo menos 6 caracteres" }, { status: 400 });
    }

    // Validação 4: email precisa estar na lista de compradores autorizados
    const allowed = await db.allowedEmail.findUnique({ where: { email } });
    if (!allowed) {
      return NextResponse.json({
        error: "Este email não está autorizado. É preciso ter comprado o acesso ao No Verde. Se você já comprou, entre em contato para liberarmos seu Gmail.",
      }, { status: 403 });
    }

    // Validação 5: não pode já ter sido usado
    if (allowed.used) {
      return NextResponse.json({
        error: "Este email já foi usado para criar uma conta. Faça login com a senha que você escolheu.",
      }, { status: 409 });
    }

    // Validação 6: email não pode já existir como User (defensivo)
    const exists = await db.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Este email já está cadastrado. Faça login." }, { status: 409 });
    }

    // Cria o usuário com senha hasheada
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { email, passwordHash, name: name || null },
      select: { id: true, email: true, name: true },
    });

    // Marca o email autorizado como usado
    await db.allowedEmail.update({
      where: { email },
      data: { used: true },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (e) {
    console.error("POST /api/auth/register error", e);
    return NextResponse.json({ error: "Falha ao criar conta" }, { status: 500 });
  }
}
