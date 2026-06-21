// Helper para obter o usuário autenticado nas API routes.
// Retorna o userId ou null. Todas as rotas de dados DEVEM chamar isto.
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  return id || null;
}

export async function requireUser(): Promise<string> {
  const id = await getUserId();
  if (!id) throw new Error("UNAUTHORIZED");
  return id;
}
