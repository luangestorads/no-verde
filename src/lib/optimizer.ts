// Motor de otimização baseado nos critérios de um grande player de Meta Ads.
// Cada métrica recebe um "veredito" (excelente / bom / atencao / ruim) com explicação
// em linguagem simples (nível criança) e ação concreta.
import type { CampaignRow } from "./campaign-types";
import { computeGranaNoBolso, computeRoas, computeTicket } from "./metrics";

// ---- Status visual ----
export type Status = "excelente" | "bom" | "atencao" | "ruim";
export type Severity = "critico" | "alerta" | "oportunidade" | "bom";
export type Action = "pausar" | "reduzir_orcamento" | "aumentar_orcamento" | "trocar_criativo" | "trocar_oferta" | "manter" | "investigar";

// ---- Critérios do grande player (valores exatos) ----
export const CRITERIOS = {
  ctr: {
    excelente: 2.0, // %  — "acima de 2% é essencial"
    bom: 1.0,        // %  — entre 1 e 2 é médio
  },
  custoView: {
    otimo: 1.20,    // R$ — "abaixo de 1,20 ou 1,30 é muito bom"
    bom: 1.50,      // R$ — "até 1,50 é bom"
    maximo: 2.50,   // R$ — "máximo de 1,5 a 2,5"
    pctTicket: 10,  // % do ticket — "pagar no máximo 10% do preço do produto"
  },
  custoCheckout: {
    pctTicket: 10, // % do ticket — "sempre abaixo de 10% do ticket"
  },
  custoCompra: {
    pctTicket: 60, // % do ticket — "abaixo de 60% do ticket"
  },
  roas: {
    magnifico: 2.0, // "acima de 2.0 é magnífico"
    ideal: 1.5,     // "ideal acima de 1.5"
    breakEven: 1.0, // abaixo de 1 = perdendo dinheiro
  },
  gastoMinimo: 50, // R$ mínimo para análise
};

// ---- Labels em linguagem simples ----
export const STATUS_LABEL: Record<Status, string> = {
  excelente: "Excelente",
  bom: "Bom",
  atencao: "Atenção",
  ruim: "Ruim",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  critico: "Urgente",
  alerta: "Cuidado",
  oportunidade: "Oportunidade",
  bom: "Tudo certo",
};

export const ACTION_LABEL: Record<Action, string> = {
  pausar: "Pausar a campanha",
  reduzir_orcamento: "Diminuir o dinheiro",
  aumentar_orcamento: "Colocar mais dinheiro",
  trocar_criativo: "Trocar o anúncio (foto/vídeo)",
  trocar_oferta: "Melhorar a oferta/preço",
  manter: "Deixar como está",
  investigar: "Olhar com atenção",
};

// ---- Veredito de cada métrica individual ----
export type Veredito = {
  metrica: string;            // nome amigável
  valor: string;              // valor formatado
  status: Status;
  // Explicação curta (nível criança)
  oQueSignifica: string;
  // O que fazer
  oQueFazer: string;
  statusNum: number; // 0=ruim, 1=atencao, 2=bom, 3=excelente (p ordenar)
};

// ---- Recomendação consolidada da campanha ----
export type Recommendation = {
  campaignId?: string;
  campaignName: string;
  severity: Severity;
  action: Action;
  title: string;
  detail: string;
  vereditos: Veredito[];      // veredito de cada métrica
  impact: number;             // estimativa de impacto financeiro na Grana No Bolso (R$)
};

// ============================================================
//  ANÁLISE DE CADA MÉTRICA — regras precisas do grande player
// ============================================================

