// Serialização: Prisma Campaign <-> CampaignRow
import type { Campaign } from "@prisma/client";
import type { CampaignRow } from "@/lib/campaign-types";
import { computeGranaNoBolso, computeRoas } from "@/lib/metrics";

export function toRow(c: Campaign): CampaignRow {
  const row: CampaignRow = {
    id: c.id,
    name: c.name,
    delivery: c.delivery,
    actions: c.actions,
    budget: c.budget,
    spent: c.spent,
    ctr: c.ctr,
    checkoutInitiated: c.checkoutInitiated,
    checkoutInitiatedApp: c.checkoutInitiatedApp,
    checkoutInitiatedSite: c.checkoutInitiatedSite,
    checkoutInitiatedOffline: c.checkoutInitiatedOffline,
    checkoutInitiatedMeta: c.checkoutInitiatedMeta,
    landingPageViews: c.landingPageViews,
    landingPageViewsApp: c.landingPageViewsApp,
    landingPageViewsSite: c.landingPageViewsSite,
    purchases: c.purchases,
    purchasesApp: c.purchasesApp,
    purchasesSite: c.purchasesSite,
    purchasesOffline: c.purchasesOffline,
    purchasesMeta: c.purchasesMeta,
    costPerLandingPageView: c.costPerLandingPageView,
    costPerCheckoutInitiated: c.costPerCheckoutInitiated,
    costPerPurchase: c.costPerPurchase,
    purchaseConversionValue: c.purchaseConversionValue,
    purchaseConversionValueApp: c.purchaseConversionValueApp,
    purchaseConversionValueSite: c.purchaseConversionValueSite,
    purchaseConversionValueOffline: c.purchaseConversionValueOffline,
    purchaseConversionValueMeta: c.purchaseConversionValueMeta,
    roasPurchases: c.roasPurchases,
    roasPurchasesSite: c.roasPurchasesSite,
    roasPurchasesApp: c.roasPurchasesApp,
    granaNoBolso: c.granaNoBolso,
  };
  // Recomputa derivadas se zeradas (defensivo)
  if (!row.granaNoBolso) row.granaNoBolso = computeGranaNoBolso(row);
  if (!row.roasPurchases) row.roasPurchases = computeRoas(row);
  return row;
}
