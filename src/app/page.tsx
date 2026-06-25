"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AuthScreen } from "@/components/dashboard/auth-screen";

const Dashboard = dynamic(
  () => import("@/components/dashboard/dashboard").then((m) => m.default),
  { ssr: false, loading: () => <LoadingSkeleton /> }
);

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-6">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-muted animate-pulse rounded-xl" />
      <div className="h-96 bg-muted animate-pulse rounded-xl" />
    </div>
  );
}

function LandingPage({ onLogin, onDemo }: { onLogin: () => void; onDemo: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-verde-900/20 via-transparent to-verde-900/10" />
        <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-20 text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-verde-500/10 border border-verde-500/20 text-verde-400 text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-verde-400 animate-pulse" />
              Ferramenta de otimizacao de anuncios
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="text-verde-400">No Verde</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-4">
              Suas campanhas no lucro · sua grana no bolso
            </p>
            <p className="text-muted-foreground/70 max-w-lg mx-auto mb-10">
              IA analisa cada campanha do Meta Ads e te diz exatamente o que pausar, escalar e ajustar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onLogin}
                className="px-8 py-3.5 bg-verde-500 hover:bg-verde-600 text-white font-semibold rounded-xl transition-all glow-green"
              >
                Comecar agora →
              </button>
              <button
                onClick={onDemo}
                className="px-8 py-3.5 border border-border hover:bg-accent rounded-xl font-semibold transition-all"
              >
                Ver demonstracao
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Tudo que voce precisa</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "🎯", title: "Analise Inteligente", desc: "IA avalia cada campanha com criterios reais de lucratividade" },
            { icon: "📊", title: "Dashboard Completo", desc: "KPIs, graficos, funil de conversao e tabela de campanhas" },
            { icon: "🚦", title: "Sinalizacao Visual", desc: "Verde, amarelo e vermelho pra voce saber agir rapido" },
            { icon: "📥", title: "Importacao Facil", desc: "Cole o CSV do Meta Ads e pronto — dados importados" },
            { icon: "🔒", title: "Acesso Privado", desc: "So quem voce liberar consegue usar a plataforma" },
            { icon: "💡", title: "Recomendacoes", desc: "Dicas claras do que pausar, escalar ou ajustar" },
          ].map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-border bg-card hover:border-verde-500/30 hover:bg-verde-500/5 transition-all group"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-verde-400 transition-colors">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Como funciona</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Acesse", desc: "Faca login com seu email liberado pelo admin" },
            { step: "02", title: "Importe", desc: "Cole os dados do CSV exportado do Meta Ads" },
            { step: "03", title: "Otimize", desc: "Veja o que esta no lucro e o que precisa mudar" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 rounded-full bg-verde-500/10 border border-verde-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-verde-400 font-bold">{s.step}</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Perguntas frequentes</h2>
        <div className="space-y-4">
          {[
            { q: "O que e o No Verde?", a: "E uma ferramenta que analisa suas campanhas de Meta Ads e te mostra quais estao dando lucro e quais estao perdendo dinheiro." },
            { q: "Preciso de conta no Meta Ads?", a: "Sim. Voce precisa exportar os dados das suas campanhas no Gerenciador de Anuncios do Meta e importar no No Verde." },
            { q: "Meus dados ficam seguros?", a: "Sim. Seus dados ficam armazenados de forma criptografada em um banco de dados privado." },
            { q: "Como funciona o acesso?", a: "O administrador libera seu email. Depois e so fazer login e comecar a usar." },
          ].map((faq, i) => (
            <details key={i} className="group rounded-xl border border-border bg-card">
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium">
                {faq.q}
                <svg className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-5 pb-5 text-muted-foreground text-sm">{faq.a}</div>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-muted-foreground text-sm">
        No Verde. Todos os direitos reservados.
      </footer>
    </div>
  );
}

export default function Page() {
  const { data: session, status } = useSession();
  const [view, setView] = useState<"landing" | "auth">("landing");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("admin");
    if (key) {
      setIsAdmin(true);
    }
  }, []);

  if (isAdmin) {
    const AdminPanel = dynamic(
      () => import("@/components/dashboard/admin-panel").then((m: any) => m.default),
      { ssr: false }
    );
    return <AdminPanel />;
  }

  if (status === "loading") {
    return <LoadingSkeleton />;
  }

  if (session) {
    return <Dashboard />;
  }

  if (view === "auth") {
    return <AuthScreen onBack={() => setView("landing")} />;
  }

  return (
    <LandingPage
      onLogin={() => setView("auth")}
      onDemo={() => {
        fetch("/api/campaigns/seed", { method: "POST" }).then(() => {
          signIn("credentials", { email: "demo@noverde.com", password: "demo", callbackUrl: "/" });
        });
      }}
    />
  );
}
