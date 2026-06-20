import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toRow } from "@/lib/serialize";
import { summarize } from "@/lib/metrics";

// POST /api/insights/ai
// Gera uma análise estratégica em linguagem natural via LLM (z-ai-web-dev-sdk).
// Body opcional: { question?: string } — pergunta livre do usuário sobre os dados.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const question: string | undefined = typeof body?.question === "string" && body.question.trim() ? body.question.trim() : undefined;

    const campaigns = await db.campaign.findMany();
    const rows = campaigns.map(toRow);
    const summary = summarize(rows);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Nenhuma campanha cadastrada. Importe ou popule dados de exemplo primeiro." }, { status: 400 });
    }

    // Compacta os dados para o prompt (apenas métricas-chave para economizar contexto)
    const compact = rows.map((r) => ({
      nome: r.name,
      veiculacao: r.delivery,
      valor_usado: r.spent,
      receita: r.purchaseConversionValue,
      roas: Number(r.roasPurchases.toFixed(2)),
      ctr: Number(r.ctr.toFixed(2)),
      compras: r.purchases,
      cpa: Number(r.costPerPurchase.toFixed(2)),
      checkout_iniciado: r.checkoutInitiated,
      views: r.landingPageViews,
      grana_no_bolso: Number(r.granaNoBolso.toFixed(2)),
    }));

    const systemPrompt = `Você é um analista sênior de performance de Meta Ads (Facebook/Instagram Ads) focado em e-commerce brasileiro.
Sua especialidade é transformar métricas em decisões acionáveis que maximizem a "Grana No Bolso" (lucro líquido = receita de conversão − valor investido em ads).
Regras:
- Use linguagem direta, prática e em português do Brasil.
- Cite nomes de campanhas específicas ao dar recomendações.
- Priorize ações por impacto financeiro (maior grana no bolso primeiro).
- Diferencie campanhas para ESCALAR (ROAS alto) das para PAUSAR/REDUZIR (ROAS < 1).
- Quando relevante, comente sobre criativo, público, leilão, página de destino e funil (views → checkout → compra).
- Seja específico em valores (R$) e percentuais.
- Estruture a resposta em seções curtas com títulos em negosto markdown (**Título**).`;

    const dataBlock = `DADOS DAS CAMPANHAS (JSON):\n${JSON.stringify(compact, null, 2)}\n\nRESUMO GERAL:\n- Campanhas: ${summary.count} (${summary.activeCount} ativas)\n- Investido: R$ ${summary.totalSpent.toFixed(2)}\n- Receita: R$ ${summary.totalRevenue.toFixed(2)}\n- Grana No Bolso: R$ ${summary.totalGranaNoBolso.toFixed(2)}\n- ROAS médio: ${summary.avgRoas.toFixed(2)}x\n- CTR médio: ${summary.avgCtr.toFixed(2)}%\n- Compras: ${summary.totalPurchases}\n- CPA médio: R$ ${summary.avgCostPerPurchase.toFixed(2)}`;

    const userPrompt = question
      ? `${dataBlock}\n\nPERGUNTA DO USUÁRIO: ${question}\n\nResponda de forma objetiva e acionável.`
      : `${dataBlock}\n\nGere um diagnóstico estratégico com:\n1. **Visão Geral** — saúde geral da conta em 2-3 linhas\n2. **Campanhas para Escalar** — quais aumentar e por quê\n3. **Campanhas para Pausar/Reduzir** — quais cortar e por quê\n4. **Gargalos de Funil** — onde está perdendo conversão\n5. **Top 3 Ações Imediatas** — priorizadas por impacto na Grana No Bolso`;

    // z-ai-web-dev-sdk só no backend
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