export function analizarCTR(ctr: number): Veredito {
  // CTR = de cada 100 pessoas que viram o anúncio, quantas clicaram
  const v = ctr || 0;
  if (v >= CRITERIOS.ctr.excelente) {
    return {
      metrica: "Cliques no anúncio (CTR)",
      valor: `${v.toFixed(2)}%`,
      status: "excelente",
      oQueSignifica: `De cada 100 pessoas que viram seu anúncio, ${v.toFixed(1)} clicaram. Isso é ótimo (acima de 2%). As pessoas estão gostando do anúncio.`,
      oQueFazer: "Continue mostrando esse anúncio. Ele está funcionando bem.",
      statusNum: 3,
    };
  }
  if (v >= CRITERIOS.ctr.bom) {
    return {
      metrica: "Cliques no anúncio (CTR)",
      valor: `${v.toFixed(2)}%`,
      status: "atencao",
      oQueSignifica: `De cada 100 pessoas que viram seu anúncio, só ${v.toFixed(1)} clicaram. Está entre 1% e 2%. Dá pra melhorar.`,
      oQueFazer: "Teste um anúncio novo. Comece com uma frase que chame mais atenção nos primeiros 3 segundos.",
      statusNum: 1,
    };
  }
  return {
    metrica: "Cliques no anúncio (CTR)",
    valor: `${v.toFixed(2)}%`,
    status: "ruim",
    oQueSignifica: `De cada 100 pessoas que viram seu anúncio, só ${v.toFixed(1)} clicaram. Isso é pouco (abaixo de 1%). O anúncio não está chamando atenção.`,
    oQueFazer: "Troque o anúncio. Use um vídeo ou foto mais chamativa e uma frase mais direta logo no começo.",
    statusNum: 0,
  };
}

export function analizarCustoView(custoView: number, ticket: number): Veredito {
  const v = custoView || 0;
  const pct = ticket > 0 ? (v / ticket) * 100 : 0;
  // Critério duplo: valor absoluto E % do ticket
  if (v > 0 && v <= CRITERIOS.custoView.otimo) {
    return {
      metrica: "Custo para mostrar a página",
      valor: fmtBRL(v),
      status: "excelente",
      oQueSignifica: `Você paga só ${fmtBRL(v)} para cada pessoa que vê sua página. Isso é barato (abaixo de R$ 1,20). Bom preço = mais gente vê = mais chances de vender.`,
      oQueFazer: "Aproveite e coloque mais dinheiro para alcançar mais gente.",
      statusNum: 3,
    };
  }
  if (v > 0 && v <= CRITERIOS.custoView.bom) {
    return {
      metrica: "Custo para mostrar a página",
      valor: fmtBRL(v),
      status: "bom",
      oQueSignifica: `Você paga ${fmtBRL(v)} para cada pessoa que vê sua página. É um preço bom (até R$ 1,50).`,
      oQueFazer: "Está num preço saudável. Continue.",
      statusNum: 2,
    };
  }
  if (v > 0 && v <= CRITERIOS.custoView.maximo) {
    return {
      metrica: "Custo para mostrar a página",
      valor: fmtBRL(v),
      status: "atencao",
      oQueSignifica: `Você paga ${fmtBRL(v)} para cada pessoa que vê sua página. Tá caro (entre R$ 1,50 e R$ 2,50). ${pct > 0 ? `Isso é ${pct.toFixed(0)}% do preço do seu produto.` : ""}`,
      oQueFazer: "O anúncio pode estar mandando gente errada. Teste um anúncio mais claro sobre o que você vende.",
      statusNum: 1,
    };
  }
  if (v > 0) {
    return {
      metrica: "Custo para mostrar a página",
      valor: fmtBRL(v),
      status: "ruim",
      oQueSignifica: `Você paga ${fmtBRL(v)} para cada pessoa que vê sua página. Tá MUITO caro (mais de R$ 2,50). ${pct > CRITERIOS.custoView.pctTicket ? `Isso é ${pct.toFixed(0)}% do preço do produto — mais que os 10% recomendados.` : ""} O anúncio não está levando gente barata para sua página.`,
      oQueFazer: "Troque o anúncio. Ele está mostrando para gente errada ou não chamando atenção.",
      statusNum: 0,
    };
  }
  return {
    metrica: "Custo para mostrar a página",
    valor: "—",
    status: "bom",
    oQueSignifica: "Sem dados de visualização da página ainda.",
    oQueFazer: "Aguarde mais cliques para avaliar.",
    statusNum: 2,
  };
}

