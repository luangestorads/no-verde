// Motor de otimização baseado em regras
// Analisa cada campanha e gera recomendações acionáveis priorizadas por impacto na Grana No Bolso.
import type { CampaignRow } from "./campaign-types";
import { computeGranaNoBolso, computeRoas } from "./metrics";

export type Severity = "critico" | "alerta" | "oportunidade" | "bom";
export type Action = "pausar" | "reduzir_orcamento" | "aumentar_orcamento" | "revisar_criativo" | "revisar_publico" | "otimizar_leilao" | "manter" | "investigar";

export type Recommendation = {
  campaignId?: string;
  campaignName: string;
  severity: Severity;
  action: Action;
  title: string;
  detail: string;
  metric: string;
  value: string;
  impact: number; // estimativa de impacto financeiro na Grana No Bolso (R$)
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  critico: "Crítico",
  alerta: "Alerta",
  oportunidade: "Oportunidade",
  bom: "Saudável",
};

export const ACTION_LABEL: Record<Action, string> = {
  pausar: "Pausar",
  reduzir_orcamento: "Reduzir orçamento",
  aumentar_orcamento: "Escalar",
  revisar_criativo: "Revisar criativo",
  revisar_publico: "Revisar público",
  otimizar_leilao: "Otimizar leilão",
  manter: "Manter",
  investigar: "Investigar",
};

// Limiares configuráveis (poderiam vir de um model no futuro)
const TH = {
  roasBreakEven: 1.0, // ROAS abaixo de 1x = perdendo dinheiro
  roasGood: 2.0, // ROAS bom para escalar
  roasGreat: 3.5, // ROAS excelente
  ctrLow: 1.0, // CTR abaixo de 1% = criativo fraco (%)
  ctrGood: 2.0, // CTR bom (%)
  cpaHighRatio: 0.3, // CPA alto se > 30% do ticket médio (aproximado)
  budgetUtilizationHigh: 0.8, // usando > 80% do orçamento
  budgetUtilizationLow: 0.3, // usando < 30% do orçamento
  minSpendForAnalysis: 50, // R$ mínimo para análise significativa
};

