import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toRow } from "@/lib/serialize";
import { analyzeAll, type Recommendation } from "@/lib/optimizer";
import { summarize, type Summary } from "@/lib/metrics";

// GET /api/insights — recomendações baseadas em regras + resumo geral
export async function GET() {
  try {
    const campaigns = await db.campaign.findMany();
    const rows = campaigns.map(toRow);
    const recommendations: Recommendation[] = analyzeAll(rows);
    const summary: Summary = summarize(rows);

    const counts = {
      critico: recommendations.filter((r) => r.severity === "critico").length,
      alerta: recommendations.filter((r) => r.severity === "alerta").length,
      oportunidade: recommendations.filter((r) => r.severity === "oportunidade").length,
      bom: recommendations.filter((r) => r.severity === "bom").length,
    };

    // Potencial financeiro: soma dos impactos positivos das oportunidades
    const upside = recommendations
      .filter((r) => r.action === "aumentar_orcamento" || r.action === "otimizar_leilao")
      .reduce((a, r) => a + Math.max(0, r.impact), 0);

    // Risco: prejuízo atual em campanhas críticas
    const risk = recommendations
      .filter((r) => r.severity === "critico")
      .reduce((a, r) => a + Math.max(0, r.impact), 0);

    return NextResponse.json({ recommendations, summary, counts, upside, risk });
  } catch (e) {
    console.error("GET /api/insights error", e);
    return NextResponse.json({ error: "Falha ao gerar insights" }, { status: 500 });
  }
}
