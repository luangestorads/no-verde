"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Result = { created: number; updated: number; skipped: number; error?: string; detectedColumns?: Record<string, string> };

const SAMPLE = `Campanha\tVeiculação\tAções\tOrçamento\tValor usado\tCTR (todos)\tFinalizações de compra iniciadas\tVisualizações da página de destino\tCompras\tCusto por compra\tValor de conversão da compra\tROAS (retorno sobre o investimento em publicidade) das compras
Promo Verão\tAtiva\tConversões\t200\t187,50\t2,40\t38\t980\t14\t13,39\t2310\t12,32
Outlet Calçados\tAtiva\tConversões\t180\t176,50\t2,90\t30\t760\t13\t13,58\t2120\t12,01`;

export function ImportDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}) {
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleImport() {
    if (!raw.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/campaigns/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ created: 0, updated: 0, skipped: 0, error: data?.error || "Erro ao importar" });
      } else {
        setResult({ created: data.created, updated: data.updated, skipped: data.skipped, detectedColumns: data.detectedColumns });
        onImported();
      }
    } catch (e) {
      setResult({ created: 0, updated: 0, skipped: 0, error: e instanceof Error ? e.message : "Falha de conexão" });
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setRaw(SAMPLE);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Importar Meta Ads</span>
          <span className="sm:hidden">Importar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar dados do Gerenciador de Anúncios
          </DialogTitle>
          <DialogDescription>
            No Meta Ads, exporte sua tabela (Botão "Exportar" → "Tabela"), copie tudo e cole abaixo.
            O sistema detecta as colunas automaticamente (TSV ou CSV).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Cole aqui as linhas (incluindo o cabeçalho com os nomes das colunas).
            </span>
            <Button variant="ghost" size="sm" onClick={loadSample} className="h-7 text-xs">
              Usar exemplo
            </Button>
          </div>
          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={"Campanha\tVeiculação\tValor usado\tCTR (todos)\tCompras\tValor de conversão da compra\t..."}
            className="flex-1 min-h-[200px] font-mono text-xs resize-none"
            aria-label="Dados colados do Meta Ads"
          />

          {result && (
            <div className="rounded-lg border p-3 text-sm">
              {result.error ? (
                <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{result.error}</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Importação concluída!</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {result.created} criadas · {result.updated} atualizadas · {result.skipped} ignoradas
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={handleImport} disabled={loading || !raw.trim()} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importar campanhas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