export function analyzeCampaign(row: CampaignRow): Recommendation[] {
  const recs: Recommendation[] = [];
  const spent = row.spent || 0;
  const budget = row.budget || 0;
  const revenue = row.purchaseConversionValue || 0;
  const roas = row.roasPurchases || computeRoas(row);
  const grana = row.granaNoBolso || computeGranaNoBolso(row);
  const ctr = row.ctr || 0;
  const purchases = row.purchases || 0;
  const cpa = row.costPerPurchase || (purchases > 0 ? spent / purchases : 0);
  const checkoutInit = row.checkoutInitiated || 0;
  const views = row.landingPageViews || 0;
  const utilization = budget > 0 ? spent / budget : 0;
  const isInactive = !row.delivery?.toLowerCase().includes("ativ");

  const name = row.name || "Sem nome";

  // Campanha pausada/inativa não gera recomendações acionáveis além de "investigar"
  if (isInactive) {
    if (spent > 0 && grana < 0) {
      recs.push({
        campaignName: name, severity: "bom", action: "manter",
        title: "Campanha pausada após prejuízo",
        detail: "Boa decisão mantê-la pausada. O prejuízo foi contido. Avalie relançar apenas após revisar criativo e público.",
        metric: "Grana No Bolso", value: formatBRL(grana), impact: 0,
      });
    } else if (spent === 0) {
      recs.push({
        campaignName: name, severity: "alerta", action: "investigar",
        title: "Campanha inativa sem investimento",
        detail: "Sem dados para analisar. Ative com um orçamento de teste (ex.: R$ 30-50/dia) por 3-5 dias antes de decidir.",
        metric: "Valor usado", value: formatBRL(spent), impact: 0,
      });
    }
    return recs;
  }

  // Sem investimento suficiente
  if (spent < TH.minSpendForAnalysis) {
    recs.push({
      campaignName: name, severity: "oportunidade", action: "aumentar_orcamento",
      title: "Investimento muito baixo para avaliação",
      detail: `Apenas ${formatBRL(spent)} usados. Aumente o orçamento para gerar volume estatístico suficiente antes de otimizar.`,
      metric: "Valor usado", value: formatBRL(spent), impact: 0,
    });
    return recs;
  }

  // 1. ROAS abaixo do break-even — CRÍTICO
  if (roas < TH.roasBreakEven) {
    const loss = Math.abs(grana);
    recs.push({
      campaignName: name, severity: "critico", action: roas < 0.5 ? "pausar" : "reduzir_orcamento",
      title: roas < 0.5 ? "Pausar imediatamente — prejuízo alto" : "Reduzir orçamento — abaixo do break-even",
      detail: `ROAS de ${roas.toFixed(2)}x significa que cada R$1 investido retorna R$${roas.toFixed(2)}. Você está perdendo ${formatBRL(grana)}. ${roas < 0.5 ? "Pause e revise a estrutura (criativo, público, oferta)." : "Reduza o orçamento em 50% e investigue o funil."}`,
      metric: "ROAS", value: `${roas.toFixed(2)}x`, impact: loss,
    });
  } else if (roas >= TH.roasGreat) {
    // 2. ROAS excelente — escalar
    const upside = estimateScaleUpside(row);
    recs.push({
      campaignName: name, severity: "oportunidade", action: "aumentar_orcamento",
      title: "Escalar campanha — ROAS excelente",
      detail: `ROAS de ${roas.toFixed(2)}x é excelente. Considere aumentar o orçamento em 20-30% e monitorar por 48-72h. Mantenha o CPA atual como referência.`,
      metric: "ROAS", value: `${roas.toFixed(2)}x`, impact: upside,
    });
  } else if (roas >= TH.roasGood) {
    recs.push({
      campaignName: name, severity: "bom", action: "aumentar_orcamento",
      title: "Otimização incremental possível",
      detail: `ROAS de ${roas.toFixed(2)}x está saudável. Teste aumentar o orçamento em 15% e observe a estabilidade do CPA.`,
      metric: "ROAS", value: `${roas.toFixed(2)}x`, impact: estimateScaleUpside(row) * 0.5,
    });
  }

  // 3. CTR baixo — criativo fraco
  if (ctr > 0 && ctr < TH.ctrLow) {
    recs.push({
      campaignName: name, severity: ctr < 0.5 ? "critico" : "alerta", action: "revisar_criativo",
      title: "CTR baixo — criativo não atrai cliques",
      detail: `CTR de ${ctr.toFixed(2)}% está abaixo do ideal (>${TH.ctrLow}%). Teste novos ângulos de criativo, hooks nos primeiros 3s e chamadas mais diretas. CTR baixo encarece todo o funil.`,
      metric: "CTR (todos)", value: `${ctr.toFixed(2)}%`, impact: estimateCtrImpact(row),
    });
  }

  // 4. CPA alto vs receita
  if (cpa > 0 && revenue > 0 && purchases > 0) {
    const ticket = revenue / purchases;
    if (cpa > ticket * TH.cpaHighRatio) {
      recs.push({
        campaignName: name, severity: "alerta", action: "revisar_publico",
        title: "CPA alto em relação ao ticket médio",
        detail: `CPA de ${formatBRL(cpa)} representa ${((cpa / ticket) * 100).toFixed(0)}% do ticket médio (${formatBRL(ticket)}). Revise o público (afine interestos, exclua quem já comprou) e a oferta da página de destino.`,
        metric: "Custo por compra", value: formatBRL(cpa), impact: (cpa - ticket * TH.cpaHighRatio) * purchases,
      });
    }
  }

  // 5. Funil: muitas visualizações mas poucas finalizações
  if (views > 0 && checkoutInit > 0) {
    const initRate = (checkoutInit / views) * 100;
    if (initRate < 5 && views > 50) {
      recs.push({
        campaignName: name, severity: "alerta", action: "otimizar_leilao",
        title: "Gargalo entre visualização e checkout",
        detail: `Apenas ${initRate.toFixed(1)}% das visualizações iniciam checkout. Problema na página de destino: velocidade, preço, prova social ou clareza da oferta.`,
        metric: "Views→Checkout", value: `${initRate.toFixed(1)}%`, impact: 0,
      });
    }
  }

  // 6. Checkout iniciado mas poucas compras (gargalo de conversão)
  if (checkoutInit > 0 && purchases > 0) {
    const closeRate = (purchases / checkoutInit) * 100;
    if (closeRate < 30) {
      recs.push({
        campaignName: name, severity: "alerta", action: "investigar",
        title: "Gargalo no fechamento da compra",
        detail: `Apenas ${closeRate.toFixed(0)}% dos checkouts iniciados viram compra. Revise: frete, formas de pagamento, campos do formulário e mensagens de confiança no checkout.`,
        metric: "Checkout→Compra", value: `${closeRate.toFixed(0)}%`, impact: 0,
      });
    }
  }

  // 7. Utilização do orçamento
  if (budget > 0) {
    if (utilization > TH.budgetUtilizationHigh && roas >= TH.roasGood) {
      recs.push({
        campaignName: name, severity: "oportunidade", action: "aumentar_orcamento",
        title: "Orçamento quase esgotado com bom retorno",
        detail: `Usou ${(utilization * 100).toFixed(0)}% do orçamento com ROAS de ${roas.toFixed(2)}x. Há demanda reprimida — aumente o orçamento diário para capturar mais conversões lucrativas.`,
        metric: "Utilização orçamento", value: `${(utilization * 100).toFixed(0)}%`, impact: estimateScaleUpside(row),
      });
    } else if (utilization < TH.budgetUtilizationLow) {
      recs.push({
        campaignName: name, severity: "alerta", action: "revisar_publico",
        title: "Baixa utilização do orçamento",
        detail: `Usou apenas ${(utilization * 100).toFixed(0)}% do orçamento. Pode ser leilão restrito, público pequeno ou criativo com baixo índice de relevância. Amplie o público ou ajuste a estratégia de leilão.`,
        metric: "Utilização orçamento", value: `${(utilization * 100).toFixed(0)}%`, impact: 0,
      });
    }
  }

  // 8. Saudável sem recomendações
  if (recs.length === 0) {
    recs.push({
      campaignName: name, severity: "bom", action: "manter",
      title: "Campanha saudável",
      detail: `ROAS ${roas.toFixed(2)}x, CTR ${ctr.toFixed(2)}%, Grana No Bolso ${formatBRL(grana)}. Mantenha o monitoramento e teste variações de criativo continuamente.`,
      metric: "Grana No Bolso", value: formatBRL(grana), impact: 0,
    });
  }

  return recs;
}

