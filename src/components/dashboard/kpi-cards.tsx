"use client";

import { Card } from "@/components/ui/card";
import { fmtBRL, fmtNumber, fmtPercent, fmtRoas, type Summary } from "@/lib/metrics";
import { Wallet, TrendingUp, TrendingDown, Target, ShoppingCart, Gauge, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  tone?: "default" | "positive" | "negative" | "accent";
};

function KpiCard({ label, value, sub, icon, tone = "default" }: KpiCardProps) {
  return (
    <Card className="p-4 sm:p-5 gap-2 overflow-hidden relative">
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</span>
        <span className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg",
          tone === "positive" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
          tone === "negative" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
          tone === "accent" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
          tone === "default" && "bg-muted text-muted-foreground",
        )}>
          {icon}
        </span>
      </div>
      <div className={cn(
        "text-xl sm:text-2xl font-bold tracking-tight tabular-nums",
        tone === "positive" && "text-emerald-600 dark:text-emerald-400",
        tone === "negative" && "text-red-600 dark:text-red-400",
        tone === "accent" && "text-amber-600 dark:text-amber-400",
      )}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

export function KpiCards({ summary }: { summary: Summary | null }) {
  if (!summary) return null;

  const granaPositive = summary.totalGranaNoBolso >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      <KpiCard
        label="Investido"
        value={fmtBRL(summary.totalSpent, { compact: true })}
        sub={`${summary.count} campanhas`}
        icon={<Wallet className="h-4 w-4" />}
        tone="default"
      />
      <KpiCard
        label="Receita"
        value={fmtBRL(summary.totalRevenue, { compact: true })}
        sub="Conversão de compra"
        icon={<TrendingUp className="h-4 w-4" />}
        tone="default"
      />
      <KpiCard
        label="Grana No Bolso"
        value={fmtBRL(summary.totalGranaNoBolso, { compact: true })}
        sub={granaPositive ? "Lucro líquido pós-ads" : "Prejuízo líquido"}
        icon={<PiggyBank className="h-4 w-4" />}
        tone={granaPositive ? "positive" : "negative"}
      />
      <KpiCard
        label="ROAS médio"
        value={fmtRoas(summary.avgRoas)}
        sub={summary.avgRoas >= 1 ? "Acima do break-even" : "Abaixo do break-even"}
        icon={<Gauge className="h-4 w-4" />}
        tone={summary.avgRoas >= 1 ? "positive" : "negative"}
      />
      <KpiCard
        label="Compras"
        value={fmtNumber(summary.totalPurchases)}
        sub={`${fmtNumber(summary.totalCheckoutInitiated)} checkouts iniciados`}
        icon={<ShoppingCart className="h-4 w-4" />}
        tone="default"
      />
      <KpiCard
        label="CPA médio"
        value={summary.avgCostPerPurchase > 0 ? fmtBRL(summary.avgCostPerPurchase) : "—"}
        sub={`${fmtPercent(summary.avgCtr)} CTR médio`}
        icon={<Target className="h-4 w-4" />}
        tone="accent"
      />
    </div>
  );
}