export function analizarCustoCheckout(custoCheckout: number, ticket: number): Veredito {
  const v = custoCheckout || 0;
  const pct = ticket > 0 ? (v / ticket) * 100 : 0;
  if (v === 0) {
    return {
      metrica: "Custo para chegar no carrinho",
      valor: "—",
      status: "bom",
      oQueSignifica: "Sem dados de carrinho ainda.",
      oQueFazer: "Aguarde mais pessoas chegarem no carrinho.",
      statusNum: 2,
    };
  }
  // Sempre abaixo de 10% do ticket
  if (pct > 0 && pct <= CRITERIOS.custoCheckout.pctTicket) {
    return {
      metrica: "Custo para chegar no carrinho",
      valor: fmtBRL(v),
      status: "excelente",
      oQueSignifica: `Você paga ${fmtBRL(v)} para fazer alguém chegar no carrinho. Isso é só ${pct.toFixed(0)}% do preço do produto (menos de 10%). Sua página e sua oferta estão convencendo bem.`,
      oQueFazer: "Está perfeito. A página está fazendo o trabalho dela.",
      statusNum: 3,
    };
  }
  return {
    metrica: "Custo para chegar no carrinho",
    valor: fmtBRL(v),
    status: "ruim",
    oQueSignifica: `Você paga ${fmtBRL(v)} para fazer alguém chegar no carrinho. Isso é ${pct.toFixed(0)}% do preço do produto (mais que os 10% recomendados). A copy (texto da página) ou a oferta (preço/bônus) não estão convencendo.`,
    oQueFazer: "Melhore a página: deixe o preço mais claro, mostre os benefícios, adicione provas (fotos de clientes) e pense num bônus ou desconto.",
    statusNum: 0,
  };
}

export function analizarCustoCompra(cpa: number, ticket: number): Veredito {
  const v = cpa || 0;
  const pct = ticket > 0 ? (v / ticket) * 100 : 0;
  if (v === 0) {
    return {
      metrica: "Custo de cada venda",
      valor: "—",
      status: "bom",
      oQueSignifica: "Sem vendas ainda para calcular.",
      oQueFazer: "Aguarde mais vendas.",
      statusNum: 2,
    };
  }
  if (pct <= CRITERIOS.custoCompra.pctTicket) {
    return {
      metrica: "Custo de cada venda",
      valor: fmtBRL(v),
      status: pct <= 30 ? "excelente" : "bom",
      oQueSignifica: `Para conseguir 1 venda, você gasta ${fmtBRL(v)}. Isso é ${pct.toFixed(0)}% do preço do produto (até 60%, que é o OK). ${pct <= 30 ? "Excelente! Você gasta pouco para vender." : "Está dentro do aceitável."}`,
      oQueFazer: pct <= 30 ? "Continue. Se quiser vender mais, coloque mais dinheiro." : "Está OK, mas se puder baixar mais esse custo, melhor.",
      statusNum: pct <= 30 ? 3 : 2,
    };
  }
  return {
    metrica: "Custo de cada venda",
    valor: fmtBRL(v),
    status: "ruim",
    oQueSignifica: `Para conseguir 1 venda, você gasta ${fmtBRL(v)}. Isso é ${pct.toFixed(0)}% do preço do produto (mais que os 60% recomendados). Você está gastando demais para vender.`,
    oQueFazer: "Reduza o dinheiro da campanha. Se o custo não baixar, pause e refaça o anúncio e a página.",
    statusNum: 0,
  };
}

