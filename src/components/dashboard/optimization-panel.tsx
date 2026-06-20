"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { fmtBRL } from "@/lib/metrics";
import {
  SEVERITY_LABEL, ACTION_LABEL, severityColor, severityBg,
  STATUS_LABEL, statusColor, statusBg,
  type Recommendation, type Severity, type Veredito,
} from "@/lib/optimizer";
import { AlertTriangle, TrendingUp, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
      {/* Resumo visual de potencial */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryStat
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          label="Precisa de atenção urgente"
          value={String(counts.critico)}
          tone="negative"
        />
        <SummaryStat
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          label="Com problemas"
          value={String(counts.alerta)}
          tone="accent"
        />
        <SummaryStat
          icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
          label="Pode ganhar mais"
          value={fmtBRL(upside, { compact: true })}
          tone="positive"
          hint="Se escalar as boas"
        />
        <SummaryStat
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          label="Em risco agora"
          value={fmtBRL(risk, { compact: true })}
          tone="negative"
          hint="Prejuízo nas críticas"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base">Plano de ação</CardTitle>
              <CardDescription className="text-xs">O que fazer em cada campanha, em ordem de importância</CardDescription>
            </div>
            {onAskAi && (
              <Button variant="outline" size="sm" onClick={onAskAi} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Pedir ajuda da IA
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
            <div className="space-y-2.5 max-h-[44rem] overflow-y-auto pr-1 custom-scroll">
              {recommendations.map((r, i) => (
                <RecommendationCard key={i} rec={r} defaultOpen={i < 3} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryStat({ icon, label, value, tone, hint }: { icon: React.ReactNode; label: string; value: string; tone: "positive" | "negative" | "accent"; hint?: string }) {
  return (
    <Card className="p-4 gap-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span className="leading-tight">{label}</span>
      </div>
      <div className={cn(
        "text-xl sm:text-2xl font-bold tabular-nums",
        tone === "positive" && "text-emerald-600 dark:text-emerald-400",
        tone === "negative" && "text-red-600 dark:text-red-400",
        tone === "accent" && "text-amber-600 dark:text-amber-400",
      )}>
        {value}
      </div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function RecommendationCard({ rec, defaultOpen = false }: { rec: Recommendation; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const sev = rec.severity;

  return (
    <div className={cn(
      "rounded-xl border border-l-4 overflow-hidden bg-card hover:bg-muted/20 transition-colors",
      sev === "critico" && "border-l-red-500",
      sev === "alerta" && "border-l-amber-500",
      sev === "oportunidade" && "border-l-emerald-500",
      sev === "bom" && "border-l-emerald-400",
    )}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left p-3.5 flex items-start justify-between gap-3"
        aria-expanded={open}
      >
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <span className={cn("mt-1.5 h-2.5 w-2.5 rounded-full shrink-0", severityBg(sev))} />
          <div className="min-w-0">
            <div className="font-medium text-sm leading-snug">{rec.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5 truncate">{rec.campaignName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={cn("text-[10px]", severityColor(sev))}>
            {SEVERITY_LABEL[sev]}
          </Badge>
          {rec.impact > 0 && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
              +{fmtBRL(rec.impact, { compact: true })}
            </span>
          )}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-3.5 pb-3.5 space-y-3 border-t bg-muted/10">
          <p className="text-xs text-muted-foreground leading-relaxed pt-3">{rec.detail}</p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground">Ação:</span>
            <Badge variant="secondary" className="text-[11px]">{ACTION_LABEL[rec.action]}</Badge>
          </div>

          {/* Vereditos de cada métrica */}
          {rec.vereditos.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-medium text-muted-foreground">Como está cada parte:</div>
              {rec.vereditos.map((v, i) => (
                <VereditoRow key={i} v={v} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VereditoRow({ v }: { v: Veredito }) {
  // Barra de progresso: 0% ruim, 100% excelente
  const pct = v.statusNum === 3 ? 100 : v.statusNum === 2 ? 75 : v.statusNum === 1 ? 40 : 15;
  return (
    <div className="rounded-lg bg-background border p-2.5">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("h-2 w-2 rounded-full shrink-0", statusBg(v.status))} />
          <span className="text-xs font-medium truncate">{v.metrica}</span>
        </div>
        <span className={cn("text-xs font-semibold tabular-nums shrink-0", statusColor(v.status))}>
          {v.valor}
        </span>
      </div>
      <Progress value={pct} className={cn("h-1.5 mb-1.5", v.status === "ruim" && "[&>div]:bg-red-500", v.status === "atencao" && "[&>div]:bg-amber-500", (v.status === "bom" || v.status === "excelente") && "[&>div]:bg-emerald-500")} />
      <p className="text-[11px] text-muted-foreground leading-relaxed">{v.oQueSignifica}</p>
      <p className="text-[11px] text-foreground/80 leading-relaxed mt-1">
        <span className="font-medium">→ </span>{v.oQueFazer}
      </p>
    </div>
  );
}
