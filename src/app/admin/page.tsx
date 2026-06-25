"use client";

import { useState } from "react";
import { AdminPanel } from "@/components/dashboard/admin-panel";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });

    if (res.ok) {
      setAuthenticated(true);
    } else {
      setError("Chave invalida");
    }
    setLoading(false);
  }

  if (authenticated) {
    return <AdminPanel adminKey={key} />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Painel Admin</h1>
          <p className="text-muted-foreground text-sm">Digite a chave de administrador</p>
        </div>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Chave de acesso"
            required
            className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:border-verde-500 focus:ring-1 focus:ring-verde-500 outline-none transition-all"
          />
          {error && <p className="text-destructive text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-verde-500 hover:bg-verde-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all"
          >
            {loading ? "Verificando..." : "Acessar"}
          </button>
        </form>
      </div>
    </div>
  );
}