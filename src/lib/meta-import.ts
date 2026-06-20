// Parser para dados colados/exportados do Gerenciador de Anúncios da Meta.
// Aceita TSV (tab) ou CSV (vírgula/ponto-e-vírgula). tolerante a variações de nome de coluna.
import { META_FIELD_MAP, NUMERIC_FIELDS, EMPTY_ROW, type CampaignRow } from "./campaign-types";
import { computeGranaNoBolso, computeRoas } from "./metrics";

// Normaliza string: minúscula, sem acentos, espaços colapsados
function norm(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const NORMALIZED_MAP: { normLabel: string; key: keyof CampaignRow }[] = META_FIELD_MAP.map((f) => ({
  normLabel: norm(f.label),
  key: f.key,
}));

// Detecta o delimitador predominante
function detectDelimiter(line: string): string {
  const tabs = (line.match(/\t/g) || []).length;
  const semis = (line.match(/;/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  if (tabs >= semis && tabs >= commas) return "\t";
  if (semis > commas) return ";";
  return ",";
}

// Quebra uma linha respeitando aspas
function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      out.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

// Converte valor brasileiro ("1.234,56" ou "1234.56") para número
function parseNumber(raw: string): number {
  if (!raw) return 0;
  let s = raw.replace(/[R$\s%]/g, "").trim();
  if (s === "" || s === "-" || s === "--") return 0;
  // Se tem vírgula e ponto: assume BR (1.234,56)
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    // só vírgula: assume decimal BR
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export type ParseResult = {
  rows: CampaignRow[];
  detectedColumns: Record<string, string>; // campo interno -> nome original detectado
  skipped: number;
  totalLines: number;
};

export function parseMetaExport(input: string): ParseResult {
  const text = (input || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!text) return { rows: [], detectedColumns: {}, skipped: 0, totalLines: 0 };

  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], detectedColumns: {}, skipped: 0, totalLines: 0 };

  const headerLine = lines[0];
  const delim = detectDelimiter(headerLine);
  const headers = splitLine(headerLine, delim).map(norm);

  // Mapear índices: qual coluna da planilha corresponde a qual campo interno
  const colIndexByKey: Partial<Record<keyof CampaignRow, number>> = {};
  const detectedColumns: Record<string, string> = {};
  headers.forEach((h, i) => {
    const match = NORMALIZED_MAP.find((m) => m.normLabel === h || h.includes(m.normLabel) || m.normLabel.includes(h));
    if (match) {
      colIndexByKey[match.key] = i;
      detectedColumns[match.key as string] = headers[i] ?? META_FIELD_MAP.find((f) => f.key === match.key)?.label ?? "";
    }
  });

  const rows: CampaignRow[] = [];
  let skipped = 0;

  for (let li = 1; li < lines.length; li++) {
    const cells = splitLine(lines[li], delim);
    // Precisa pelo menos do nome da campanha
    const nameIdx = colIndexByKey.name;
    const name = nameIdx !== undefined ? cells[nameIdx] : "";
    if (!name) { skipped++; continue; }

    const row: CampaignRow = { ...EMPTY_ROW };
    (Object.keys(colIndexByKey) as (keyof CampaignRow)[]).forEach((key) => {
      const idx = colIndexByKey[key]!;
      const raw = cells[idx] ?? "";
      if (key === "name" || key === "delivery" || key === "actions") {
        (row[key] as string) = raw;
      } else if (NUMERIC_FIELDS.includes(key)) {
        (row[key] as number) = parseNumber(raw);
      }
    });

    // Defaults sensatos
    if (!row.delivery) row.delivery = "Ativa";

    // Recomputa métricas derivadas quando ausentes
    if (!row.granaNoBolso) row.granaNoBolso = computeGranaNoBolso(row);
    if (!row.roasPurchases) row.roasPurchases = computeRoas(row);
    if (!row.costPerPurchase && row.purchases > 0) row.costPerPurchase = row.spent / row.purchases;
    if (!row.costPerLandingPageView && row.landingPageViews > 0) row.costPerLandingPageView = row.spent / row.landingPageViews;
    if (!row.costPerCheckoutInitiated && row.checkoutInitiated > 0) row.costPerCheckoutInitiated = row.spent / row.checkoutInitiated;

    rows.push(row);
  }

  return { rows, detectedColumns, skipped, totalLines: lines.length };
}

// Gera dados de exemplo realistas para demonstração/seed
export function generateSampleCampaigns(): CampaignRow[] {
  const samples: Partial<CampaignRow>[] = [
    { name: "Promo Verão - Look Completo", delivery: "Ativa", actions: "Conversões", budget: 200, spent: 187.5, ctr: 2.4, purchases: 14, purchaseConversionValue: 2310, landingPageViews: 980, checkoutInitiated: 38, costPerPurchase: 13.4 },
    { name: "Coleção Inverno - Remarketing", delivery: "Ativa", actions: "Conversões", budget: 150, spent: 142.0, ctr: 3.1, purchases: 9, purchaseConversionValue: 1640, landingPageViews: 540, checkoutInitiated: 22, costPerPurchase: 15.8 },
    { name: "Lançamento Tênis Runner Pro", delivery: "Ativa", actions: "Conversões", budget: 500, spent: 488.9, ctr: 1.2, purchases: 6, purchaseConversionValue: 1790, landingPageViews: 1450, checkoutInitiated: 41, costPerPurchase: 81.5 },
    { name: "Black Friday - Acessórios", delivery: "Ativa", actions: "Conversões", budget: 300, spent: 295.0, ctr: 1.8, purchases: 11, purchaseConversionValue: 1980, landingPageViews: 870, checkoutInitiated: 33, costPerPurchase: 26.8 },
    { name: "Lookbook Primavera - Topo", delivery: "Ativa", actions: "Conversões", budget: 250, spent: 241.0, ctr: 0.8, purchases: 3, purchaseConversionValue: 540, landingPageViews: 1620, checkoutInitiated: 19, costPerPurchase: 80.3 },
    { name: "Outlet Calçados - 70% OFF", delivery: "Ativa", actions: "Conversões", budget: 180, spent: 176.5, ctr: 2.9, purchases: 13, purchaseConversionValue: 2120, landingPageViews: 760, checkoutInitiated: 30, costPerPurchase: 13.6 },
    { name: "Campanha Teste Criativo B", delivery: "Pausada", actions: "Conversões", budget: 100, spent: 95.0, ctr: 0.6, purchases: 1, purchaseConversionValue: 120, landingPageViews: 980, checkoutInitiated: 8, costPerPurchase: 95.0 },
    { name: "Coleção Casual - Escalar", delivery: "Ativa", actions: "Conversões", budget: 220, spent: 60.0, ctr: 1.6, purchases: 4, purchaseConversionValue: 760, landingPageViews: 410, checkoutInitiated: 12, costPerPurchase: 15.0 },
  ];

  return samples.map((s) => {
    const spent = s.spent || 0;
    const rev = s.purchaseConversionValue || 0;
    const purchases = s.purchases || 0;
    const views = s.landingPageViews || 0;
    const checkout = s.checkoutInitiated || 0;
    const row: CampaignRow = {
      ...EMPTY_ROW,
      ...s,
      granaNoBolso: rev - spent,
      roasPurchases: spent > 0 ? rev / spent : 0,
      costPerPurchase: s.costPerPurchase ?? (purchases > 0 ? spent / purchases : 0),
      costPerLandingPageView: views > 0 ? spent / views : 0,
      costPerCheckoutInitiated: checkout > 0 ? spent / checkout : 0,
      purchasesSite: purchases,
      checkoutInitiatedSite: checkout,
      landingPageViewsSite: views,
      purchaseConversionValueSite: rev,
      roasPurchasesSite: spent > 0 ? rev / spent : 0,
    } as CampaignRow;
    return row;
  });
}
