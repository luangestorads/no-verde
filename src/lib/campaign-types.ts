export type ProductRow = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  orderBumpName?: string | null;
  orderBumpPrice: number;
  upsellName?: string | null;
  upsellPrice: number;
  downsellName?: string | null;
  downsellPrice: number;
  url?: string | null;
};

export type CampaignRow = {
  id?: string;
  productId?: string | null;
  product?: ProductRow | null;
  name: string;
  delivery: string;
  actions: string;
  budget: number;
  spent: number;
  ctr: number;
  checkoutInitiated: number;
  checkoutInitiatedApp: number;
  checkoutInitiatedSite: number;
  checkoutInitiatedOffline: number;
  checkoutInitiatedMeta: number;
  landingPageViews: number;
  landingPageViewsApp: number;
  landingPageViewsSite: number;
  purchases: number;
  purchasesApp: number;
  purchasesSite: number;
  purchasesOffline: number;
  purchasesMeta: number;
  costPerLandingPageView: number;
  costPerCheckoutInitiated: number;
  costPerPurchase: number;
  purchaseConversionValue: number;
  purchaseConversionValueApp: number;
  purchaseConversionValueSite: number;
  purchaseConversionValueOffline: number;
  purchaseConversionValueMeta: number;
  roasPurchases: number;
  roasPurchasesSite: number;
  roasPurchasesApp: number;
  granaNoBolso: number;
};

export const META_FIELD_MAP: { label: string; key: keyof CampaignRow }[] = [
  { label: "Campanha", key: "name" },
  { label: "Nome do anuncio", key: "name" },
  { label: "Veiculacao", key: "delivery" },
  { label: "Acoes", key: "actions" },
  { label: "Orcamento", key: "budget" },
  { label: "Valor usado", key: "spent" },
  { label: "CTR (todos)", key: "ctr" },
  { label: "Finalizacoes de compra iniciadas", key: "checkoutInitiated" },
  { label: "Finalizacoes de compra iniciadas no app para celular", key: "checkoutInitiatedApp" },
  { label: "Finalizacoes da compra iniciadas no site", key: "checkoutInitiatedSite" },
  { label: "Finalizacoes da compra iniciadas offline", key: "checkoutInitiatedOffline" },
  { label: "Finalizacoes da compra iniciadas na Meta", key: "checkoutInitiatedMeta" },
  { label: "Visualizacoes da pagina de destino", key: "landingPageViews" },
  { label: "Visualizacoes da pagina de destino do app", key: "landingPageViewsApp" },
  { label: "Visualizacoes da pagina de destino do site", key: "landingPageViewsSite" },
  { label: "Compras", key: "purchases" },
  { label: "Compras no app", key: "purchasesApp" },
  { label: "Compras no site", key: "purchasesSite" },
  { label: "Compras offline", key: "purchasesOffline" },
  { label: "Compras na Meta", key: "purchasesMeta" },
  { label: "Custo por visualizacao da pagina de destino", key: "costPerLandingPageView" },
  { label: "Custo por finalizacao de compra iniciada", key: "costPerCheckoutInitiated" },
  { label: "Custo por compra", key: "costPerPurchase" },
  { label: "Valor de conversao da compra", key: "purchaseConversionValue" },
  { label: "Valor de conversao das compras no app", key: "purchaseConversionValueApp" },
  { label: "Valor de conversao da compra no site", key: "purchaseConversionValueSite" },
  { label: "Valor de conversao de compras offline", key: "purchaseConversionValueOffline" },
  { label: "Valor de conversao da compra na Meta", key: "purchaseConversionValueMeta" },
  { label: "ROAS (retorno sobre o investimento em publicidade) das compras", key: "roasPurchases" },
  { label: "ROAS (retorno sobre o investimento em publicidade) das compras no site", key: "roasPurchasesSite" },
  { label: "Retorno sobre o investimento em publicidade (ROAS) das compras no app", key: "roasPurchasesApp" },
  { label: "Grana No Bolso", key: "granaNoBolso" },
];

export const NUMERIC_FIELDS: (keyof CampaignRow)[] = [
  "budget", "spent", "ctr",
  "checkoutInitiated", "checkoutInitiatedApp", "checkoutInitiatedSite", "checkoutInitiatedOffline", "checkoutInitiatedMeta",
  "landingPageViews", "landingPageViewsApp", "landingPageViewsSite",
  "purchases", "purchasesApp", "purchasesSite", "purchasesOffline", "purchasesMeta",
  "costPerLandingPageView", "costPerCheckoutInitiated", "costPerPurchase",
  "purchaseConversionValue", "purchaseConversionValueApp", "purchaseConversionValueSite", "purchaseConversionValueOffline", "purchaseConversionValueMeta",
  "roasPurchases", "roasPurchasesSite", "roasPurchasesApp",
  "granaNoBolso",
];

export const EMPTY_ROW: CampaignRow = {
  name: "",
  productId: null,
  product: null,
  delivery: "Ativa",
  actions: "",
  budget: 0,
  spent: 0,
  ctr: 0,
  checkoutInitiated: 0,
  checkoutInitiatedApp: 0,
  checkoutInitiatedSite: 0,
  checkoutInitiatedOffline: 0,
  checkoutInitiatedMeta: 0,
  landingPageViews: 0,
  landingPageViewsApp: 0,
  landingPageViewsSite: 0,
  purchases: 0,
  purchasesApp: 0,
  purchasesSite: 0,
  purchasesOffline: 0,
  purchasesMeta: 0,
  costPerLandingPageView: 0,
  costPerCheckoutInitiated: 0,
  costPerPurchase: 0,
  purchaseConversionValue: 0,
  purchaseConversionValueApp: 0,
  purchaseConversionValueSite: 0,
  purchaseConversionValueOffline: 0,
  purchaseConversionValueMeta: 0,
  roasPurchases: 0,
  roasPurchasesSite: 0,
  roasPurchasesApp: 0,
  granaNoBolso: 0,
};