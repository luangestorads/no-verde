import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthScreen } from "@/components/dashboard/auth-screen";
import { Dashboard } from "@/components/dashboard/dashboard";
import { AdminPanel } from "@/components/dashboard/admin-panel";

// Página única: mostra login se deslogado, dashboard se logado.
// Painel admin acessível via ?admin=CHAVE_DO_ADMIN (sem precisar logar).
// A sessão é verificada no servidor (SSR) para segurança.
export default async function Home({ searchParams }: { searchParams: Promise<{ admin?: string }> }) {
  const sp = await searchParams;
  const adminKey = sp.admin;

  // Modo admin: se a chave bater, mostra o painel de liberação de compradores
  if (adminKey && adminKey === process.env.NO_ADMIN_KEY) {
    return <AdminPanel adminKey={adminKey} />;
  }

  const session = await getServerSession(authOptions);

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <Dashboard
      userEmail={session.user?.email}
      userName={session.user?.name}
    />
  );
}
