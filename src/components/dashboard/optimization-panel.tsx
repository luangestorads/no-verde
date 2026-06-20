"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtBRL } from "@/lib/metrics";
import { SEVERITY_LABEL, ACTION_LABEL, severityColor, type Recommendation, type Severity } from "@/lib/optimizer";
import { AlertTriangle, TrendingUp, Lightbulb, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SEVERITY_ICON: Record<Severity, React.ReactNode> = {
  critico: <AlertTriangle className="h-4 w-4 text-red-500" />,
  alerta: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  oportunidade: <TrendingUp className="h-4 w-4 text-emerald-500" />,
  bom: <CheckCircle2 className="h-4 w-4 text-muted-foreground" />,
};

const SEVERITY_BORDER: Record<Severity, string> = {
  critico: "border-l-red-500",
  alerta: "border-l-amber-500",
  oportunidade: "border-l-emerald-500",
  bom: "border-l-muted-foreground/30",
};

export function OptimizationPanel({
  recommendations,
  counts,
  upside,
  risk,
  onAskAi,
}: {
  recommendations: Recommendation[];
  counts: Record<Severity, number>;
  upside: number;
  risk: number;
  onAskAi?: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Resumo de potencial */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryStat
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          label="Críticos"
          value={String(counts.critico)}
          tone="negative"
        />
        <SummaryStat
          icon={<Lightbulb className="h-4 w-4 text-amber-500" />}
          label="Alertas"
          value={String(counts.alerta)}
          tone="accent"
        />
        <SummaryStat
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          label="Potencial de escala"
          value={fmtBRL(upside, { compact: true })}
          tone="positive"
        />
        <SummaryStat
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          label="Risco atual"
          value={fmtBRL(risk, { compact: true })}
          tone="negative"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base">Plano de otimização</CardTitle>
              <CardDescription className="text-xs">Recomendações priorizadas por impacto na Grana No Bolso</CardDescription>
            </div>
            {onAskAi && (
              <Button variant="outline" size="sm" onClick={onAskAi} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Análise com IA
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 text-sm">
              Nenhuma campanha para analisar ainda.
            </div>
          ) : (
            <div className="space-y-2 max-h-[40rem] overflow-y-auto pr-1">
              {recommendations.map((r, i) => (
                <RecommendationCard key={i} rec={r} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "positive" | "negative" | "accent" | "default" }) {
  return (
    <Card className="p-3 gap-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={cn(
        "text-lg font-bold tabular-nums",
        tone === "positive" && "text-emerald-600 dark:text-emerald-400",
        tone === "negative" && "text-red-600 dark:text-red-400",
        tone === "accent" && "text-amber-600 dark:text-amber-400",
      )}>
        {value}
      </div>
    </Card>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className={cn("rounded-lg border border-l-4 p-3 bg-card hover:bg-muted/30 transition-colors", SEVERITY_BORDER[rec.severity])}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <span className="mt-0.5 shrink-0">{SEVERITY_ICON[rec.severity]}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{rec.title}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground/80">{rec.campaignName}</span>
              {" · "}
              {rec.metric}: <span className="tabular-nums font-medium">{rec.value}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{rec.detail}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant="outline" className={cn("text-[10px]", severityColor(rec.severity))}>
            {SEVERITY_LABEL[rec.severity]}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">{ACTION_LABEL[rec.action]}</Badge>
          {rec.impact > 0 && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
              +{fmtBRL(rec.impact, { compact: true })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
