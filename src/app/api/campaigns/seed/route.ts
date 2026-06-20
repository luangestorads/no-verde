import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toRow } from "@/lib/serialize";
import { generateSampleCampaigns } from "@/lib/meta-import";
import { getUserId } from "@/lib/session";

// POST /api/campaigns/seed — cria campanhas de exemplo para o usuário logado,
// com datas variadas para os filtros de período funcionarem.
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const url = new URL(req.url);
    const daysBack = Number(url.searchParams.get("days") || "0");
    const reportDate = new Date();
    if (daysBack > 0) reportDate.setDate(reportDate.getDate() - daysBack);

    const samples = generateSampleCampaigns();
    const existing = await db.campaign.findMany({ where: { userId }, select: { name: true } });
    const existingNames = new Set(existing.map((c) => c.name.trim().toLowerCase()));

    let created = 0;
    const rows = [];
    for (const row of samples) {
      if (existingNames.has(row.name.trim().toLowerCase())) continue;
      const c = await db.campaign.create({
        data: {
          userId,
          reportDate,
          name: row.name,
          delivery: row.delivery,
          actions: row.actions,
          budget: row.budget,
          spent: row.spent,
          ctr: row.ctr,
          checkoutInitiated: row.checkoutInitiated,
          landingPageViews: row.landingPageViews,
          purchases: row.purchases,
          costPerLandingPageView: row.costPerLandingPageView,
          costPerCheckoutInitiated: row.costPerCheckoutInitiated,
          costPerPurchase: row.costPerPurchase,
          purchaseConversionValue: row.purchaseConversionValue,
          roasPurchases: row.roasPurchases,
          granaNoBolso: row.granaNoBolso,
          purchasesSite: row.purchasesSite,
          checkoutInitiatedSite: row.checkoutInitiatedSite,
          landingPageViewsSite: row.landingPageViewsSite,
          purchaseConversionValueSite: row.purchaseConversionValueSite,
          roasPurchasesSite: row.roasPurchasesSite,
        },
        include: { product: true },
      });
      rows.push(toRow(c));
      created++;
    }
    return NextResponse.json({ ok: true, created, campaigns: rows });
  } catch (e) {
    console.error("POST /api/campaigns/seed error", e);
    return NextResponse.json({ error: "Falha ao popular dados de exemplo" }, { status: 500 });
  }
}
