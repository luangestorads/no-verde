"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Campaign {
  id: string;
  name: string;
  spend: number;
  revenue: number;
  roas: number;
  cpa: number;
  ctr: number;
  purchases: number;
  status: string;
}

interface AIPanelProps {
  campaigns: Campaign[];
  avgTicket?: number;
}

function getSignal(roas: number, cpa: number, ctr: number, avgTicket: number) {
  let score = 0;
  if (roas >= 2) score++;
  if (cpa <= avgTicket * 0.6) score++;
  if (ctr >= 2) score++;
  if (score >= 2) return "green";
  if (score >= 1) return "yellow";
  return "red";
}

function getRecommendation(c: Campaign, signal: string, avgTicket: number) {
  if (c.status === "PAUSED") {
    return { text: "Campanha pausada. Considere reativar se o histórico era positivo.", type: "info" as const };
  }
  if (signal === "green") {
    return { text: `Ótimo desempenho! ROAS de ${c.roas.toFixed(2)}x. Considere escalar o orçamento em 20%.`, type: "success" as const };
  }
  if (signal === "yellow") {
    const issues = [];
    if (c.roas < 2) issues.push(`ROAS baixo (${c.roas.toFixed(2)}x)`);
    if (c.cpa > avgTicket * 0.6) issues.push(`CPA alto (R$${c.cpa.toFixed(2)})`);
    if (c.ctr < 2) issues.push(`CTR baixo (${c.ctr.toFixed(1)}%)`);
    return { text: `Atenção: ${issues.join(", ")}. Teste novos criativos ou ajuste o público-alvo.`, type: "warning" as const };
  }
  return { text: `Campanha no vermelho! ROAS ${c.roas.toFixed(2)}x e CPA R$${c.cpa.toFixed(2)}. Recomendo pausar e revisar a estratégia.`, type: "danger" as const };
}

const typeStyles = {
  success: "border-verde-500/30 bg-verde-500/5 text-verde-400",
  warning: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",
  danger: "border-red-500/30 bg-red-500/5 text-red-400",
  info: "border-blue-500/30 bg-blue-500/5 text-blue-400",
};

const signalColors = {
  green: "bg-verde-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};

export default function AIPanel({ campaigns, avgTicket = 100 }: AIPanelProps) {
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  function handleAnalyze() {
    setLoading(true);
    setTimeout(() => {
      setAnalyzed(true);
      setLoading(false);
    }, 1500);
  }

  const activeCampaigns = campaigns.filter((c) => c.status !== "PAUSED");
  const pausedCampaigns = campaigns.filter((c) => c.status === "PAUSED");
  const greenCount = activeCampaigns.filter((c) => getSignal(c.roas, c.cpa, c.ctr, avgTicket) === "green").length;
  const yellowCount = activeCampaigns.filter((c) => getSignal(c.roas, c.cpa, c.ctr, avgTicket) === "yellow").length;
  const redCount = activeCampaigns.filter((c) => getSignal(c.roas, c.cpa, c.ctr, avgTicket) === "red").length;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          🤖 Análise da IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analyzed ? (
          <>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-verde-500/10 border border-verde-500/20">
                <div className="text-2xl font-bold text-verde-400">{greenCount}</div>
                <div className="text-xs text-verde-400/70">No verde</div>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="text-2xl font-bold text-yellow-400">{yellowCount}</div>
                <div className="text-xs text-yellow-400/70">Atenção</div>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="text-2xl font-bold text-red-400">{redCount}</div>
                <div className="text-xs text-red-400/70">No vermelho</div>
              </div>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading || campaigns.length === 0}
              className="w-full py-2.5 bg-verde-500 hover:bg-verde-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm"
            >
              {loading ? "Analisando campanhas..." : "Analisar todas as campanhas"}
            </button>
          </>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {campaigns.map((c) => {
              const signal = getSignal(c.roas, c.cpa, c.ctr, avgTicket);
              const rec = getRecommendation(c, signal, avgTicket);
              return (
                <div key={c.id} className={`p-3 rounded-xl border ${typeStyles[rec.type]} text-sm`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${signalColors[signal]}`} />
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <p className="opacity-80">{rec.text}</p>
                </div>
              );
            })}
            {pausedCampaigns.length > 0 && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                + {pausedCampaigns.length} campanha(s) pausada(s) não analisada(s)
              </div>
            )}
            <button
              onClick={() => setAnalyzed(false)}
              className="w-full py-2 border border-border hover:bg-accent rounded-xl text-sm transition-all"
            >
              Nova análise
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}   