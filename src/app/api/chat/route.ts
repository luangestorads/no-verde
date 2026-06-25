import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { toRow } from "@/lib/serialize";
import { fmtBRL } from "@/lib/metrics";

function buildContext(campaigns: any[]) {
  if (campaigns.length === 0) return null;
  const totalSpent = campaigns.reduce((a: number, c: any) => a + c.spent, 0);
  const totalRevenue = campaigns.reduce((a: number, c: any) => a + c.purchaseConversionValue, 0);
  const totalPurchases = campaigns.reduce((a: number, c: any) => a + c.purchases, 0);
  const totalRoas = totalSpent > 0 ? totalRevenue / totalSpent : 0;
  const avgTicket = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;
  const granaNoBolso = totalRevenue - totalSpent;
  const active = campaigns.filter((c: any) => c.delivery !== "Pausada");
  const paused = campaigns.filter((c: any) => c.delivery === "Pausada");
  const green = active.filter((c: any) => c.roasPurchases >= 2);
  const yellow = active.filter((c: any) => c.roasPurchases >= 1 && c.roasPurchases < 2);
  const red = active.filter((c: any) => c.roasPurchases < 1);
  const totalViews = campaigns.reduce((a: number, c: any) => a + c.landingPageViews, 0);
  const totalCheckouts = campaigns.reduce((a: number, c: any) => a + c.checkoutInitiated, 0);
  const avgCtr = active.length > 0 ? active.reduce((a: number, c: any) => a + c.ctr, 0) / active.length : 0;
  const avgCpa = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
  const topRoas = [...active].sort((a: any, b: any) => b.roasPurchases - a.roasPurchases).slice(0, 3);
  const worstRoas = [...active].sort((a: any, b: any) => a.roasPurchases - b.roasPurchases).slice(0, 3);

  return {
    total: campaigns.length, active: active.length, paused: paused.length,
    green: green.length, yellow: yellow.length, red: red.length,
    totalSpent, totalRevenue, totalPurchases, totalRoas, avgTicket, granaNoBolso,
    totalViews, totalCheckouts, avgCtr, avgCpa,
    viewToCheckout: totalViews > 0 ? (totalCheckouts / totalViews * 100) : 0,
    checkoutToPurchase: totalCheckouts > 0 ? (totalPurchases / totalCheckouts * 100) : 0,
    topRoas: topRoas.map((c: any) => ({ name: c.name, roas: c.roasPurchases, spent: c.spent, revenue: c.purchaseConversionValue, cpa: c.costPerPurchase, ctr: c.ctr, purchases: c.purchases })),
    worstRoas: worstRoas.map((c: any) => ({ name: c.name, roas: c.roasPurchases, spent: c.spent, revenue: c.purchaseConversionValue, cpa: c.costPerPurchase, ctr: c.ctr, purchases: c.purchases })),
    allCampaigns: campaigns.map((c: any) => ({ name: c.name, delivery: c.delivery, spent: c.spent, revenue: c.purchaseConversionValue, roas: c.roasPurchases, cpa: c.costPerPurchase, ctr: c.ctr, purchases: c.purchases, views: c.landingPageViews, checkouts: c.checkoutInitiated })),
  };
}

