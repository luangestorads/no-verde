// Cálculo de métricas e formatação
import type { CampaignRow } from "./campaign-types";

// Grana No Bolso = Valor de conversão da compra - Valor usado
// Representa o lucro líquido após o investimento em tráfego pago.
export function computeGranaNoBolso(row: Pick<CampaignRow, "purchaseConversionValue" | "spent">): number {
  return (row.purchaseConversionValue || 0) - (row.spent || 0);
}

// ROAS = Valor de conversão / Valor usado (recomputado para evitar inconsistência)
export function computeRoas(row: Pick<CampaignRow, "purchaseConversionValue" | "spent">): number {
  if (!row.spent || row.spent === 0) return 0;
  return (row.purchaseConversionValue || 0) / row.spent;
}

// Margem percentual da Grana No Bolso sobre a receita
export function computeMargin(row: Pick<CampaignRow, "purchaseConversionValue" | "spent">): number {
  const rev = row.purchaseConversionValue || 0;
  if (rev === 0) return 0;
  return (computeGranaNoBolso(row) / rev) * 100;
}

export type Summary = {
  count: number;
  activeCount: number;
  totalSpent: number;
  totalRevenue: number;
  totalGranaNoBolso: number;
  totalPurchases: number;
  totalCheckoutInitiated: number;
  totalLandingPageViews: number;
  avgCtr: number;
  avgRoas: number;
  avgCostPerPurchase: number;
  bestCampaign?: { name: string; granaNoBolso: number };
  worstCampaign?: { name: string; granaNoBolso: number };
};

export function summarize(rows: CampaignRow[]): Summary {
  if (rows.length === 0) {
    return {
      count: 0, activeCount: 0, totalSpent: 0, totalRevenue: 0, totalGranaNoBolso: 0,
      totalPurchases: 0, totalCheckoutInitiated: 0, totalLandingPageViews: 0,
      avgCtr: 0, avgRoas: 0, avgCostPerPurchase: 0,
    };
  }
  const totalSpent = sum(rows, "spent");
  const totalRevenue = sum(rows, "purchaseConversionValue");
  const totalGrana = totalRevenue - totalSpent;
  const totalPurchases = sum(rows, "purchases");
  const totalCheckout = sum(rows, "checkoutInitiated");
  const totalViews = sum(rows, "landingPageViews");
  const avgCtr = rows.reduce((a, r) => a + (r.ctr || 0), 0) / rows.length;
  const avgRoas = totalSpent > 0 ? totalRevenue / totalSpent : 0;
  const avgCpa = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
  const activeCount = rows.filter((r) => r.delivery?.toLowerCase().includes("ativ")).length;

  const sorted = [...rows].sort((a, b) => (b.granaNoBolso || 0) - (a.granaNoBolso || 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return {
    count: rows.length,
    activeCount,
    totalSpent,
    totalRevenue,
    totalGranaNoBolso: totalGrana,
    totalPurchases,
    totalCheckoutInitiated: totalCheckout,
    totalLandingPageViews: totalViews,
    avgCtr,
    avgRoas,
    avgCostPerPurchase: avgCpa,
    bestCampaign: best ? { name: best.name, granaNoBolso: best.granaNoBolso } : undefined,
    worstCampaign: worst ? { name: worst.name, granaNoBolso: worst.granaNoBolso } : undefined,
  };
}

function sum(rows: CampaignRow[], key: keyof CampaignRow): number {
  return rows.reduce((a, r) => a + ((r[key] as number) || 0), 0);
}

// ---- Formatação ----
export function fmtBRL(value: number, opts: { compact?: boolean } = {}): string {
  const v = Number(value) || 0;
  if (opts.compact && Math.abs(v) >= 1000) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(v);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

export function fmtNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value) || 0);
}

export function fmtPercent(value: number, decimals = 2): string {
  return `${fmtNumber(value, decimals)}%`;
}

export function fmtRoas(value: number): string {
  const v = Number(value) || 0;
  return `${fmtNumber(v, 2)}x`;
}