export function analizarRoas(roas: number): Veredito {
  const v = roas || 0;
  if (v >= CRITERIOS.roas.magnifico) {
    return {
      metrica: "Retorno do dinheiro (ROAS)",
      valor: `${v.toFixed(2)}x`,
      status: "excelente",
      oQueSignifica: `Cada R$ 1 que você colocou voltou R$ ${v.toFixed(2)}. Isso é magnífico (acima de 2x). Você está ganhando bem.`,
      oQueFazer: "Coloque mais dinheiro! Esse anúncio está dando lucro grande.",
      statusNum: 3,
    };
  }
  if (v >= CRITERIOS.roas.ideal) {
    return {
      metrica: "Retorno do dinheiro (ROAS)",
      valor: `${v.toFixed(2)}x`,
      status: "bom",
      oQueSignifica: `Cada R$ 1 que você colocou voltou R$ ${v.toFixed(2)}. Está ideal (acima de 1,5x).`,
      oQueFazer: "Continue. Pode testar colocar um pouco mais de dinheiro para ver se vende mais.",
      statusNum: 2,
    };
  }
  if (v >= CRITERIOS.roas.breakEven) {
    return {
      metrica: "Retorno do dinheiro (ROAS)",
      valor: `${v.toFixed(2)}x`,
      status: "atencao",
      oQueSignifica: `Cada R$ 1 que você colocou voltou R$ ${v.toFixed(2)}. Você não está perdendo, mas tá quase no zero a zero (entre 1x e 1,5x).`,
      oQueFazer: "Melhore o anúncio e a página para vender mais com o mesmo dinheiro.",
      statusNum: 1,
    };
  }
  return {
    metrica: "Retorno do dinheiro (ROAS)",
      valor: `${v.toFixed(2)}x`,
    status: "ruim",
    oQueSignifica: `Cada R$ 1 que você colocou voltou só R$ ${v.toFixed(2)}. Você está PERDENDO dinheiro (abaixo de 1x significa que volta menos do que você colocou).`,
    oQueFazer: v < 0.5 ? "PARE essa campanha agora. Ela está queimando dinheiro." : "Reduza o dinheiro pela metade e tente melhorar. Se não melhorar em 2 dias, pause.",
    statusNum: 0,
  };
}

export function analizarGrana(grana: number): Veredito {
  const v = grana || 0;
  if (v > 0) {
    return {
      metrica: "Grana No Bolso (lucro)",
      valor: fmtBRL(v),
      status: v > 0 ? "excelente" : "ruim",
      oQueSignifica: `Depois de tirar o que você gastou nos anúncios, sobrou ${fmtBRL(v)} de lucro no seu bolso. ${v > 0 ? "Você está ganhando dinheiro!" : ""}`,
      oQueFazer: v > 0 ? "Continue investindo no que está dando lucro." : "Veja as outras métricas para entender onde está o problema.",
      statusNum: v > 0 ? 3 : 0,
    };
  }
  return {
    metrica: "Grana No Bolso (lucro)",
    valor: fmtBRL(v),
    status: "ruim",
    oQueSignifica: `Depois de tirar o que você gastou nos anúncios, você está no prejuízo de ${fmtBRL(Math.abs(v))}. Gastou mais do que vendeu.`,
    oQueFazer: "Pare as campanhas que estão dando prejuízo e foque nas que dão lucro.",
    statusNum: 0,
  };
}

// ============================================================
//  ANÁLISE COMPLETA DA CAMPANHA
// ============================================================