function f(v: number) { return fmtBRL(v); }

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

    const { message } = await req.json();
    const msg = (message || "").trim();
    if (!msg) return NextResponse.json({ reply: "Pergunte algo!" });

    const rows = await db.campaign.findMany({ where: { userId }, orderBy: { reportDate: "desc" } });
    const campaigns = rows.map(toRow);
    const ctx = buildContext(campaigns);

    const low = msg.toLowerCase();

    if (!ctx) {
      return NextResponse.json({ reply: "Voce ainda nao importou nenhuma campanha. Para que eu possa te ajudar com analises, importe seus dados do Meta Ads primeiro.\n\nMas pode me perguntar sobre marketing digital, Meta Ads, estrategias e dicas que eu respondo!" });
    }

    let reply = "";

    // ====== PERGUNTAS SOBRE DADOS ======
    if (low.match(/resumo|situacao|como esta|geral|visao geral| panorama|status/)) {
      reply = "Aqui esta o panorama completo das suas " + ctx.total + " campanhas:\n\n" +
        "INVESTIMENTO\n- Total investido: " + f(ctx.totalSpent) + "\n- Receita gerada: " + f(ctx.totalRevenue) + "\n- Grana no Bolso: " + f(ctx.granaNoBolso) + "\n\n" +
        "DESEMPENHO\n- ROAS geral: " + ctx.totalRoas.toFixed(2) + "x\n- Compras: " + ctx.totalPurchases + "\n- Ticket medio: " + f(ctx.avgTicket) + "\n- CTR medio: " + ctx.avgCtr.toFixed(1) + "%\n- CPA medio: " + f(ctx.avgCpa) + "\n\n" +
        "DISTRIBUICAO\n- Ativas: " + ctx.active + " | Pausadas: " + ctx.paused + "\n- No verde (ROAS >= 2x): " + ctx.green + "\n- Atencao (ROAS 1-2x): " + ctx.yellow + "\n- No vermelho (ROAS < 1x): " + ctx.red + "\n\n" +
        "FUNIL\n- Visualizacoes: " + ctx.totalViews + "\n- Checkouts: " + ctx.totalCheckouts + "\n- Views->Checkout: " + ctx.viewToCheckout.toFixed(1) + "%\n- Checkout->Compra: " + ctx.checkoutToPurchase.toFixed(1) + "%\n\n" +
        (ctx.totalRoas >= 2 ? "VEREDITO: Sua conta esta SAUDAVEL, com ROAS acima de 2x. Foque em escalar o que funciona." : ctx.totalRoas >= 1 ? "VEREDITO: Sua conta esta na MEDIA. Tem campanhas para otimizar e algumas para pausar." : "VEREDITO: ALERTA! Sua conta esta no vermelho. Acoes corretivas sao necessarias URGENTEMENTE.");
    }

    else if (low.match(/pior|problema|perdendo|vermelho|ruim|critico|alerta|prejuizo|negativo/)) {
      if (ctx.red === 0 && ctx.worstRoas.every(c => c.roas >= 1.5)) {
        reply = "Boas noticias! Nenhuma campanha esta em estado critico no momento. Todas estao com desempenho aceitavel.\n\nDica: Continue monitorando e foque em escalar as que ja estao no verde.";
      } else {
        reply = "CAMPANHAS QUE PREOCUPAM:\n\n";
        const bad = [...ctx.allCampaigns].filter(c => c.delivery !== "Pausada" && c.roas < 2).sort((a: any, b: any) => a.roas - b.roas);
        bad.forEach((c: any, i: number) => {
          const loss = c.spent - c.revenue;
          reply += (i + 1) + ". " + c.name + "\n" +
            "   ROAS: " + c.roas.toFixed(2) + "x | CPA: " + f(c.cpa) + " | CTR: " + c.ctr.toFixed(1) + "%\n" +
            "   Investido: " + f(c.spent) + " | Receita: " + f(c.revenue) + (loss > 0 ? " | PREJUIZO: " + f(loss) : "") + "\n\n";
        });
        const totalLoss = bad.reduce((a: number, c: any) => a + Math.max(0, c.spent - c.revenue), 0);
        reply += "IMPACTO: Se pausar essas campanhas, voce economiza " + f(totalLoss) + "\n\n" +
          "ACAO IMEDIATA:\n" +
          "- Pausar campanhas com ROAS < 1x (sangramento direto)\n" +
          "- Reduzir orcamento das com ROAS entre 1x e 1.5x\n" +
          "- Realocar budget para as do topo";
      }
    }

    else if (low.match(/melhor|top|escalar|aumentar|otimo|excelente|verde|lucrando/)) {
      reply = "CAMPANHAS ESTRELA:\n\n";
      ctx.topRoas.forEach((c: any, i: number) => {
        reply += (i + 1) + ". " + c.name + "\n" +
          "   ROAS: " + c.roas.toFixed(2) + "x | Receita: " + f(c.revenue) + " | Compras: " + c.purchases + "\n\n";
      });
      const scalable = ctx.topRoas.filter(c => c.roas >= 3);
      if (scalable.length > 0) {
        reply += "PRONTAS PARA ESCALAR (ROAS >= 3x):\n";
        scalable.forEach((c: any) => {
          reply += "- " + c.name + ": aumentar de " + f(c.spent) + " para " + f(c.spent * 1.3) + " (+30%)\n";
        });
        reply += "\nRegra de ouro: Aumente 20-30% e aguarde 48h. Se o ROAS se manter, aumente mais.";
      } else {
        reply += "\nNenhuma campanha com ROAS acima de 3x para escalar com seguranca. Melhore o desempenho das ativas primeiro.";
      }
    }

    else if (low.match(/roas|retorno|retorno sobre/)) {
      const above = ctx.allCampaigns.filter(c => c.delivery !== "Pausada" && c.roas >= 2).length;
      const below = ctx.allCampaigns.filter(c => c.delivery !== "Pausada" && c.roas < 2).length;
      reply = "ANALISE DE ROAS:\n\n" +
        "ROAS geral: " + ctx.totalRoas.toFixed(2) + "x (meta: 2.0x)\n" +
        "Acima da meta: " + above + " campanhas\n" +
        "Abaixo da meta: " + below + " campanhas\n\n" +
        "DISTRIBUICAO POR FAIXA:\n";
      const ranges = [
        { label: "0-0.5x (Critico)", min: 0, max: 0.5 },
        { label: "0.5-1x (Ruim)", min: 0.5, max: 1 },
        { label: "1-2x (Medio)", min: 1, max: 2 },
        { label: "2-3x (Bom)", min: 2, max: 3 },
        { label: "3x+ (Excelente)", min: 3, max: 999 },
      ];
      ranges.forEach(r => {
        const count = ctx.allCampaigns.filter(c => c.delivery !== "Pausada" && c.roas >= r.min && c.roas < r.max).length;
        const bar = "#".repeat(Math.max(1, count));
        reply += "- " + r.label + ": " + count + " " + bar + "\n";
      });
      reply += "\nCOMO MELHORAR O ROAS:\n" +
        "1. Pausar campanhas com ROAS < 1x (economia imediata)\n" +
        "2. Melhorar CTR (criativos mais atrativos)\n" +
        "3. Otimizar pagina de destino (mais conversoes)\n" +
        "4. Refinar publico-alvo (menos alcance, mais qualidade)\n" +
        "5. Testar horarios e dias de maior conversao";
    }

    else if (low.match(/ctr|clique|taxa de clique|click/)) {
      const lowCtr = ctx.allCampaigns.filter(c => c.delivery !== "Pausada" && c.ctr < 2);
      const highCtr = ctx.allCampaigns.filter(c => c.delivery !== "Pausada" && c.ctr >= 2);
      reply = "ANALISE DE CTR (Taxa de Cliques):\n\n" +
        "CTR medio: " + ctx.avgCtr.toFixed(1) + "% (meta: 2.0%)\n" +
        "Acima da meta: " + highCtr.length + " campanhas\n" +
        "Abaixo da meta: " + lowCtr.length + " campanhas\n\n";
      if (lowCtr.length > 0) {
        reply += "CAMPANHAS COM CTR BAIXO:\n";
        lowCtr.sort((a: any, b: any) => a.ctr - b.ctr).slice(0, 3).forEach((c: any, i: number) => {
          reply += (i + 1) + ". " + c.name + " - " + c.ctr.toFixed(1) + "%\n";
        });
        reply += "\nCOMO MELHORAR O CTR:\n" +
          "1. TROCAR CRIATIVOS - imagens novas chamam mais atencao\n" +
          "2. VIDEOS CURTOS - 15-30 segundos performam melhor\n" +
          "3. TITULOS IMPACTANTES - use numeros e gatilhos mentais\n" +
          "4. CORES VIBRANTES - destaque no feed\n" +
          "5. PROVA SOCIAL - depoimentos e resultados reais\n" +
          "6. REFINE O PUBLICO - publico muito largo = CTR baixo\n" +
          "7. TESTE CARROSSEL - multiplas imagens aumentam engajamento";
      }
    }

    else if (low.match(/cpa|custo por compra|custo por aquisicao|custo por cliente/)) {
      const ideal = ctx.avgTicket * 0.6;
      reply = "ANALISE DE CPA (Custo por Compra):\n\n" +
        "CPA medio: " + f(ctx.avgCpa) + "\n" +
        "Ticket medio: " + f(ctx.avgTicket) + "\n" +
        "CPA ideal: abaixo de " + f(ideal) + " (60% do ticket)\n" +
        "Status: " + (ctx.avgCpa <= ideal ? "OTIMO - CPA esta dentro do aceitavel" : ctx.avgCpa <= ctx.avgTicket ? "ATENCAO - CPA esta alto mas ainda gera lucro" : "CRITICO - CPA maior que o ticket medio!") + "\n\n" +
        "RANKING POR CPA:\n";
      [...ctx.allCampaigns].filter(c => c.delivery !== "Pausada").sort((a: any, b: any) => a.cpa - b.cpa).forEach((c: any, i: number) => {
        const status = c.cpa <= ideal ? "[BOM]" : c.cpa <= ctx.avgTicket ? "[MEDIO]" : "[RUIM]";
        reply += (i + 1) + ". " + status + " " + c.name + " - " + f(c.cpa) + "\n";
      });
      reply += "\nCOMO REDUZIR O CPA:\n" +
        "1. Melhore o CTR (mais cliques = mais conversoes pelo mesmo custo)\n" +
        "2. Otimize a pagina de destino (mais conversoes)\n" +
        "3. Segmentacao mais fina (publico mais qualificado)\n" +
        "4. Remova palavras-chave negativas\n" +
        "5. Teste diferentes tipos de campanha (conversao vs trafego)";
    }

    else if (low.match(/funil|conversao|checkout|pagina de destino|landing/)) {
      reply = "ANALISE DO FUNIL DE CONVERSAO:\n\n" +
        "ETAPA 1 - IMPRESSOES -> CLIQUES\n" +
        "CTR medio: " + ctx.avgCtr.toFixed(1) + "% (meta: 2%)\n" +
        "Status: " + (ctx.avgCtr >= 2 ? "BOM" : "PRECISA MELHORAR") + "\n\n" +
        "ETAPA 2 - CLIQUES -> PAGINA\n" +
        "Visualizacoes: " + ctx.totalViews + "\n\n" +
        "ETAPA 3 - PAGINA -> CHECKOUT\n" +
        "Taxa: " + ctx.viewToCheckout.toFixed(1) + "% (bom: acima de 5%)\n" +
        "Status: " + (ctx.viewToCheckout >= 5 ? "BOM" : "PRECISA MELHORAR") + "\n\n" +
        "ETAPA 4 - CHECKOUT -> COMPRA\n" +
        "Taxa: " + ctx.checkoutToPurchase.toFixed(1) + "% (bom: acima de 30%)\n" +
        "Status: " + (ctx.checkoutToPurchase >= 30 ? "BOM" : "PRECISA MELHORAR") + "\n\n" +
        "GARGALOS E SOLUCOES:\n";
      if (ctx.avgCtr < 2) reply += "- CTR baixo: troque criativos e refine o publico\n";
      if (ctx.viewToCheckout < 5) reply += "- Poucos checkouts: melhore a velocidade da pagina e o CTA\n";
      if (ctx.checkoutToPurchase < 30) reply += "- Abandono de checkout: reduza passos, mostre frete cedo, mais opcoes de pagamento\n";
      if (ctx.avgCtr >= 2 && ctx.viewToCheckout >= 5 && ctx.checkoutToPurchase >= 30) reply += "- Funil esta saudavel! Foque em aumentar o trafego.";
    }

    else if (low.match(/ticket|ticket medio|valor medio|preco medio|valor medio/)) {
      reply = "ANALISE DE TICKET MEDIO:\n\n" +
        "Ticket medio atual: " + f(ctx.avgTicket) + "\n" +
        "Total de compras: " + ctx.totalPurchases + "\n" +
        "Receita total: " + f(ctx.totalRevenue) + "\n\n" +
        "AVALIACAO:\n";
      if (ctx.avgTicket < 80) {
        reply += "Seu ticket medio esta BAIXO. Isso significa que voce precisa de MUITAS vendas para ser lucrativo.\n\n" +
          "COMO AUMENTAR:\n" +
          "1. Ordens de bump (produto complementar na compra)\n" +
          "2. Upsell (versao premium do produto)\n" +
          "3. Kits/Combos (compre junto e economize)\n" +
          "4. Frete gratis acima de X (aumenta o ticket)\n" +
          "5. Ofereca variacoes mais caras primeiro";
      } else if (ctx.avgTicket <= 200) {
        reply += "Seu ticket medio esta na MEDIA. Bom espaco para otimizar.\n\n" +
          "COMO AUMENTAR:\n" +
          "1. Ordens de bump com produtos de alto valor\n" +
          "2. Kits premium\n" +
          "3. Condicionais de compra (compre 2, ganhe 10% off)";
      } else {
        reply += "Seu ticket medio esta ALTO! Otimo sinal.\n\n" +
          "FOQUE EM:\n" +
          "1. Aumentar o volume de vendas\n" +
          "2. Oferecer parcelamento para facilitar\n" +
          "3. Manter a qualidade para justificar o preco";
      }
    }

    else if (low.match(/pausar|parar|cortar|desligar|cancelar/)) {
      const toPause = ctx.allCampaigns.filter(c => c.delivery !== "Pausada" && c.roas < 1.5).sort((a: any, b: any) => a.roas - b.roas);
      if (toPause.length === 0) {
        reply = "Nenhuma campanha precisa ser pausada! Todas as ativas estao com ROAS acima de 1.5x.";
      } else {
        const saving = toPause.reduce((a: number, c: any) => a + c.spent, 0);
        const loss = toPause.reduce((a: number, c: any) => a + Math.max(0, c.spent - c.revenue), 0);
        reply = "CAMPANHAS PARA PAUSAR (ROAS < 1.5x):\n\n";
        toPause.forEach((c: any, i: number) => {
          reply += (i + 1) + ". " + c.name + "\n" +
            "   ROAS: " + c.roas.toFixed(2) + "x | Prejuizo: " + f(Math.max(0, c.spent - c.revenue)) + "\n\n";
        });
        reply += "IMPACTO:\n- Economia imediata: " + f(saving) + "/dia\n- Reducao de prejuizo: " + f(loss) + "\n\n" +
          "COMO FAZER:\n" +
          "1. Pausar as com ROAS < 1x imediatamente\n" +
          "2. Reduzir orcamento das com ROAS 1-1.5x pela metade\n" +
          "3. Realocar o budget para as campanhas verdes\n" +
          "4. Reavaliar em 48h";
      }
    }

    else if (low.match(/escalar|aumentar|investir mais|grow|crescer/)) {
      const toScale = ctx.allCampaigns.filter(c => c.delivery !== "Pausada" && c.roas >= 3).sort((a: any, b: any) => b.roas - a.roas);
      if (toScale.length === 0) {
        reply = "Nenhuma campanha com ROAS acima de 3x para escalar com seguranca.\n\n" +
          "ANTES DE ESCALAR:\n" +
          "1. Otimize as campanhas atuais (melhore CTR, CPA)\n" +
          "2. Consiga pelo menos 1 campanha com ROAS > 3x\n" +
          "3. Teste incrementos menores primeiro (10%)\n" +
          "4. Tenha pelo menos 48h de dados estaveis";
      } else {
        reply = "CAMPANHAS PRONTAS PARA ESCALAR:\n\n";
        toScale.forEach((c: any, i: number) => {
          reply += (i + 1) + ". " + c.name + "\n" +
            "   ROAS: " + c.roas.toFixed(2) + "x | Atual: " + f(c.spent) + " | Sugestao: " + f(c.spent * 1.3) + " (+30%)\n\n";
        });
        reply += "METODOLOGIA DE ESCALA:\n" +
          "1. Aumente 20-30% do orcamento\n" +
          "2. Aguarde 48h com dados estaveis\n" +
          "3. Se ROAS se manteve > 2.5x, repita\n" +
          "4. Se ROAS caiu abaixo de 2x, volte ao valor anterior\n" +
          "5. Nunca aumente mais de 50% de uma vez\n\n" +
          "DICA: Escale nos dias de melhor performance (geralmente terca a quinta)";
      }
    }

    else if (low.match(/publico|audiencia|segmentacao|pessoa|target|lookalike|semelhante/)) {
      reply = "ESTRATEGIA DE PUBLICO-ALVO:\n\n" +
        "COMO ESTA:\n" +
        "- " + ctx.active + " campanhas ativas\n" +
        "- CTR medio: " + ctx.avgCtr.toFixed(1) + "%\n\n" +
        "SE O CTR ESTA BAIXO (< 2%), o publico pode estar muito largo.\n\n" +
        "DICAS DE SEGMENTACAO:\n" +
        "1. LOOKALIKE 1-3% de compradores (melhor opcao)\n" +
        "2. Retargeting de quem visitou mas nao comprou\n" +
        "3. Retargeting de quem adicionou ao carrinho\n" +
        "4. Excluir quem ja comprou (evita gastar com quem ja converteu)\n" +
        "5. Teste interesses especificos do nicho\n" +
        "6. Use dados do pixel para criar publicos personalizados\n\n" +
        "ERRO COMUM: Publico muito largo (lookalike 10%+) gera CTR baixo e CPA alto.";
    }

    else if (low.match(/criativo|imagem|video|anuncio|copy|texto|headline/)) {
      reply = "ESTRATEGIA DE CRIATIVOS:\n\n" +
        "SITUACAO ATUAL:\n" +
        "- CTR medio: " + ctx.avgCtr.toFixed(1) + "% (meta: 2%)\n\n" +
        "TIPOS DE CRIATIVO QUE MAIS FUNCIONAM:\n" +
        "1. VIDEOS CURTOS (15-30s) - maior engajamento\n" +
        "2. UGC (conteudo gerado pelo usuario) - mais autenticidade\n" +
        "3. ANTES E DEPOIS - mostra transformacao\n" +
        "4. DEPOIMENTOS - prova social\n" +
        "5. CARROSSEL (3-5 imagens) - mais oportunidades de clique\n" +
        "6. PROVA SOCIAL (print de vendas, resultados)\n\n" +
        "ELEMENTOS DO ANUNCIO IDEAL:\n" +
        "- Hook nos primeiros 3 segundos\n" +
        - "Legenda curta e direta\n" +
        "- CTA claro (Compre agora, Saiba mais)\n" +
        "- Preco visivel (filtra curiosos)\n" +
        "- Selo de confianca\n\n" +
        "TESTE: Crie pelo menos 3 criativos por campanha e mantenha o vencedor.";
    }

    else if (low.match(/horario|dia|melhor hora|quando|agenda|schedule/)) {
      reply = "MELHORES HORARIOS PARA META ADS:\n\n" +
        "GERAL (e-commerce Brasil):\n" +
        "- Melhores dias: Terca, Quarta e Quinta\n" +
        "- Piores dias: Domingo e Sabado\n" +
        "- Melhores horarios: 10h-12h e 19h-22h\n" +
        "- Pior horario: 00h-06h\n\n" +
        "DICA PROFISSIONAL:\n" +
        "1. Ligue o agendamento nas campanhas\n" +
        "2. Teste diferentes horarios por 3 dias\n" +
        "3. Compare o custo por compra em cada faixa\n" +
        "4. Concentre orcamento nos horarios de melhor performance\n\n" +
        "ATENCAO: No inicio, deixe rodar 24h para coletar dados. Depois otimize.";
    }

    else if (low.match(/orcamento|budget|quanto investir|quanto gastar|valor/)) {
      reply = "PLANEJAMENTO DE ORCAMENTO:\n\n" +
        "ATUAL:\n" +
        "- Investido: " + f(ctx.totalSpent) + "\n" +
        "- ROAS: " + ctx.totalRoas.toFixed(2) + "x\n" +
        "- Grana no Bolso: " + f(ctx.granaNoBolso) + "\n\n" +
        "QUANTO INVESTIR?\n" +
        "Regra basica: Invista pelo menos 2x o ticket medio por dia para ter dados estatisticos validos.\n" +
        "Seu ticket medio: " + f(ctx.avgTicket) + " -> Minimo diario: " + f(ctx.avgTicket * 2) + "\n\n" +
        "DISTRIBUICAO SUGERIDA:\n" +
        "- 60% para campanhas de conversao (procuram comprar)\n" +
        "- 20% para retargeting (ja conhecem a marca)\n" +
        "- 20% para alcance/topo de funil (novos publicos)\n\n" +
        "QUANDO AUMENTAR:\n" +
        "- Quando ROAS > 3x por 3+ dias seguidos\n" +
        "- Quando CPA < 50% do ticket medio\n" +
        "- Aumente 20% por vez, nunca mais que 50%";
    }

    else if (low.match(/concorrente|concorrencia|competidor/)) {
      reply = "ANALISE COMPETITIVA:\n\n" +
        "COMO ESPIONAR CONCORRENTES:\n" +
        "1. Biblioteca de Anuncios do Meta (facebook.com/ads/library)\n" +
        "   - Pesquise o nome do concorrente\n" +
        "   - Veja todos os anuncios ativos\n" +
        "   - Analise criativos, copys e ofertas\n\n" +
        "2. Meta Ads Insights\n" +
        "   - Veja estimativa de gasto dos concorrentes\n\n" +
        "3. Ferramentas externas\n" +
        "   - AdSpy (espião de anuncios)\n" +
        "   - Semrush (analise de trafego pago)\n\n" +
        "O QUE ANALISAR:\n" +
        "- Tipos de criativo que usam\n" +
        "- Ofertas e precos praticados\n" +
        "- Angulos de copia (dor, desejo, urgencia)\n" +
        "- Frequencia de postagem de anuncios";
    }

    else if (low.match(/erro|errado|nao funciona|problema|travando|bug/)) {
      reply = "RESOLUCAO DE PROBLEMAS COMUNS:\n\n" +
        "1. ROAS BAIXO\n" +
        "   - Verifique o rastreamento do pixel\n" +
        "   - Confirme se as conversoes estao sendo registradas\n" +
        "   - Otimize o publico-alvo\n\n" +
        "2. POUCAS CONVERSOES\n" +
        "   - Teste a pagina de destino em dispositivos moveis\n" +
        "   - Verifique se o pixel esta carregando corretamente\n" +
        "   - Confira se nao ha erros no checkout\n\n" +
        "3. CUSTO ALTO POR CLIQUE\n" +
        "   - Refine o publico (menos amplo)\n" +
        "   - Melhore os criativos\n" +
        "   - Teste diferentes posicionamentos\n\n" +
        "4. ANUNCIO REJEITADO\n" +
        "   - Verifique as politicas do Meta Ads\n" +
        "   - Remova textos excessivos da imagem\n" +
        "   - Evite promessas exageradas\n\n" +
        "DICA: Sempre verifique o Gerenciador de Eventos do Pixel para confirmar que os dados estao corretos.";
    }

    else if (low.match(/pixel|rastreamento|tracking|evento|conversion/)) {
      reply = "GUIA DE PIXEL E RASTREAMENTO:\n\n" +
        "EVENTOS OBRIGATORIOS:\n" +
        "1. PageView - Quando carrega a pagina\n" +
        "2. ViewContent - Quando ve um produto\n" +
        "3. AddToCart - Quando adiciona ao carrinho\n" +
        "4. InitiateCheckout - Quando inicia o checkout\n" +
        "5. Purchase - Quando finaliza a compra\n\n" +
        "EVENTOS OPCIONAIS (MELHORAM OTIMIZACAO):\n" +
        "- AddToWishlist\n" +
        "- Search\n" +
        "- Contact\n" +
        "- Lead\n\n" +
        "VERIFICACAO:\n" +
        "1. Instale a Extensao Meta Pixel Helper\n" +
        "2. Navegue pelo site e confira os eventos\n" +
        "3. Use o Gerenciador de Eventos para ver os logs\n" +
        "4. Compare eventos do pixel com dados reais\n\n" +
        "ERRO COMUM: Confundir PageView com ViewContent. O ViewContent deve disparar apenas na pagina do produto.";
    }

    else if (low.match(/estrategia|plano|como comecar|iniciante|comeco/)) {
      reply = "PLANO DE ACAO PARA META ADS:\n\n" +
        "SEMANA 1 - ESTRUTURA\n" +
        "- Instalar e configurar o Pixel\n" +
        "- Configurar eventos de conversao\n" +
        "- Definir publicos-alvo\n\n" +
        "SEMANA 2 - TESTE\n" +
        "- Criar 3-5 campanhas de conversao\n" +
        "- R$ 30-50/dia por campanha\n" +
        "- 3 criativos por campanha\n" +
        "- Publico: Lookalike 1% + Interesse no nicho\n\n" +
        "SEMANA 3 - OTIMIZACAO\n" +
        "- Analise os resultados\n" +
        "- Pausar o que nao funciona\n" +
        "- Escalar o que funciona\n" +
        "- Ajustar publicos e criativos\n\n" +
        "SEMANA 4+ - ESCALA\n" +
        "- Aumentar orcamento dos vencedores\n" +
        "- Adicionar retargeting\n" +
        "- Testar novos angulos de criativo\n" +
        "- Expandir para novos publicos\n\n" +
        "ORCAMENTO INICIAL SUGERIDO: " + f(ctx.avgTicket * 2) + " a " + f(ctx.avgTicket * 5) + "/dia";
    }

    // ====== SAUDACOES ======
    else if (low.match(/^(oi|ola|hey|bom dia|boa tarde|boa noite|e ai|fala|salve)/)) {
      reply = "Ola! Sou a IA do No Verde, seu assistente de Meta Ads.\n\n" +
        "Posso te ajudar com:\n" +
        "- Analise completa das suas campanhas\n" +
        "- Identificar o que pausar e o que escalar\n" +
        "- Dicas de criativo, publico e estrategia\n" +
        "- Resolucao de problemas\n" +
        "- Planejamento de orcamento\n" +
        "- E muito mais!\n\n" +
        "Sua situacao atual: " + ctx.total + " campanhas, ROAS " + ctx.totalRoas.toFixed(2) + "x, " + f(ctx.granaNoBolso) + " de Grana no Bolso.\n\n" +
        "Pergunte o que quiser!";
    }

    else if (low.match(/obrigad|valeu|thanks|agradec/)) {
      reply = "Por nada! Estou aqui sempre que precisar. Boas vendas!";
    }

    // ====== FALLBACK INTELIGENTE ======
    else {
      const hasData = ctx.total > 0;
      reply = "Entendi sua pergunta! ";

      if (low.match(/meta|facebook|instagram|ads|anuncio/)) {
        reply += "Sobre Meta Ads, posso te ajudar com:\n" +
          "- Estrategia de campanhas\n" +
          "- Otimizacao de publico\n" +
          "- Criativos que convertem\n" +
          "- Configuracao de pixel\n" +
          "- Resolucao de problemas\n\n" +
          "Seja mais especifico: 'como melhorar o CTR' ou 'qual estrategia usar'";
      } else if (low.match(/venda|vender|lucro|dinheiro|faturar|receita/)) {
        reply += "Sobre vendas e lucro, aqui esta o panorama:\n\n" +
          "- Receita total: " + f(ctx.totalRevenue) + "\n" +
          "- Investido: " + f(ctx.totalSpent) + "\n" +
          "- Lucro (Grana no Bolso): " + f(ctx.granaNoBolso) + "\n" +
          "- ROAS: " + ctx.totalRoas.toFixed(2) + "x\n\n" +
          "Pergunte 'como escalar' ou 'quais pausar' para acoes concretas.";
      } else if (low.match(/ajuda|help|socorro|nao sei|como fa/)) {
        reply += "Posso te ajudar com varias coisas! Pergunte:\n\n" +
          "- 'Resumo geral' - visao completa\n" +
          "- 'Quais pausar?' - campanhas perdendo dinheiro\n" +
          "- 'Quais escalar?' - campanhas lucrativas\n" +
          "- 'Estrategia' - plano de acao\n" +
          "- 'Criativos' - dicas de anuncios\n" +
          "- 'Publico' - segmentacao\n" +
          "- 'Pixel' - rastreamento\n" +
          "- 'Orcamento' - quanto investir\n" +
          "- 'Horarios' - melhores dias e horas\n" +
          "- 'Concorrente' - como analisar\n" +
          "- 'Erros comuns' - resolucao de problemas";
      } else {
        reply += "Aqui esta o resumo rapido das suas campanhas:\n\n" +
          "- " + ctx.total + " campanhas (" + ctx.active + " ativas)\n" +
          "- Investido: " + f(ctx.totalSpent) + "\n" +
          "- Receita: " + f(ctx.totalRevenue) + "\n" +
          "- ROAS: " + ctx.totalRoas.toFixed(2) + "x\n" +
          "- Grana no Bolso: " + f(ctx.granaNoBolso) + "\n\n" +
          "Para analises especificas, pergunte sobre: resumo, pausar, escalar, ROAS, CTR, CPA, funil, ticket, publico, criativos, pixel, orcamento, horarios, estrategia, concorrentes ou erros.";
      }
    }

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("Chat error", e);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}