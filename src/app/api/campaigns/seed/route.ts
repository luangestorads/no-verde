import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toRow } from "@/lib/serialize";
import { generateSampleCampaigns } from "@/lib/meta-import";

// POST /api/campaigns/seed — popula o banco com dados de exemplo
export async function POST() {
  try {
    const samples = generateSampleCampaigns();
    const existing = await db.campaign.findMany({ select: { name: true } });
    const existingNames = new Set(existing.map((c) => c.name.trim().toLowerCase()));

    let created = 0;
    const rows = [];
    for (const row of samples) {
      if (existingNames.has(row.name.trim().toLowerCase())) continue;
      const c = await db.campaign.create({
        data: {
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
