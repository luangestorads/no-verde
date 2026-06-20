import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthScreen } from "@/components/dashboard/auth-screen";
import { Dashboard } from "@/components/dashboard/dashboard";

// Página única: mostra login se deslogado, dashboard se logado.
// A sessão é verificada no servidor (SSR) para segurança.
export default async function Home() {
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
