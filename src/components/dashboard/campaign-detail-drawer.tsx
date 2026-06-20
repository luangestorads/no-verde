"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fmtBRL, fmtNumber, fmtPercent, fmtRoas } from "@/lib/metrics";
import { analyzeCampaign, SEVERITY_LABEL, ACTION_LABEL, severityColor } from "@/lib/optimizer";
import type { CampaignRow } from "@/lib/campaign-types";
import { cn } from "@/lib/utils";

export function CampaignDetailDrawer({
  campaign,
  onOpenChange,
}: {
  campaign: CampaignRow | null;
  onOpenChange: (v: boolean) => void;
}) {
  const open = campaign !== null;
  const recs = campaign ? analyzeCampaign(campaign) : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        {campaign && (
          <>
            <SheetHeader>
              <SheetTitle className="text-lg leading-tight">{campaign.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 flex-wrap">
                <DeliveryBadge delivery={campaign.delivery} />
                <span className="text-xs">{campaign.actions || "Conversões"}</span>
              </SheetDescription>
            </SheetHeader>

            <div className="px-4 pb-6 space-y-5">
              {/* Destaque Grana No Bolso */}
              <div className={cn(
                "rounded-xl p-4 border",
                (campaign.granaNoBolso || 0) >= 0
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"
                  : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900",
              )}>
                <div className="text-xs text-muted-foreground">Grana No Bolso</div>
                <div className={cn(
                  "text-3xl font-bold tabular-nums",
                  (campaign.granaNoBolso || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                )}>
                  {fmtBRL(campaign.granaNoBolso)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Receita {fmtBRL(campaign.purchaseConversionValue)} − Investido {fmtBRL(campaign.spent)}
                </div>
              </div>

              {/* Métricas principais */}
              <Section title="Desempenho financeiro">
                <Metric label="ROAS (compras)" value={fmtRoas(campaign.roasPurchases)} tone={(campaign.roasPurchases || 0) >= 1 ? "positive" : "negative"} />
                <Metric label="Custo por compra" value={campaign.costPerPurchase > 0 ? fmtBRL(campaign.costPerPurchase) : "—"} />
                <Metric label="Orçamento" value={fmtBRL(campaign.budget)} />
                <Metric label="Utilização" value={campaign.budget > 0 ? fmtPercent((campaign.spent / campaign.budget) * 100) : "—"} />
              </Section>

              <Section title="Engajamento">
                <Metric label="CTR (todos)" value={fmtPercent(campaign.ctr)} />
                <Metric label="Views (página destino)" value={fmtNumber(campaign.landingPageViews)} />
                <Metric label="Checkouts iniciados" value={fmtNumber(campaign.checkoutInitiated)} />
                <Metric label="Compras" value={fmtNumber(campaign.purchases)} />
              </Section>

              <Section title="Funil de conversão">
                <Metric label="Views → Checkout" value={rate(campaign.landingPageViews, campaign.checkoutInitiated)} />
                <Metric label="Checkout → Compra" value={rate(campaign.checkoutInitiated, campaign.purchases)} />
                <Metric label="Views → Compra" value={rate(campaign.landingPageViews, campaign.purchases)} />
                <Metric label="Ticket médio" value={campaign.purchases > 0 ? fmtBRL(campaign.purchaseConversionValue / campaign.purchases) : "—"} />
              </Section>

              {(campaign.purchasesSite > 0 || campaign.purchasesApp > 0 || campaign.purchasesOffline > 0 || campaign.purchasesMeta > 0) && (
                <Section title="Compras por canal">
                  <Metric label="Site" value={fmtNumber(campaign.purchasesSite)} sub={fmtBRL(campaign.purchaseConversionValueSite)} />
                  <Metric label="App" value={fmtNumber(campaign.purchasesApp)} sub={fmtBRL(campaign.purchaseConversionValueApp)} />
                  <Metric label="Offline" value={fmtNumber(campaign.purchasesOffline)} sub={fmtBRL(campaign.purchaseConversionValueOffline)} />
                  <Metric label="Meta" value={fmtNumber(campaign.purchasesMeta)} sub={fmtBRL(campaign.purchaseConversionValueMeta)} />
                </Section>
              )}

              <Separator />

              {/* Recomendações desta campanha */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Recomendações</h3>
                <div className="space-y-2">
                  {recs.map((r, i) => (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium">{r.title}</span>
                        <Badge variant="outline" className={cn("text-[10px]", severityColor(r.severity))}>
                          {SEVERITY_LABEL[r.severity]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{r.detail}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px]">{ACTION_LABEL[r.action]}</Badge>
                        <span className="text-[10px] text-muted-foreground">{r.metric}: {r.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{title}</h3>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "positive" | "negative" }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={cn(
        "text-sm font-semibold tabular-nums",
        tone === "positive" && "text-emerald-600 dark:text-emerald-400",
        tone === "negative" && "text-red-600 dark:text-red-400",
      )}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground tabular-nums">{sub}</div>}
    </div>
  );
}

function DeliveryBadge({ delivery }: { delivery: string }) {
  const d = (delivery || "").toLowerCase();
  let variant: "default" | "secondary" | "destructive" = "secondary";
  let label = delivery || "—";
  if (d.includes("ativ")) { variant = "default"; label = "Ativa"; }
  else if (d.includes("paus")) { variant = "secondary"; label = "Pausada"; }
  else if (d.includes("rejeit") || d.includes("negad")) { variant = "destructive"; label = "Rejeitada"; }
  return <Badge variant={variant} className="text-[10px]">{label}</Badge>;
}

function rate(from: number, to: number): string {
  if (!from || from === 0) return "—";
  return `${((to / from) * 100).toFixed(1)}%`;
}
