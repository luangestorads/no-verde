import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toRow } from "@/lib/serialize";
import { analyzeAll, type Recommendation } from "@/lib/optimizer";
import { summarize, type Summary } from "@/lib/metrics";
import { getUserId } from "@/lib/session";
import { resolveRange, type Period } from "@/lib/date-ranges";

// GET /api/insights?period=...&from=...&to=...
export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const url = new URL(req.url);
    const period = (url.searchParams.get("period") || "all") as Period;
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to") || undefined;
    const range = resolveRange(period, from, to);

    const campaigns = await db.campaign.findMany({
      where: {
        userId,
        ...(range ? { reportDate: { gte: range.from, lt: range.to } } : {}),
      },
      include: { product: true },
    });
    const rows = campaigns.map(toRow);
    const recommendations: Recommendation[] = analyzeAll(rows);
    const summary: Summary = summarize(rows);

    const counts = {
      critico: recommendations.filter((r) => r.severity === "critico").length,
      alerta: recommendations.filter((r) => r.severity === "alerta").length,
      oportunidade: recommendations.filter((r) => r.severity === "oportunidade").length,
      bom: recommendations.filter((r) => r.severity === "bom").length,
    };
    const upside = recommendations
      .filter((r) => r.action === "aumentar_orcamento" || r.action === "otimizar_leilao")
      .reduce((a, r) => a + Math.max(0, r.impact), 0);
    const risk = recommendations
      .filter((r) => r.severity === "critico")
      .reduce((a, r) => a + Math.max(0, r.impact), 0);

    return NextResponse.json({ recommendations, summary, counts, upside, risk });
  } catch (e) {
    console.error("GET /api/insights error", e);
    return NextResponse.json({ error: "Falha ao gerar insights" }, { status: 500 });
  }
}
