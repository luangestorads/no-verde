"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { PiggyBank, Database, Trash2, RefreshCw, Sparkles, BarChart3, ListChecks, Info } from "lucide-react";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ChartsPanel } from "@/components/dashboard/charts-panel";
import { CampaignTable } from "@/components/dashboard/campaign-table";
import { OptimizationPanel } from "@/components/dashboard/optimization-panel";
import { AiPanel } from "@/components/dashboard/ai-panel";
import { ImportDialog } from "@/components/dashboard/import-dialog";
import { CampaignDetailDrawer } from "@/components/dashboard/campaign-detail-drawer";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CriteriaGuide } from "@/components/dashboard/criteria-guide";
import type { CampaignRow } from "@/lib/campaign-types";
import type { Summary } from "@/lib/metrics";
import type { Recommendation, Severity } from "@/lib/optimizer";

export default function Home() {
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

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [campRes, insRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/insights"),
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
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleSeed() {
    const t = toast.loading("Carregando campanhas de exemplo…");
    try {
      const res = await fetch("/api/campaigns/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro");
      toast.success(`${data.created} campanhas carregadas`, { id: t });
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
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-lg sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
              <PiggyBank className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold leading-tight tracking-tight truncate">
                Grana No Bolso
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">
                O otimizador das suas campanhas de Meta Ads
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
            <KpiCards summary={summary} />

            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger value="optimization" className="gap-1.5 text-xs sm:text-sm">
                  <ListChecks className="h-3.5 w-3.5" />
                  O que fazer
                </TabsTrigger>
                <TabsTrigger value="ai" className="gap-1.5 text-xs sm:text-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  IA
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

              <TabsContent value="ai" className="mt-4 space-y-4">
                <AiPanel disabled={!hasData} />
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
            <PiggyBank className="h-3.5 w-3.5 text-amber-500" />
            Grana No Bolso · seu lucro limpo após os anúncios
          </span>
          <span className="hidden sm:inline">
            Grana No Bolso = Receita − Investido
          </span>
        </div>
      </footer>

      <CampaignDetailDrawer campaign={selected} onOpenChange={(v) => !v && setSelected(null)} />
    </div>
  );
}
