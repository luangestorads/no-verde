// Serialização: Prisma Campaign <-> CampaignRow
import type { Campaign, Product } from "@prisma/client";
import type { CampaignRow, ProductRow } from "@/lib/campaign-types";
import { computeGranaNoBolso, computeRoas } from "@/lib/metrics";

export function toProductRow(p: Product): ProductRow {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    orderBumpName: p.orderBumpName,
    orderBumpPrice: p.orderBumpPrice,
    upsellName: p.upsellName,
    upsellPrice: p.upsellPrice,
    downsellName: p.downsellName,
    downsellPrice: p.downsellPrice,
    url: p.url,
  };
}

export function toRow(c: Campaign & { product?: Product | null }): CampaignRow {
  const row: CampaignRow = {
    id: c.id,
    productId: c.productId,
    product: c.product ? toProductRow(c.product) : null,
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