export function analyzeCampaign(row: CampaignRow): Recommendation[] {
  const ticket = computeTicket(row);
  const spent = row.spent || 0;
  const roas = row.roasPurchases || computeRoas(row);
  const grana = row.granaNoBolso || computeGranaNoBolso(row);
  const isInactive = !row.delivery?.toLowerCase().includes("ativ");
  const name = row.name || "Sem nome";

  // Coleta os vereditos de cada métrica
  const vereditos: Veredito[] = [
    analizarCTR(row.ctr || 0),
    analizarCustoView(row.costPerLandingPageView || 0, ticket),
    analizarCustoCheckout(row.costPerCheckoutInitiated || 0, ticket),
    analizarCustoCompra(row.costPerPurchase || 0, ticket),
    analizarRoas(roas),
    analizarGrana(grana),
  ];

  const recs: Recommendation[] = [];

  // Campanha inativa
  if (isInactive) {
    if (spent > 0 && grana < 0) {
      recs.push({
        campaignName: name, severity: "bom", action: "manter",
        title: "Campanha pausada — bom para o bolso",
        detail: `Boa! Você pausou essa campanha antes de perder mais. O prejuízo foi de ${fmtBRL(Math.abs(grana))}. Só volte a ligar quando arrumar um anúncio novo e uma página melhor.`,
        vereditos, impact: 0,
      });
    } else if (spent === 0) {
      recs.push({
        campaignName: name, severity: "alerta", action: "investigar",
        title: "Campanha desligada, sem dados",
        detail: "Essa campanha está parada e ainda não gastou nada. Ligue com pouco dinheiro (R$ 30 a R$ 50 por dia) por 3 a 5 dias para ver como se sai.",
        vereditos, impact: 0,
      });
    } else {
      recs.push({
        campaignName: name, severity: "bom", action: "manter",
        title: "Campanha pausada",
        detail: "Está parada. Quando quiser testar de novo, ligue com pouco dinheiro.",
        vereditos, impact: 0,
      });
    }
    return recs;
  }

  // Sem investimento suficiente
  if (spent < CRITERIOS.gastoMinimo) {
    recs.push({
      campaignName: name, severity: "oportunidade", action: "aumentar_orcamento",
      title: "Pouco dinheiro investido",
      detail: `Você só gastou ${fmtBRL(spent)}. É pouco para saber se o anúncio é bom ou ruim. Coloque mais dinheiro (pelo menos R$ 50) e espere alguns dias antes de decidir.`,
      vereditos, impact: 0,
    });
    return recs;
  }

  // ---- Diagnósticos combinados (observações do player) ----

  // 1. ROAS crítico — pausar ou reduzir
  if (roas < CRITERIOS.roas.breakEven) {
    const loss = Math.abs(grana);
    recs.push({
      campaignName: name,
      severity: "critico",
      action: roas < 0.5 ? "pausar" : "reduzir_orcamento",
      title: roas < 0.5 ? "PARE essa campanha agora" : "Reduza o dinheiro pela metade",
      detail: roas < 0.5
        ? `Cada R$ 1 colocado volta só R$ ${roas.toFixed(2)}. Você já perdeu ${fmtBRL(loss)}. PARE para não perder mais. Só volte com um anúncio novo e uma página nova.`
        : `Cada R$ 1 colocado volta só R$ ${roas.toFixed(2)} (abaixo de 1x). Reduza o dinheiro pela metade e observe por 2 dias. Se não melhorar, pause.`,
      vereditos, impact: loss,
    });
  } else if (roas >= CRITERIOS.roas.magnifico) {
    // 2. ROAS magnífico — escalar
    const upside = estimateScaleUpside(row);
    recs.push({
      campaignName: name, severity: "oportunidade", action: "aumentar_orcamento",
      title: "Coloque MAIS dinheiro nessa campanha!",
      detail: `Cada R$ 1 colocado volta R$ ${roas.toFixed(2)} — isso é magnífico (acima de 2x)! Aumente o dinheiro em 20% a 30% e veja se continua vendendo bem. Se sim, aumente de novo.`,
      vereditos, impact: upside,
    });
  } else if (roas >= CRITERIOS.roas.ideal) {
    recs.push({
      campaignName: name, severity: "bom", action: "aumentar_orcamento",
      title: "Pode colocar um pouco mais de dinheiro",
      detail: `Cada R$ 1 volta R$ ${roas.toFixed(2)} — está ideal (acima de 1,5x). Teste aumentar o dinheiro em 15% e veja se o custo de cada venda continua baixo.`,
      vereditos, impact: estimateScaleUpside(row) * 0.5,
    });
  }

  // 3. Diagnóstico de criativo: CTR baixo + pouco volume OU custo/view alto
  const ctr = row.ctr || 0;
  const views = row.landingPageViews || 0;
  const custoView = row.costPerLandingPageView || 0;
  const pctCustoViewTicket = ticket > 0 ? (custoView / ticket) * 100 : 0;

  if (ctr < CRITERIOS.ctr.excelente && (custoView > CRITERIOS.custoView.maximo || pctCustoViewTicket > CRITERIOS.custoView.pctTicket)) {
    recs.push({
      campaignName: name,
      severity: ctr < CRITERIOS.ctr.bom ? "critico" : "alerta",
      action: "trocar_criativo",
      title: "O anúncio (foto/vídeo) está ruim",
      detail: `Pouca gente clica no anúncio (CTR ${ctr.toFixed(2)}%) E está caro mostrar a página (${fmtBRL(custoView)}${pctCustoViewTicket > 0 ? `, ${pctCustoViewTicket.toFixed(0)}% do preço do produto` : ""}). Quando o anúncio é bom, muita gente clica e fica barato. ${views < 100 ? "Como tem pouca gente vendo a página, o problema é o anúncio não estar chamando atenção." : ""} Faça um anúncio novo: comece com uma frase forte nos primeiros 3 segundos.`,
      vereditos, impact: estimateCtrImpact(row),
    });
  }

  // 4. Diagnóstico de copy/oferta: muitas views mas custo/checkout alto
  const custoCheckout = row.costPerCheckoutInitiated || 0;
  const pctCustoCheckoutTicket = ticket > 0 ? (custoCheckout / ticket) * 100 : 0;
  if (views > 50 && pctCustoCheckoutTicket > CRITERIOS.custoCheckout.pctTicket) {
    recs.push({
      campaignName: name, severity: "alerta", action: "trocar_oferta",
      title: "A página (ou a oferta) não está convencendo",
      detail: `As pessoas estão vendo sua página (${fmtNumber(views)} pessoas), mas chegar no carrinho está caro: ${fmtBRL(custoCheckout)} (${pctCustoCheckoutTicket.toFixed(0)}% do preço do produto — mais que os 10% ideais). Isso significa que a página ou a oferta (preço, bônus, condições) não estão convencendo. Melhore: deixe o preço claro, adicione fotos de clientes, pense num bônus ou desconto.`,
      vereditos, impact: 0,
    });
  }

  // 5. CPA alto (acima de 60% do ticket)
  const cpa = row.costPerPurchase || 0;
  const pctCpaTicket = ticket > 0 ? (cpa / ticket) * 100 : 0;
  if (cpa > 0 && pctCpaTicket > CRITERIOS.custoCompra.pctTicket && roas >= CRITERIOS.roas.breakEven) {
    recs.push({
      campaignName: name, severity: "alerta", action: "trocar_criativo",
      title: "Custo de cada venda está alto",
      detail: `Para conseguir 1 venda você gasta ${fmtBRL(cpa)} — isso é ${pctCpaTicket.toFixed(0)}% do preço do produto (mais que os 60% recomendados). Mesmo não estando no prejuízo, você está gastando demais. Melhore o anúncio para atrair gente mais decidida.`,
      vereditos, impact: Math.max(0, (cpa - ticket * 0.6) * (row.purchases || 0)),
    });
  }

  // 6. Tudo perfeito (muitas checkouts baratas + ROAS bom)
  if (recs.length === 0 && roas >= CRITERIOS.roas.ideal && pctCustoCheckoutTicket > 0 && pctCustoCheckoutTicket <= CRITERIOS.custoCheckout.pctTicket) {
    recs.push({
      campaignName: name, severity: "bom", action: "manter",
      title: "Tá perfeito! Pode colocar mais dinheiro",
      detail: `O anúncio está bom (ROAS ${roas.toFixed(2)}x), chegar no carrinho está barato (${pctCustoCheckoutTicket.toFixed(0)}% do produto) e você está ganhando ${fmtBRL(grana)} de lucro. Esse é o tipo de campanha para escalar: coloque mais dinheiro aos poucos.`,
      vereditos, impact: estimateScaleUpside(row),
    });
  }

  // 7. Saudável sem alertas específicos
  if (recs.length === 0) {
    recs.push({
      campaignName: name, severity: "bom", action: "manter",
      title: "Campanha saudável",
      detail: `Está indo bem: ROAS ${roas.toFixed(2)}x e Grana No Bolso de ${fmtBRL(grana)}. Continue monitorando e teste novos anúncios para ver se encontra algo ainda melhor.`,
      vereditos, impact: 0,
    });
  }

  return recs;
}

