"use client";

import { Card } from "@/components/ui/card";
import { fmtBRL, fmtNumber, fmtRoas, type Summary } from "@/lib/metrics";
import { Wallet, TrendingUp, PiggyBank, Gauge, ShoppingCart, Target, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "positive" | "negative" | "accent" | "neutral";

type KpiCardProps = {
  label: string;
  hint: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  tone: Tone;
};

function KpiCard({ label, hint, value, sub, icon, tone }: KpiCardProps) {
  return (
    <Card className="p-4 sm:p-5 gap-2 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        tone === "positive" && "bg-emerald-500",
        tone === "negative" && "bg-red-500",
        tone === "accent" && "bg-amber-500",
        tone === "neutral" && "bg-muted-foreground/40",
      )} />
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground block">{label}</span>
          <span className="text-[10px] sm:text-[11px] text-muted-foreground/70 block leading-tight">{hint}</span>
        </div>
        <span className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl shrink-0",
          tone === "positive" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
          tone === "negative" && "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
          tone === "accent" && "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
          tone === "neutral" && "bg-muted text-muted-foreground",
        )}>
          {icon}
        </span>
      </div>
      <div className={cn(
        "text-2xl sm:text-3xl font-bold tracking-tight tabular-nums",
        tone === "positive" && "text-emerald-600 dark:text-emerald-400",
        tone === "negative" && "text-red-600 dark:text-red-400",
        tone === "accent" && "text-amber-600 dark:text-amber-400",
      )}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </Card>
  );
}

export function KpiCards({ summary }: { summary: Summary | null }) {
  if (!summary) return null;

  const granaPositive = summary.totalGranaNoBolso >= 0;
  const roasOk = summary.avgRoas >= 1.5;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      <KpiCard
        label="Investido"
        hint="O que você gastou nos anúncios"
        value={fmtBRL(summary.totalSpent, { compact: true })}
        sub={`${summary.count} campanhas · ${summary.activeCount} ativas`}
        icon={<Wallet className="h-4 w-4" />}
        tone="neutral"
      />
      <KpiCard
        label="Receita"
        hint="O que as vendas trouxeram"
        value={fmtBRL(summary.totalRevenue, { compact: true })}
        sub={`${fmtNumber(summary.totalPurchases)} vendas`}
        icon={<TrendingUp className="h-4 w-4" />}
        tone="neutral"
      />
      <KpiCard
        label="Grana No Bolso"
        hint="Receita menos o investido"
        value={fmtBRL(summary.totalGranaNoBolso, { compact: true })}
        sub={granaPositive ? "Lucro limpo no seu bolso" : "Você está no prejuízo"}
        icon={<PiggyBank className="h-4 w-4" />}
        tone={granaPositive ? "positive" : "negative"}
      />
      <KpiCard
        label="Retorno (ROAS)"
        hint="Cada R$ 1 virou…"
        value={fmtRoas(summary.avgRoas)}
        sub={roasOk ? "Saudável (acima de 1,5x)" : summary.avgRoas >= 1 ? "Quase no zero a zero" : "Perdendo dinheiro"}
        icon={<Gauge className="h-4 w-4" />}
        tone={summary.avgRoas >= 2 ? "positive" : summary.avgRoas >= 1.5 ? "accent" : summary.avgRoas >= 1 ? "accent" : "negative"}
      />
      <KpiCard
        label="Custo por venda"
        hint="Quanto custa 1 venda"
        value={summary.avgCostPerPurchase > 0 ? fmtBRL(summary.avgCostPerPurchase) : "—"}
        sub={summary.avgTicket > 0 ? `Ticket médio ${fmtBRL(summary.avgTicket)}` : "Sem vendas ainda"}
        icon={<Target className="h-4 w-4" />}
        tone="accent"
      />
      <KpiCard
        label="Ticket médio"
        hint="Preço médio de cada venda"
        value={summary.avgTicket > 0 ? fmtBRL(summary.avgTicket) : "—"}
        sub={`CTR médio ${summary.avgCtr.toFixed(2)}%`}
        icon={<Ticket className="h-4 w-4" />}
        tone="neutral"
      />
    </div>
  );
}
