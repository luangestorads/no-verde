"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtBRL, fmtNumber, fmtPercent, fmtRoas, computeTicket } from "@/lib/metrics";
import { CRITERIOS, type Status } from "@/lib/optimizer";
import type { CampaignRow } from "@/lib/campaign-types";
import { ArrowDownUp, Search, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SortKey = "granaNoBolso" | "roasPurchases" | "spent" | "purchaseConversionValue" | "ctr" | "costPerPurchase" | "purchases";
type Filter = "all" | "ativa" | "pausada" | "lucro" | "prejuizo";

// Status simplificado por campanha para o "semáforo" na tabela
function campaignStatus(c: CampaignRow): Status {
  const roas = c.roasPurchases || 0;
  const ticket = computeTicket(c);
  const cpaPct = ticket > 0 && c.costPerPurchase > 0 ? (c.costPerPurchase / ticket) * 100 : 0;
  const ctr = c.ctr || 0;
  // contagem simples
  let bad = 0, mid = 0, good = 0;
  if (roas >= CRITERIOS.roas.magnifico) good++; else if (roas >= CRITERIOS.roas.ideal) good++; else if (roas >= CRITERIOS.roas.breakEven) mid++; else bad++;
  if (ctr >= CRITERIOS.ctr.excelente) good++; else if (ctr >= CRITERIOS.ctr.bom) mid++; else bad++;
  if (cpaPct > 0) { if (cpaPct <= 30) good++; else if (cpaPct <= CRITERIOS.custoCompra.pctTicket) mid++; else bad++; }
  if (bad > 0) return "ruim";
  if (mid > good) return "atencao";
  if (good > 0) return "excelente";
  return "bom";
}

function statusDot(s: Status): string {
  switch (s) {
    case "excelente": return "bg-emerald-500";
    case "bom": return "bg-emerald-500";
    case "atencao": return "bg-amber-500";
    case "ruim": return "bg-red-500";
  }
}

export function CampaignTable({
  campaigns,
  onSelect,
  onDelete,
}: {
  campaigns: CampaignRow[];
  onSelect: (c: CampaignRow) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("granaNoBolso");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    let r = [...campaigns];
    const q = query.trim().toLowerCase();
    if (q) r = r.filter((c) => c.name.toLowerCase().includes(q));
    if (filter === "ativa") r = r.filter((c) => c.delivery?.toLowerCase().includes("ativ"));
    if (filter === "pausada") r = r.filter((c) => !c.delivery?.toLowerCase().includes("ativ"));
    if (filter === "lucro") r = r.filter((c) => (c.granaNoBolso || 0) >= 0);
    if (filter === "prejuizo") r = r.filter((c) => (c.granaNoBolso || 0) < 0);
    r.sort((a, b) => {
      const av = (a[sortKey] as number) || 0;
      const bv = (b[sortKey] as number) || 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return r;
  }, [campaigns, query, filter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  if (campaigns.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Suas campanhas</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Clique numa campanha para ver o que fazer com ela</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 h-9 w-full sm:w-48"
                aria-label="Buscar campanha"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <SelectTrigger className="h-9 w-full sm:w-40" aria-label="Filtrar campanhas">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="ativa">Ativas</SelectItem>
                <SelectItem value="pausada">Pausadas</SelectItem>
                <SelectItem value="lucro">Dando lucro</SelectItem>
                <SelectItem value="prejuizo">No prejuízo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[28rem] overflow-auto rounded-b-xl custom-scroll">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="min-w-[200px]">Campanha</TableHead>
                <TableHead className="text-right cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("spent")}>
                  <span className="inline-flex items-center gap-1">Investido <ArrowDownUp className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("purchaseConversionValue")}>
                  <span className="inline-flex items-center gap-1">Receita <ArrowDownUp className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("granaNoBolso")}>
                  <span className="inline-flex items-center gap-1">Grana No Bolso <ArrowDownUp className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("roasPurchases")}>
                  <span className="inline-flex items-center gap-1">Retorno <ArrowDownUp className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("ctr")}>
                  <span className="inline-flex items-center gap-1">Cliques <ArrowDownUp className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort("costPerPurchase")}>
                  <span className="inline-flex items-center gap-1">Custo/venda <ArrowDownUp className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => {
                const granaPositive = (c.granaNoBolso || 0) >= 0;
                const roasOk = (c.roasPurchases || 0) >= 1;
                const status = campaignStatus(c);
                return (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelect(c)}>
                    <TableCell className="font-medium max-w-[220px]">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full shrink-0", statusDot(status))} title={`Status: ${status}`} />
                        <span className="truncate" title={c.name}>{c.name}</span>
                      </div>
                      <DeliveryBadge delivery={c.delivery} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmtBRL(c.spent)}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtBRL(c.purchaseConversionValue)}</TableCell>
                    <TableCell className={cn("text-right tabular-nums font-semibold", granaPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                      {fmtBRL(c.granaNoBolso)}
                    </TableCell>
                    <TableCell className={cn("text-right tabular-nums font-medium", roasOk ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                      {fmtRoas(c.roasPurchases)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmtPercent(c.ctr)}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.costPerPurchase > 0 ? fmtBRL(c.costPerPurchase) : "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); onDelete(c.id!); }}
                          aria-label={`Excluir ${c.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma campanha encontrada com esse filtro.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function DeliveryBadge({ delivery }: { delivery: string }) {
  const d = (delivery || "").toLowerCase();
  let variant: "default" | "secondary" | "destructive" = "secondary";
  let label = delivery || "—";
  if (d.includes("ativ")) { variant = "default"; label = "Ativa"; }
  else if (d.includes("paus")) { variant = "secondary"; label = "Pausada"; }
  else if (d.includes("rejeit") || d.includes("negad")) { variant = "destructive"; label = "Rejeitada"; }
  return <Badge variant={variant} className="mt-1 text-[10px] h-4 px-1.5">{label}</Badge>;
}