function estimateScaleUpside(row: CampaignRow): number {
  // Estimativa conservadora: 20% de aumento de receita mantendo eficiência
  return (row.purchaseConversionValue || 0) * 0.2;
}

function estimateCtrImpact(row: CampaignRow): number {
  // Se dobrar o CTR, CPA cai proporcionalmente → economia estimada
  const cpa = row.costPerPurchase || 0;
  const purchases = row.purchases || 0;
  return cpa * purchases * 0.3;
}

export function analyzeAll(rows: CampaignRow[]): Recommendation[] {
  const all = rows.flatMap((r) => analyzeCampaign(r).map((rec) => ({ ...rec, campaignId: r.id })));
  const sevRank: Record<Severity, number> = { critico: 0, alerta: 1, oportunidade: 2, bom: 3 };
  return all.sort((a, b) => {
    if (sevRank[a.severity] !== sevRank[b.severity]) return sevRank[a.severity] - sevRank[b.severity];
    return Math.abs(b.impact) - Math.abs(a.impact);
  });
}

// ---- Cores ----
export function statusColor(s: Status): string {
  switch (s) {
    case "excelente": return "text-emerald-600 dark:text-emerald-400";
    case "bom": return "text-emerald-600 dark:text-emerald-400";
    case "atencao": return "text-amber-600 dark:text-amber-400";
    case "ruim": return "text-red-600 dark:text-red-400";
  }
}

