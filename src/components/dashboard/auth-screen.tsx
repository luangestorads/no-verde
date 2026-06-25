"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function AuthScreen({ onBack }: { onBack?: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Email nao liberado");
      setLoading(false);
      return;
    }

    signIn("credentials", {
      email,
      password: "123456",
      callbackUrl: "/",
    });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {onBack && (
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground mb-8 flex items-center gap-2 text-sm transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Voltar
          </button>
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-verde-400 mb-2">No Verde</h1>
          <p className="text-muted-foreground">Entre com seu email para acessar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-verde-500 focus:ring-1 focus:ring-verde-500 outline-none transition-all"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-verde-500 hover:bg-verde-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground/50 mt-8">
          Acesso restrito — seu email precisa estar liberado pelo administrador
        </p>
      </div>
    </div>
  );
}