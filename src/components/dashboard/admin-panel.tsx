"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fmtBRL } from "@/lib/metrics";
import { Mail, Plus, Trash2, Loader2, ShieldAlert, Users, CheckCircle2, Clock } from "lucide-react";

type AllowedEmail = {
  id: string;
  email: string;
  note: string | null;
  used: boolean;
  createdAt: string;
};

export function AdminPanel({ adminKey }: { adminKey: string }) {
  const [list, setList] = useState<AllowedEmail[]>([]);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/allowed-emails", { headers: { "x-admin-key": adminKey } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro");
      setList(data.allowedEmails || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar lista");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    const t = toast.loading("Adicionando email…");
    try {
      const res = await fetch("/api/allowed-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ email, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro");
      toast.success(`${email} liberado para cadastro`, { id: t });
      setEmail(""); setNote("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao adicionar", { id: t });
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string, email: string) {
    const t = toast.loading("Removendo…");
    try {
      const res = await fetch(`/api/allowed-emails/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Erro");
      toast.success(`${email} removido da lista`, { id: t });
      await load();
    } catch {
      toast.error("Falha ao remover", { id: t });
    }
  }

  const usedCount = list.filter((e) => e.used).length;
  const pendingCount = list.length - usedCount;

  return (
    <div className="min-h-screen bg-muted/30 py-6 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-md">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Painel Admin · No Verde</h1>
            <p className="text-sm text-muted-foreground">Cadastre os emails Gmail dos clientes que compraram o acesso</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" />Total</div>
            <div className="text-2xl font-bold tabular-nums">{list.length}</div>
          </Card>
          <Card className="p-4 gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />Cadastrados</div>
            <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{usedCount}</div>
          </Card>
          <Card className="p-4 gap-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5 text-amber-500" />Aguardando</div>
            <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{pendingCount}</div>
          </Card>
        </div>

        {/* Formulário de adicionar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" />Liberar novo comprador</CardTitle>
            <CardDescription className="text-xs">O cliente poderá se cadastrar com este Gmail e escolher a própria senha</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={add} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email" className="text-xs">Gmail do cliente *</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@gmail.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-note" className="text-xs">Anotação (opcional)</Label>
                <Input
                  id="admin-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex.: João, comprou em 15/06, R$ 197"
                />
              </div>
              <Button type="submit" disabled={adding || !email.trim()} className="gap-2">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Liberar acesso
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de emails */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Emails liberados ({list.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : list.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Nenhum email liberado ainda.
                <br />
                Adicione o primeiro acima.
              </div>
            ) : (
              <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1 custom-scroll">
                {list.map((e) => (
                  <div key={e.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{e.email}</span>
                        <Badge variant={e.used ? "default" : "secondary"} className="text-[10px]">
                          {e.used ? "Cadastrou" : "Aguardando"}
                        </Badge>
                      </div>
                      {e.note && <p className="text-xs text-muted-foreground mt-0.5 truncate">{e.note}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => remove(e.id, e.email)}
                      aria-label={`Remover ${e.email}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => { window.location.href = "/"; }}>
            Voltar para o app
          </Button>
        </div>
      </div>
    </div>
  );
}