export function statusBg(s: Status): string {
  switch (s) {
    case "excelente": return "bg-emerald-500";
    case "bom": return "bg-emerald-500";
    case "atencao": return "bg-amber-500";
    case "ruim": return "bg-red-500";
  }
}

export function severityColor(sev: Severity): string {
  switch (sev) {
    case "critico": return "text-red-600 dark:text-red-400";
    case "alerta": return "text-amber-600 dark:text-amber-400";
    case "oportunidade": return "text-emerald-600 dark:text-emerald-400";
    case "bom": return "text-muted-foreground";
  }
}

export function severityBg(sev: Severity): string {
  switch (sev) {
    case "critico": return "bg-red-500";
    case "alerta": return "bg-amber-500";
    case "oportunidade": return "bg-emerald-500";
    case "bom": return "bg-emerald-500";
  }
}

// Helper local
function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(Number(v) || 0);
}
function fmtNumber(v: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(Number(v) || 0);
}

// Critérios expostos para mostrar na UI ("como funciona")
export const CRITERIOS_EXPLICADOS = [
  {
    titulo: "Cliques no anúncio (CTR)",
    regra: "Acima de 2% é essencial",
    explicacao: "De cada 100 pessoas que veem seu anúncio, quantas clicam. Mais de 2 é ótimo.",
  },
  {
    titulo: "Custo para mostrar a página",
    regra: "Até R$ 1,50 (ideal abaixo de R$ 1,20). No máximo 10% do preço do produto",
    explicacao: "Quanto você paga para 1 pessoa ver sua página. Barato = mais gente vê.",
  },
  {
    titulo: "Custo para chegar no carrinho",
    regra: "Abaixo de 10% do preço do produto",
    explicacao: "Se está caro fazer alguém chegar no carrinho, a página ou a oferta estão fracas.",
  },
  {
    titulo: "Custo de cada venda (CPA)",
    regra: "Abaixo de 60% do preço do produto",
    explicacao: "Quanto você gasta para conseguir 1 venda. Não passe de 60% do preço.",
  },
  {
    titulo: "Retorno do dinheiro (ROAS)",
    regra: "Acima de 2,0x é magnífico. Ideal acima de 1,5x",
    explicacao: "Cada R$ 1 investido voltou quantos reais. Acima de 2x é lucro grande.",
  },
];