function estimateScaleUpside(row: CampaignRow): number {
  // Estimativa conservadora: 20% de aumento de receita mantendo eficiência
  return (row.purchaseConversionValue || 0) * 0.2 * (row.roasPurchases > 0 ? 1 : 0.5);
}

function estimateCtrImpact(row: CampaignRow): number {
  // Se dobrar o CTR, CPA cai proporcionalmente → economia estimada
  const cpa = row.costPerPurchase || 0;
  const purchases = row.purchases || 0;
  return cpa * purchases * 0.3; // 30% de economia potencial
}

export function analyzeAll(rows: CampaignRow[]): Recommendation[] {
  const all = rows.flatMap((r) => analyzeCampaign(r).map((rec) => ({ ...rec, campaignId: r.id })));
  // Ordenar: criticos primeiro, depois por impacto financeiro desc
  const sevRank: Record<Severity, number> = { critico: 0, alerta: 1, oportunidade: 2, bom: 3 };
  return all.sort((a, b) => {
    if (sevRank[a.severity] !== sevRank[b.severity]) return sevRank[a.severity] - sevRank[b.severity];
    return Math.abs(b.impact) - Math.abs(a.impact);
  });
}

export function severityColor(sev: Severity): string {
  switch (sev) {
    case "critico": return "text-red-600 dark:text-red-400";
    case "alerta": return "text-amber-600 dark:text-amber-400";
    case "oportunidade": return "text-emerald-600 dark:text-emerald-400";
    case "bom": return "text-muted-foreground";
  }
}

// Helper de formatação local (evita dependência circular com metrics na borda)
function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(Number(v) || 0);
}
