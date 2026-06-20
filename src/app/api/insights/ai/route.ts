import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toRow } from "@/lib/serialize";
import { summarize, computeTicket, fmtBRL } from "@/lib/metrics";
import { CRITERIOS } from "@/lib/optimizer";

// POST /api/insights/ai
// Gera uma análise estratégica em linguagem simples via LLM (z-ai-web-dev-sdk),
// usando os critérios exatos de um grande player de Meta Ads.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const question: string | undefined = typeof body?.question === "string" && body.question.trim() ? body.question.trim() : undefined;

    const campaigns = await db.campaign.findMany();
    const rows = campaigns.map(toRow);
    const summary = summarize(rows);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Nenhuma campanha cadastrada. Importe ou carregue o exemplo primeiro." }, { status: 400 });
    }

    // Compacta os dados
    const compact = rows.map((r) => {
      const ticket = computeTicket(r);
      return {
        nome: r.name,
        veiculacao: r.delivery,
        valor_usado: r.spent,
        receita: r.purchaseConversionValue,
        grana_no_bolso: r.granaNoBolso,
        roas: Number(r.roasPurchases.toFixed(2)),
        ctr_pct: Number(r.ctr.toFixed(2)),
        views: r.landingPageViews,
        custo_por_view: Number((r.costPerLandingPageView || 0).toFixed(2)),
        checkouts: r.checkoutInitiated,
        custo_por_checkout: Number((r.costPerCheckoutInitiated || 0).toFixed(2)),
        compras: r.purchases,
        custo_por_compra: Number((r.costPerPurchase || 0).toFixed(2)),
        ticket_medio: Number(ticket.toFixed(2)),
        // % do ticket (critérios do player)
        custo_view_pct_ticket: ticket > 0 ? Number(((r.costPerLandingPageView / ticket) * 100).toFixed(1)) : 0,
        custo_checkout_pct_ticket: ticket > 0 ? Number(((r.costPerCheckoutInitiated / ticket) * 100).toFixed(1)) : 0,
        custo_compra_pct_ticket: ticket > 0 ? Number(((r.costPerPurchase / ticket) * 100).toFixed(1)) : 0,
      };
    });

    const systemPrompt = `Você é um analista sênior de performance de Meta Ads (Facebook/Instagram) para e-commerce brasileiro.
Você segue EXATAMENTE estes critérios de um grande player do mercado:

REGRAS DE OURO (use SEMPRE para julgar cada campanha):
1. CTR (cliques no anúncio): ACIMA DE 2% é essencial. Abaixo de 1% = anúncio ruim.
2. Custo por visualização da página: ideal até R$ 1,50 (ótimo abaixo de R$ 1,20). Máximo R$ 2,50. Não pode passar de 10% do preço do produto.
3. Custo para chegar no carrinho (checkout): SEMPRE abaixo de 10% do preço do produto. Se passar, a copy/oferta da página está ruim.
4. Custo de cada venda (CPA): abaixo de 60% do preço do produto. Até 30% é excelente.
5. ROAS: acima de 2,0x é MAGNÍFICO. Acima de 1,5x é ideal. Abaixo de 1,0x = perdendo dinheiro.

DIAGNÓSTICOS COMBINADOS IMPORTANTES:
- CTR alto (>2%) significa que as pessoas estão indo para o bot/oferta.
- Pouca gente vendo a página + custo por view alto = CRIATIVO RUIM (o anúncio não leva gente para a página).
- Se pagando mais de 20% do ticket para mostrar a página = criativo ruim.
- Muita gente vendo a página mas custo de checkout acima de 10% do ticket = COPY E OFERTA RUINS.
- Muita finalização de compra E barata = PERFEITO.

ESTILO DE RESPOSTA (MUITO IMPORTANTE):
- Escreva em português do Brasil, em linguagem SIMPLES, como se explicasse para uma pessoa leiga (pense: alguém que nunca estudou marketing).
- Use analogias do dia a dia. Ex.: "Cada R$ 1 que você colocou voltou R$ 2,30" em vez de só "ROAS 2,3x".
- SEMPRE cite o nome da campanha ao dar recomendação.
- Priorize ações por impacto no lucro (Grana No Bolso = Receita − Investido).
- Seja direto: diga exatamente O QUE FAZER (pause, aumente dinheiro, troque o anúncio, melhore a página).
- Use markdown com títulos em negrito (**Título**) e listas curtas.
- Numere as ações por ordem de prioridade (1, 2, 3...).
- Para cada recomendação, mostre o valor em R$ quando possível.`;

    const dataBlock = `DADOS DAS CAMPANHAS (JSON, com ticket médio e % do ticket calculados):
${JSON.stringify(compact, null, 2)}

RESUMO GERAL:
- Campanhas: ${summary.count} (${summary.activeCount} ativas)
- Investido: ${fmtBRL(summary.totalSpent)}
- Receita: ${fmtBRL(summary.totalRevenue)}
- Grana No Bolso (lucro líquido): ${fmtBRL(summary.totalGranaNoBolso)}
- ROAS médio: ${summary.avgRoas.toFixed(2)}x
- CTR médio: ${summary.avgCtr.toFixed(2)}%
- Compras: ${summary.totalPurchases}
- Ticket médio: ${fmtBRL(summary.avgTicket)}
- Custo médio por venda: ${fmtBRL(summary.avgCostPerPurchase)}
- Custo médio por checkout: ${fmtBRL(summary.avgCostPerCheckout)}
- Custo médio por view: ${fmtBRL(summary.avgCostPerView)}`;

    const userPrompt = question
      ? `${dataBlock}\n\nPERGUNTA DO USUÁRIO: ${question}\n\nResponda de forma simples e direta, citando campanhas por nome e valores em R$.`
      : `${dataBlock}\n\nGere um diagnóstico estratégico com estas seções (linguagem simples, como se explicasse para leigo):

1. **Resumo** — a conta está saudável ou tem problema? (2-3 frases)
2. **Campanhas para colocar MAIS dinheiro** — quais estão dando lucro e merecem crescer, e por quê
3. **Campanhas para PAUSAR ou diminuir** — quais estão perdendo dinheiro, e por quê
4. **Onde está o gargalo** — explique em qual etapa (anúncio, página, carrinho, compra) está perdendo mais gente
5. **Top 3 ações para hoje** — numeradas por ordem de impacto no lucro, com valor em R$ estimado`;

    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
    });
    const content = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ content, question });
  } catch (e) {
    console.error("POST /api/insights/ai error", e);
    const msg = e instanceof Error ? e.message : "Falha ao gerar análise com IA";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
