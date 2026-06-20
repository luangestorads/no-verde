"use client";

import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtBRL, fmtNumber, fmtPercent, fmtRoas, computeTicket, computeMaxTicket } from "@/lib/metrics";
import {
  analyzeCampaign, SEVERITY_LABEL, ACTION_LABEL, severityColor, severityBg,
  STATUS_LABEL, statusColor, statusBg,
  type Veredito,
} from "@/lib/optimizer";
import type { CampaignRow, ProductRow } from "@/lib/campaign-types";
import { toast } from "sonner";
import { Package, Link2, Tag, TrendingUp, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function CampaignDetailDrawer({
  campaign,
  onOpenChange,
  onCampaignUpdated,
}: {
  campaign: CampaignRow | null;
  onOpenChange: (v: boolean) => void;
  onCampaignUpdated?: () => void;
}) {
  const open = campaign !== null;
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [linking, setLinking] = useState(false);

  const recs = campaign ? analyzeCampaign(campaign) : [];
  const ticket = campaign ? computeTicket(campaign) : 0;
  const maxTicket = campaign ? computeMaxTicket(campaign) : 0;
  const allVereditos = recs[0]?.vereditos || [];
  const linkedProduct = campaign?.product || null;

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    if (open) loadProducts();
  }, [open, loadProducts]);

  async function linkProduct(productId: string | null) {
    if (!campaign?.id) return;
    setLinking(true);
    const t = toast.loading("Vinculando produto…");
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: productId === "none" ? null : productId }),
      });
      if (!res.ok) throw new Error("Erro");
      toast.success(linkedProduct ? "Produto trocado" : (productId ? "Produto vinculado" : "Produto desvinculado"), { id: t });
      onCampaignUpdated?.();
    } catch {
      toast.error("Falha ao vincular produto", { id: t });
    } finally {
      setLinking(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        {campaign && (
          <div className="flex flex-col h-full">
            <SheetHeader className="px-5 pt-5 pb-3 border-b">
              <SheetTitle className="text-lg leading-tight">{campaign.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 flex-wrap">
                <DeliveryBadge delivery={campaign.delivery} />
                <span className="text-xs">{campaign.actions || "Conversões"}</span>
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Destaque Grana No Bolso */}
              <div className={cn(
                "rounded-2xl p-4 border",
                (campaign.granaNoBolso || 0) >= 0
                  ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-900"
                  : "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 border-red-200 dark:border-red-900",
              )}>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <PiggyBankIcon />
                  Grana No Bolso
                </div>
                <div className={cn(
                  "text-3xl sm:text-4xl font-bold tabular-nums mt-1",
                  (campaign.granaNoBolso || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                )}>
                  {fmtBRL(campaign.granaNoBolso)}
                </div>
                <div className="text-xs text-muted-foreground mt-1.5">
                  Receita {fmtBRL(campaign.purchaseConversionValue)} − Investido {fmtBRL(campaign.spent)}
                </div>
              </div>

              {/* Vínculo de produto */}
              <div className="rounded-xl border p-3.5 bg-muted/20">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                  <Link2 className="h-3.5 w-3.5" />
                  Produto vinculado
                </div>
                {products.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Cadastre um produto na aba <span className="font-medium">Produtos</span> para vincular aqui e deixar a análise mais precisa.
                  </p>
                ) : (
                  <Select
                    value={linkedProduct?.id || "none"}
                    onValueChange={(v) => linkProduct(v)}
                    disabled={linking}
                  >
                    <SelectTrigger className="h-9 text-sm" aria-label="Vincular produto">
                      <SelectValue placeholder="Nenhum produto vinculado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Nenhum —</SelectItem>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} · {fmtBRL(p.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {linkedProduct && (
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Ticket usado na análise:</span>
                      <span className="font-semibold tabular-nums">{fmtBRL(linkedProduct.price)}</span>
                      {maxTicket > linkedProduct.price && (
                        <Badge variant="secondary" className="text-[10px] ml-auto">
                          máx {fmtBRL(maxTicket)}
                        </Badge>
                      )}
                    </div>
                    {(linkedProduct.orderBumpPrice > 0 || linkedProduct.upsellPrice > 0) && (
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground pt-1">
                        {linkedProduct.orderBumpPrice > 0 && (
                          <span className="flex items-center gap-1">
                            <ArrowUpCircle className="h-3 w-3 text-emerald-500" />
                            Bump {fmtBRL(linkedProduct.orderBumpPrice)}
                          </span>
                        )}
                        {linkedProduct.upsellPrice > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                            Upsell {fmtBRL(linkedProduct.upsellPrice)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Vereditos de cada métrica */}
              {allVereditos.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
                    Como está cada parte
                  </h3>
                  <div className="space-y-2">
                    {allVereditos.map((v, i) => (
                      <VereditoCard key={i} v={v} />
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Detalhes financeiros */}
              <Section title="Dinheiro">
                <Metric label="Orçamento" value={fmtBRL(campaign.budget)} />
                <Metric label="Utilizado" value={campaign.budget > 0 ? fmtPercent((campaign.spent / campaign.budget) * 100) : "—"} />
                <Metric label="Investido" value={fmtBRL(campaign.spent)} />
                <Metric label="Receita" value={fmtBRL(campaign.purchaseConversionValue)} />
                <Metric label="Ticket médio" value={ticket > 0 ? fmtBRL(ticket) : "—"} sub={linkedProduct ? "do produto" : "calculado pelas vendas"} />
              </Section>

              <Section title="Caminho até comprar">
                <Metric label="Viram a página" value={fmtNumber(campaign.landingPageViews)} />
                <Metric label="Custo por view" value={campaign.costPerLandingPageView > 0 ? fmtBRL(campaign.costPerLandingPageView) : "—"} sub={ticket > 0 && campaign.costPerLandingPageView > 0 ? `${((campaign.costPerLandingPageView / ticket) * 100).toFixed(0)}% do produto` : undefined} />
                <Metric label="Chegaram no carrinho" value={fmtNumber(campaign.checkoutInitiated)} />
                <Metric label="Custo por carrinho" value={campaign.costPerCheckoutInitiated > 0 ? fmtBRL(campaign.costPerCheckoutInitiated) : "—"} sub={ticket > 0 && campaign.costPerCheckoutInitiated > 0 ? `${((campaign.costPerCheckoutInitiated / ticket) * 100).toFixed(0)}% do produto` : undefined} />
                <Metric label="Compraram" value={fmtNumber(campaign.purchases)} />
                <Metric label="Custo por venda" value={campaign.costPerPurchase > 0 ? fmtBRL(campaign.costPerPurchase) : "—"} sub={ticket > 0 && campaign.costPerPurchase > 0 ? `${((campaign.costPerPurchase / ticket) * 100).toFixed(0)}% do produto` : undefined} />
              </Section>

              <Section title="Qualidade do anúncio">
                <Metric label="Cliques (CTR)" value={fmtPercent(campaign.ctr)} sub="de cada 100, quantos clicaram" />
                <Metric label="Retorno (ROAS)" value={fmtRoas(campaign.roasPurchases)} sub="cada R$ 1 virou…" />
              </Section>

              {(campaign.purchasesSite > 0 || campaign.purchasesApp > 0 || campaign.purchasesOffline > 0 || campaign.purchasesMeta > 0) && (
                <Section title="Vendas por canal">
                  <Metric label="Site" value={fmtNumber(campaign.purchasesSite)} sub={fmtBRL(campaign.purchaseConversionValueSite)} />
                  <Metric label="App" value={fmtNumber(campaign.purchasesApp)} sub={fmtBRL(campaign.purchaseConversionValueApp)} />
                  <Metric label="Offline" value={fmtNumber(campaign.purchasesOffline)} sub={fmtBRL(campaign.purchaseConversionValueOffline)} />
                  <Metric label="Meta" value={fmtNumber(campaign.purchasesMeta)} sub={fmtBRL(campaign.purchaseConversionValueMeta)} />
                </Section>
              )}

              <Separator />

              {/* Recomendações */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
                  O que fazer
                </h3>
                <div className="space-y-2">
                  {recs.map((r, i) => (
                    <div key={i} className={cn(
                      "rounded-xl border border-l-4 p-3 bg-card",
                      r.severity === "critico" && "border-l-red-500",
                      r.severity === "alerta" && "border-l-amber-500",
                      r.severity === "oportunidade" && "border-l-emerald-500",
                      r.severity === "bom" && "border-l-emerald-400",
                    )}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-medium text-sm">{r.title}</span>
                        <Badge variant="outline" className={cn("text-[10px]", severityColor(r.severity))}>
                          {SEVERITY_LABEL[r.severity]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{r.detail}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px]">{ACTION_LABEL[r.action]}</Badge>
                        {r.impact > 0 && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            +{fmtBRL(r.impact, { compact: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function PiggyBankIcon() {
  return <Package className="h-3.5 w-3.5" />;
}

function VereditoCard({ v }: { v: Veredito }) {
  const pct = v.statusNum === 3 ? 100 : v.statusNum === 2 ? 75 : v.statusNum === 1 ? 40 : 15;
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", statusBg(v.status))} />
          <span className="text-sm font-medium truncate">{v.metrica}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("text-sm font-semibold tabular-nums", statusColor(v.status))}>{v.valor}</span>
        </div>
      </div>
      <Progress value={pct} className={cn("h-1.5 mb-2", v.status === "ruim" && "[&>div]:bg-red-500", v.status === "atencao" && "[&>div]:bg-amber-500", (v.status === "bom" || v.status === "excelente") && "[&>div]:bg-emerald-500")} />
      <p className="text-xs text-muted-foreground leading-relaxed">{v.oQueSignifica}</p>
      <p className="text-xs text-foreground/80 leading-relaxed mt-1">
        <span className="font-medium">O que fazer: </span>{v.oQueFazer}
      </p>
    </div>
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

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
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
