import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toRow } from "@/lib/serialize";
import { computeGranaNoBolso, computeRoas } from "@/lib/metrics";
import type { CampaignRow } from "@/lib/campaign-types";

// GET /api/campaigns — lista todas as campanhas
export async function GET() {
  try {
    const campaigns = await db.campaign.findMany({ orderBy: { granaNoBolso: "desc" } });
    const rows = campaigns.map(toRow);
    return NextResponse.json({ campaigns: rows });
  } catch (e) {
    console.error("GET /api/campaigns error", e);
    return NextResponse.json({ error: "Falha ao listar campanhas", campaigns: [] }, { status: 500 });
  }
}

// POST /api/campaigns — cria uma campanha
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CampaignRow>;
    const data = {
      name: body.name?.trim() || "Nova Campanha",
      delivery: body.delivery || "Ativa",
      actions: body.actions || "Conversões",
      budget: num(body.budget),
      spent: num(body.spent),
      ctr: num(body.ctr),
      checkoutInitiated: num(body.checkoutInitiated),
      checkoutInitiatedApp: num(body.checkoutInitiatedApp),
      checkoutInitiatedSite: num(body.checkoutInitiatedSite),
      checkoutInitiatedOffline: num(body.checkoutInitiatedOffline),
      checkoutInitiatedMeta: num(body.checkoutInitiatedMeta),
      landingPageViews: num(body.landingPageViews),
      landingPageViewsApp: num(body.landingPageViewsApp),
      landingPageViewsSite: num(body.landingPageViewsSite),
      purchases: num(body.purchases),
      purchasesApp: num(body.purchasesApp),
      purchasesSite: num(body.purchasesSite),
      purchasesOffline: num(body.purchasesOffline),
      purchasesMeta: num(body.purchasesMeta),
      costPerLandingPageView: num(body.costPerLandingPageView),
      costPerCheckoutInitiated: num(body.costPerCheckoutInitiated),
      costPerPurchase: num(body.costPerPurchase),
      purchaseConversionValue: num(body.purchaseConversionValue),
      purchaseConversionValueApp: num(body.purchaseConversionValueApp),
      purchaseConversionValueSite: num(body.purchaseConversionValueSite),
      purchaseConversionValueOffline: num(body.purchaseConversionValueOffline),
      purchaseConversionValueMeta: num(body.purchaseConversionValueMeta),
      roasPurchases: num(body.roasPurchases),
      roasPurchasesSite: num(body.roasPurchasesSite),
      roasPurchasesApp: num(body.roasPurchasesApp),
      granaNoBolso: num(body.granaNoBolso),
    };
    // Recomputa derivadas
    const rev = data.purchaseConversionValue;
    const spent = data.spent;
    if (!data.granaNoBolso) data.granaNoBolso = computeGranaNoBolso({ purchaseConversionValue: rev, spent });
    if (!data.roasPurchases) data.roasPurchases = computeRoas({ purchaseConversionValue: rev, spent });
    if (!data.costPerPurchase && data.purchases > 0) data.costPerPurchase = spent / data.purchases;
    if (!data.costPerLandingPageView && data.landingPageViews > 0) data.costPerLandingPageView = spent / data.landingPageViews;
    if (!data.costPerCheckoutInitiated && data.checkoutInitiated > 0) data.costPerCheckoutInitiated = spent / data.checkoutInitiated;

    const created = await db.campaign.create({ data });
    return NextResponse.json({ campaign: toRow(created) }, { status: 201 });
  } catch (e) {
    console.error("POST /api/campaigns error", e);
    return NextResponse.json({ error: "Falha ao criar campanha" }, { status: 500 });
  }
}

function num(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}
