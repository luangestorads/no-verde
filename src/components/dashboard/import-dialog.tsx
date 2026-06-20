"use client";

import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, FileUp, ClipboardPaste } from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

type Result = { created: number; updated: number; skipped: number; error?: string };

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
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState<"file" | "paste">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setRaw("");
    setResult(null);
    setFileName(null);
  };

  // Lê um arquivo e devolve texto (TSV/CSV)
  const readFile = useCallback(async (file: File): Promise<string> => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".xlsm")) {
      // Planilha Excel: converte para CSV via SheetJS
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const firstSheet = wb.SheetNames[0];
      if (!firstSheet) return "";
      const ws = wb.Sheets[firstSheet];
      // sheet_to_csv com tab para casar com o parser TSV do Meta Ads
      return XLSX.utils.sheet_to_csv(ws, { FS: "\t", RS: "\n" });
    }
    // CSV / TSV / texto: lê direto
    return await file.text();
  }, []);

  const handleFile = useCallback(async (file: File) => {
    try {
      setFileName(file.name);
      const text = await readFile(file);
      setRaw(text);
      setResult(null);
    } catch (e) {
      setFileName(null);
      setResult({ created: 0, updated: 0, skipped: 0, error: `Não consegui ler o arquivo: ${e instanceof Error ? e.message : "erro desconhecido"}` });
    }
  }, [readFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

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
        setResult({ created: data.created, updated: data.updated, skipped: data.skipped });
        onImported();
      }
    } catch (e) {
      setResult({ created: 0, updated: 0, skipped: 0, error: e instanceof Error ? e.message : "Falha de conexão" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(reset, 200); }}>
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
            Importar campanhas
          </DialogTitle>
          <DialogDescription>
            Envie um arquivo (.csv ou .xlsx) exportado do Gerenciador de Anúncios da Meta, ou cole os dados.
            Reconhecemos as colunas automaticamente.
          </DialogDescription>
        </DialogHeader>

        {/* Alternador de modo */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              mode === "file" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <FileUp className="h-3.5 w-3.5" />
            Enviar arquivo
          </button>
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              mode === "paste" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            Colar texto
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3">
          {mode === "file" ? (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex-1 min-h-[220px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 p-6 cursor-pointer transition-colors text-center",
                  dragOver
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                    : "border-muted-foreground/30 hover:border-emerald-400 hover:bg-muted/40",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.xlsx,.xls,.xlsm,text/csv,text/tab-separated-values"
                  className="hidden"
                  onChange={onInputChange}
                />
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                  <FileUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                {fileName ? (
                  <div>
                    <div className="text-sm font-medium">{fileName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Pronto para importar. Clique em "Importar campanhas".</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-medium">Arraste um arquivo aqui ou clique para escolher</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Aceita .csv, .xlsx e .xls</div>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setFileName(null); setRaw(SAMPLE); setMode("paste"); }} className="self-start text-xs h-7">
                Ou use um exemplo
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  Cole as linhas (incluindo o cabeçalho com os nomes das colunas).
                </span>
                <Button variant="ghost" size="sm" onClick={() => setRaw(SAMPLE)} className="h-7 text-xs">
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
            </>
          )}

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
