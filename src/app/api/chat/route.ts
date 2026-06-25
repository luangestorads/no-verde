import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { toRow } from "@/lib/serialize";
import { fmtBRL, computeTicket } from "@/lib/metrics";

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const { message, history } = await req.json();
    const lower = (message || "").toLowerCase();

    const rows = await db.campaign.findMany({ where: { userId }, orderBy: { reportDate: "desc" } });
    const campaigns = rows.map(toRow);

    if (campaigns.length === 0) {
      return NextResponse.json({ reply: "Voce ainda nao importou nenhuma campanha. Importe seus dados do Meta Ads para que eu possa analisar." });
    }

    const totalSpent = campaigns.reduce((a, c) => a + c.spent, 0);
    const totalRevenue = campaigns.reduce((a, c) => a + c.purchaseConversionValue, 0);
    const totalPurchases = campaigns.reduce((a, c) => a + c.purchases, 0);
    const totalRoas = totalSpent > 0 ? totalRevenue / totalSpent : 0;
    const avgTicket = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;
    const granaNoBolso = totalRevenue - totalSpent;
    const activeCampaigns = campaigns.filter(c => c.delivery !== "Pausada");
    const pausedCampaigns = campaigns.filter(c => c.delivery === "Pausada");
    const greenCampaigns = activeCampaigns.filter(c => c.roasPurchases >= 2);
    const redCampaigns = activeCampaigns.filter(c => c.roasPurchases < 2 && c.costPerPurchase > avgTicket * 0.6);

    function getTopWorst(sortBy: "roas" | "cpa", limit: number) {
      const sorted = [...activeCampaigns].sort((a, b) => {
        if (sortBy === "roas") return b.roasPurchases - a.roasPurchases;
        return a.costPerPurchase - b.costPerPurchase;
      });
      return sorted.slice(0, limit);
    }

    let reply = "";

    if (lower.includes("resumo") || lower.includes("situacao") || lower.includes("como esta") || lower.includes("geral")) {
      reply = "Aqui esta o resumo das suas " + campaigns.length + " campanhas:" +
        "\n\n- Investimento total: " + fmtBRL(totalSpent) +
        "\n- Receita total: " + fmtBRL(totalRevenue) +
        "\n- Compras: " + totalPurchases +
        "\n- ROAS geral: " + totalRoas.toFixed(2) + "x" +
        "\n- Grana no Bolso: " + fmtBRL(granaNoBolso) +
        "\n- Ticket medio: " + fmtBRL(avgTicket) +
        "\n- Ativas: " + activeCampaigns.length + " | Pausadas: " + pausedCampaigns.length +
        "\n- No verde: " + greenCampaigns.length + " | No vermelho: " + redCampaigns.length +
        (totalRoas >= 2 ? "\n\nConclusao: Seu ROAS geral esta ACIMA de 2x, otimo sinal!" : "\n\nConclusao: Seu ROAS geral esta ABAIXO de 2x, precisa de ajustes.");

    } else if (lower.includes("pior") || lower.includes("problema") || lower.includes("perdendo") || lower.includes("vermelho")) {
      const worst = getTopWorst("cpa", 3);
      if (worst.length === 0) {
        reply = "Todas as campanhas ativas estao com bom desempenho!";
      } else {
        reply = "As campanhas com pior desempenho sao:";
        worst.forEach((c, i) => {
          reply += "\n\n" + (i + 1) + ". " + c.name +
            "\n   ROAS: " + c.roasPurchases.toFixed(2) + "x" +
            "\n   CPA: " + fmtBRL(c.costPerPurchase) +
            "\n   CTR: " + c.ctr.toFixed(1) + "%" +
            "\n   Investido: " + fmtBRL(c.spent) +
            "\n   Recomendacao: " + (c.roasPurchases < 1 ? "Pausar imediatamente" : c.roasPurchases < 2 ? "Reduzir orcamento e testar novos criativos" : "Monitorar");
        });
        reply += "\n\nAcao sugerida: Pausar ou reduzir orcamento das campanhas com ROAS abaixo de 1x e realocar para as que estao no verde.";
      }

    } else if (lower.includes("melhor") || lower.includes("top") || lower.includes("escalar") || lower.includes("verde")) {
      const best = getTopWorst("roas", 5);
      reply = "As campanhas com melhor desempenho sao:";
      best.forEach((c, i) => {
        reply += "\n\n" + (i + 1) + ". " + c.name +
          "\n   ROAS: " + c.roasPurchases.toFixed(2) + "x" +
          "\n   Receita: " + fmtBRL(c.purchaseConversionValue) +
          "\n   Compras: " + c.purchases +
          "\n   Recomendacao: Escalar orcamento em 20-30%";
      });
      reply += "\n\nAcao sugerida: Aumentar o orcamento dessas campanhas gradualmente (20% por vez) para escalar os resultados.";

    } else if (lower.includes("ticket") || lower.includes("preco") || lower.includes("valor medio")) {
      reply = "Analise do Ticket Medio:" +
        "\n\n- Ticket medio geral: " + fmtBRL(avgTicket) +
        "\n- Total de compras: " + totalPurchases +
        "\n- Receita total: " + fmtBRL(totalRevenue);
      if (avgTicket < 80) {
        reply += "\n\nSeu ticket medio esta BAIXO. Considere oferecer produtos complementares ou upsells para aumentar o valor medio.";
      } else if (avgTicket > 200) {
        reply += "\n\nSeu ticket medio esta BOM. Foque em aumentar o volume de compras.";
      } else {
        reply += "\n\nSeu ticket medio esta na media. Considere ordem de bumps ou combos para aumentar.";
      }

    } else if (lower.includes("ctr") || lower.includes("clique")) {
      const lowCtr = activeCampaigns.filter(c => c.ctr < 2);
      const highCtr = activeCampaigns.filter(c => c.ctr >= 2);
      reply = "Analise de CTR (Taxa de Cliques):" +
        "\n\n- Campanhas com CTR bom (>=2%): " + highCtr.length +
        "\n- Campanhas com CTR baixo (<2%): " + lowCtr.length;
      if (lowCtr.length > 0) {
        reply += "\n\nCampanhas com CTR baixo:";
        lowCtr.slice(0, 3).forEach(c => {
          reply += "\n- " + c.name + " (" + c.ctr.toFixed(1) + "%)";
        });
        reply += "\n\nDicas para melhorar o CTR:" +
          "\n1. Troque as imagens/criativos" +
          "\n2. Teste novos titulos" +
          "\n3. Refine o publico-alvo" +
          "\n4. Use criativos em video";
      }

    } else if (lower.includes("roas") || lower.includes("retorno")) {
      reply = "Analise de ROAS:" +
        "\n\n- ROAS geral: " + totalRoas.toFixed(2) + "x" +
        "\n- Meta minima: 2.0x" +
        "\n- Status: " + (totalRoas >= 2 ? "ACIMA da meta" : "ABAIXO da meta");
      const aboveTarget = activeCampaigns.filter(c => c.roasPurchases >= 2);
      const belowTarget = activeCampaigns.filter(c => c.roasPurchases < 2);
      reply += "\n\n- Acima de 2x: " + aboveTarget.length + " campanhas" +
        "\n- Abaixo de 2x: " + belowTarget.length + " campanhas";
      reply += "\n\nPara melhorar o ROAS:" +
        "\n1. Pausar campanhas com ROAS < 1x" +
        "\n2. Escalar campanhas com ROAS > 3x" +
        "\n3. Melhorar o CTR para reduzir o custo por clique" +
        "\n4. Otimizar a pagina de destino para mais conversoes";

    } else if (lower.includes("cpa") || lower.includes("custo por compra") || lower.includes("custo por aquisicao")) {
      const sorted = [...activeCampaigns].sort((a, b) => a.costPerPurchase - b.costPerPurchase);
      reply = "Analise de CPA (Custo por Compra):" +
        "\n\n- CPA medio: " + fmtBRL(totalPurchases > 0 ? totalSpent / totalPurchases : 0) +
        "\n- Ticket medio: " + fmtBRL(avgTicket) +
        "\n- CPA ideal: abaixo de " + fmtBRL(avgTicket * 0.6) + " (60% do ticket)";
      reply += "\n\nCampanhas ordenadas por CPA:";
      sorted.slice(0, 5).forEach((c, i) => {
        const status = c.costPerPurchase <= avgTicket * 0.6 ? "Bom" : c.costPerPurchase <= avgTicket ? "Atencao" : "Ruim";
        reply += "\n" + (i + 1) + ". " + c.name + " - " + fmtBRL(c.costPerPurchase) + " [" + status + "]";
      });

    } else if (lower.includes("funil") || lower.includes("conversao") || lower.includes("checkout")) {
      const totalViews = campaigns.reduce((a, c) => a + c.landingPageViews, 0);
      const totalCheckouts = campaigns.reduce((a, c) => a + c.checkoutInitiated, 0);
      const viewToCheckout = totalViews > 0 ? (totalCheckouts / totalViews * 100) : 0;
      const checkoutToPurchase = totalCheckouts > 0 ? (totalPurchases / totalCheckouts * 100) : 0;
      reply = "Analise do Funil de Conversao:" +
        "\n\n- Visualizacoes de pagina: " + totalViews +
        "\n- Checkouts iniciados: " + totalCheckouts +
        "\n- Compras finalizadas: " + totalPurchases +
        "\n\nTaxas de conversao:" +
        "\n- Views -> Checkout: " + viewToCheckout.toFixed(1) + "%" +
        "\n- Checkout -> Compra: " + checkoutToPurchase.toFixed(1) + "%" +
        "\n- Views -> Compra: " + (totalViews > 0 ? (totalPurchases / totalViews * 100).toFixed(1) : "0") + "%";
      if (checkoutToPurchase < 30) {
        reply += "\n\nAtencao: Sua taxa de checkout->compra esta baixa. Possiveis causas:" +
          "\n1. Frete caro ou nao informado cedo" +
          "\n2. Poucas opcoes de pagamento" +
          "\n3. Pagina de checkout confusa" +
          "\n4. Falta de selos de confianca";
      }

    } else if (lower.includes("pausar") || lower.includes("parar") || lower.includes("cortar")) {
      const toPause = activeCampaigns.filter(c => c.roasPurchases < 1.5);
      if (toPause.length === 0) {
        reply = "Nenhuma campanha precisa ser pausada no momento. Todas estao com ROAS acima de 1.5x.";
      } else {
        reply = "Campanhas que recomendo pausar (ROAS < 1.5x):";
        toPause.forEach((c, i) => {
          reply += "\n\n" + (i + 1) + ". " + c.name +
            "\n   ROAS: " + c.roasPurchases.toFixed(2) + "x" +
            "\n   Prejuizo: " + fmtBRL(c.spent - c.purchaseConversionValue);
        });
        reply += "\n\nEconomia estimada: " + fmtBRL(toPause.reduce((a, c) => a + c.spent, 0));
      }

    } else if (lower.includes("escalar") || lower.includes("aumentar") || lower.includes("investir mais")) {
      const toScale = activeCampaigns.filter(c => c.roasPurchases >= 3);
      if (toScale.length === 0) {
        reply = "Nenhuma campanha com ROAS acima de 3x para escalar com seguranca. Foque primeiro em melhorar o desempenho das ativas.";
      } else {
        reply = "Campanhas prontas para escalar (ROAS >= 3x):";
        toScale.forEach((c, i) => {
          reply += "\n\n" + (i + 1) + ". " + c.name +
            "\n   ROAS: " + c.roasPurchases.toFixed(2) + "x" +
            "\n   Investido: " + fmtBRL(c.spent) +
            "\n   Sugestao: Aumentar para " + fmtBRL(c.spent * 1.3);
        });
        reply += "\n\nRegra: Aumente 20% por vez e aguarde 48h para avaliar o impacto.";
      }

    } else if (lower.includes("oi") || lower.includes("ola") || lower.includes("hey") || lower.includes("bom dia") || lower.includes("boa tarde") || lower.includes("boa noite")) {
      reply = "Ola! Sou a IA do No Verde. Posso te ajudar com:" +
        "\n\n- Resumo geral das campanhas" +
        "\n- Quais pausar (perdendo dinheiro)" +
        "\n- Quais escalar (lucrando muito)" +
        "\n- Analise de ROAS, CTR, CPA" +
        "\n- Funil de conversao" +
        "\n- Ticket medio" +
        "\n\nPergunte o que quiser saber!";

    } else if (lower.includes("obrigad") || lower.includes("valeu") || lower.includes("thanks")) {
      reply = "Por nada! Estou aqui pra ajudar. Se precisar de mais alguma analise, e so perguntar.";

    } else {
      reply = "Entendi sua pergunta! Aqui vai uma visao rapida:" +
        "\n\nResumo:" +
        "\n- " + campaigns.length + " campanhas (" + activeCampaigns.length + " ativas)" +
        "\n- Investido: " + fmtBRL(totalSpent) +
        "\n- Receita: " + fmtBRL(totalRevenue) +
        "\n- ROAS: " + totalRoas.toFixed(2) + "x" +
        "\n- Grana no Bolso: " + fmtBRL(granaNoBolso) +
        "\n\nPerguntas que posso responder:" +
        "\n- 'Qual o resumo geral?'" +
        "\n- 'Quais campanhas devo pausar?'" +
        "\n- 'Quais escalar?'" +
        "\n- 'Analise o ROAS'" +
        "\n- 'Analise o CTR'" +
        "\n- 'Analise o funil'" +
        "\n- 'Como esta o CPA?'" +
        "\n- 'Analise o ticket medio'";
    }

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("Chat error", e);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}