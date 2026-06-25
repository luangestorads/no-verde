"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Database, Trash2, RefreshCw, Sparkles, BarChart3, ListChecks, Info, Package, CalendarDays, Globe } from "lucide-react";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ChartsPanel } from "@/components/dashboard/charts-panel";
import { CampaignTable } from "@/components/dashboard/campaign-table";
import { OptimizationPanel } from "@/components/dashboard/optimization-panel";
import AiPanel from "@/components/dashboard/ai-panel";
import { ImportDialog } from "@/components/dashboard/import-dialog";
import { CampaignDetailDrawer } from "@/components/dashboard/campaign-detail-drawer";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CriteriaGuide } from "@/components/dashboard/criteria-guide";
import { ProductsPanel } from "@/components/dashboard/products-panel";
import { MultiloginPanel } from "@/components/dashboard/multilogin-panel";
import { DateFilter, type DateFilterValue } from "@/components/dashboard/date-filter";
import { ProtectionGuard } from "@/components/dashboard/protection-guard";
import type { CampaignRow } from "@/lib/campaign-types";
import type { Summary } from "@/lib/metrics";
import type { Recommendation, Severity } from "@/lib/optimizer";

export function Dashboard() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [counts, setCounts] = useState<Record<Severity, number>>({ critico: 0, alerta: 0, oportunidade: 0, bom: 0 });
  const [upside, setUpside] = useState(0);
  const [risk, setRisk] = useState(0);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [selected, setSelected] = useState<CampaignRow | null>(null);
  const [tab, setTab] = useState("overview");
  const [showGuide, setShowGuide] = useState(false);
  const [productsTick, setProductsTick] = useState(0);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({ period: "all" });

  const qs = useCallback(() => {
    const p = new URLSearchParams();
    p.set("period", dateFilter.period);
    if (dateFilter.from) p.set("from", dateFilter.from);
    if (dateFilter.to) p.set("to", dateFilter.to);
    return p.toString();
  }, [dateFilter]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const q = qs();
      const [campRes, insRes] = await Promise.all([
        fetch(`/api/campaigns?${q}`),
        fetch(`/api/insights?${q}`),
      ]);

      const campData = await campRes.json();
      const insData = await insRes.json();
      setCampaigns(campData.campaigns || []);
      setSummary(insData.summary || null);
      setRecommendations(insData.recommendations || []);
      setCounts(insData.counts || { critico: 0, alerta: 0, oportunidade: 0, bom: 0 });
      setUpside(insData.upside || 0);
      setRisk(insData.risk || 0);
    } catch (e) {
      console.error(e);
      toast.error("Não consegui carregar os dados");
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (productsTick > 0) loadAll();
  }, [productsTick, loadAll]);

  async function handleSeed() {
    const t = toast.loading("Carregando campanhas de exemplo…");
    try {
      // Cria exemplos para hoje, ontem e início da semana para os filtros terem dados
      const results = await Promise.all([
        fetch("/api/campaigns/seed", { method: "POST" }).then((r) => r.json()),
        fetch("/api/campaigns/seed?days=1", { method: "POST" }).then((r) => r.json()),
        fetch("/api/campaigns/seed?days=3", { method: "POST" }).then((r) => r.json()),
      ]);
      const total = results.reduce((a, r) => a + (r.created || 0), 0);
      toast.success(`${total} campanhas de exemplo (hoje, ontem e essa semana)`, { id: t });
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar exemplo", { id: t });
    }
  }

  async function handleClear() {
    const t = toast.loading("Limpando tudo…");
    try {
      const res = await fetch("/api/campaigns/clear", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro");
      toast.success(`${data.deleted} campanhas removidas`, { id: t });
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao limpar", { id: t });
    }
  }

  async function handleDelete(id: string) {
    const t = toast.loading("Excluindo campanha…");
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Campanha excluída", { id: t });
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir", { id: t });
    }
  }

  async function handleRefresh() {
    await loadAll();
    toast.success("Dados atualizados");
  }

  const hasData = campaigns.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <ProtectionGuard />
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-lg sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold leading-tight tracking-tight truncate">
                No Verde
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight truncate">
                Suas campanhas no lucro · sua grana no bolso
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowGuide((s) => !s)}
              aria-label="Como funciona"
              title="Como o sistema julga cada campanha"
              className="h-9 w-9"
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading} aria-label="Atualizar" className="h-9 w-9">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            {hasData && (
              <>
                <Button variant="outline" size="sm" onClick={handleSeed} className="gap-2">
                  <Database className="h-4 w-4" />
                  <span className="hidden sm:inline">Exemplo</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClear} className="gap-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Limpar</span>
                </Button>
              </>
            )}
            <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={loadAll} />
          </div>
        </div>
      </header>

      {/* Guia de critérios (colapsável) */}
      {showGuide && (
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 pt-4">
          <CriteriaGuide />
        </div>
      )}

      {/* Main */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-5 sm:py-6 space-y-5">
        {!hasData ? (
          loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-xl bg-card animate-pulse" />
                ))}
              </div>
              <div className="h-72 rounded-xl bg-card animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4">
              <CriteriaGuide />
              <EmptyState onSeed={handleSeed} onImport={() => setImportOpen(true)} />
            </div>
          )
        ) : (
          <>
            {/* Linha de filtro de data */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span className="font-medium">Período:</span>
              </div>
              <DateFilter value={dateFilter} onChange={setDateFilter} />
            </div>

            <KpiCards summary={summary} />

            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 max-w-2xl">
                <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Visão Geral</span>
                  <span className="sm:hidden">Visão</span>
                </TabsTrigger>
                <TabsTrigger value="optimization" className="gap-1.5 text-xs sm:text-sm">
                  <ListChecks className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">O que fazer</span>
                  <span className="sm:hidden">Ação</span>
                </TabsTrigger>
                <TabsTrigger value="products" className="gap-1.5 text-xs sm:text-sm">
                  <Package className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Produtos</span>
                  <span className="sm:hidden">Prod.</span>
                </TabsTrigger>
                <TabsTrigger value="multilogin" className="gap-1.5 text-xs sm:text-sm">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Multilogin</span>
                  <span className="sm:hidden">Multi</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="gap-1.5 text-xs sm:text-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">IA</span>
                  <span className="sm:hidden">IA</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-5">
                <ChartsPanel campaigns={campaigns} />
                <CampaignTable campaigns={campaigns} onSelect={setSelected} onDelete={handleDelete} />
              </TabsContent>

              <TabsContent value="optimization" className="mt-4 space-y-4">
                <OptimizationPanel
                  recommendations={recommendations}
                  counts={counts}
                  upside={upside}
                  risk={risk}
                  onAskAi={() => setTab("ai")}
                />
                <CriteriaGuide />
              </TabsContent>

              <TabsContent value="products" className="mt-4">
                <ProductsPanel onProductsChange={() => setProductsTick((t) => t + 1)} />
              </TabsContent>

              <TabsContent value="multilogin" className="mt-4">
                <MultiloginPanel />
              </TabsContent>

              <TabsContent value="ai" className="mt-4 space-y-4">
                <AiPanel campaigns={campaigns} avgTicket={summary ? (summary.revenue / Math.max(summary.purchases, 1)) : 100} disabled={!hasData} dateFilter={dateFilter} />
                <CriteriaGuide />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* Footer (sticky bottom) */}
      <footer className="mt-auto border-t bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            No Verde · suas campanhas no lucro
          </span>
          <span className="hidden sm:inline">
            Grana No Bolso = Receita − Investido
          </span>
        </div>
      </footer>

      <CampaignDetailDrawer
        campaign={selected}
        onOpenChange={(v) => !v && setSelected(null)}
        onCampaignUpdated={loadAll}
      />
    </div>
  );
}
