// Helper de "usuário" — modo sem login.
// Cria/usa um único usuário local ("eu@noverde.app") automaticamente.
// Assim não precisa de tela de login e toda a lógica existente (userId) continua funcionando.
import { db } from "@/lib/db";

const LOCAL_EMAIL = "eu@noverde.app";
let cachedId: string | null = null;

export async function getUserId(): Promise<string | null> {
  if (cachedId) return cachedId;
  try {
    let user = await db.user.findUnique({ where: { email: LOCAL_EMAIL } });
    if (!user) {
      user = await db.user.create({
        data: {
          email: LOCAL_EMAIL,
          name: "Eu",
          passwordHash: "local-no-auth",
        },
      });
    }
    cachedId = user.id;
    return user.id;
  } catch (e) {
    console.error("getUserId error", e);
    return null;
  }
}

export async function requireUser(): Promise<string> {
  const id = await getUserId();
  if (!id) throw new Error("UNAUTHORIZED");
  return id;
}
