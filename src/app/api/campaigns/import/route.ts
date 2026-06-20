import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toRow } from "@/lib/serialize";
import { parseMetaExport } from "@/lib/meta-import";
import { getUserId } from "@/lib/session";

// POST /api/campaigns/import
// Body: { raw: string, reportDate?: string } — texto/arquivo do Meta Ads Manager
// Cadastra as campanhas no nome do usuário logado. Se já existir (mesmo nome + mesmo dia), atualiza.
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const body = await req.json();
    const raw: string = typeof body?.raw === "string" ? body.raw : "";
    const reportDate = body?.reportDate ? new Date(body.reportDate) : new Date();
    if (!raw.trim()) {
      return NextResponse.json({ error: "Conteúdo vazio. Envie os dados exportados do Meta Ads." }, { status: 400 });
    }

    const { rows, detectedColumns, skipped, totalLines } = parseMetaExport(raw);
    if (rows.length === 0) {
      return NextResponse.json({
        error: "Nenhuma campanha detectada. Verifique se a primeira linha contém os nomes das colunas (Campanha, Valor usado, etc.).",
      }, { status: 400 });
    }

    // Apenas as campanhas DESTE usuário (para detectar duplicatas por nome + data)
    const existing = await db.campaign.findMany({ where: { userId }, include: { product: true } });
    const existingByName = new Map(existing.map((c) => [c.name.trim().toLowerCase(), c]));

    let created = 0;
    let updated = 0;
    const resultRows = [];

    for (const row of rows) {
      const data = {
        userId,
        reportDate,
        name: row.name,
        delivery: row.delivery,
        actions: row.actions,
        budget: row.budget,
        spent: row.spent,
        ctr: row.ctr,
        checkoutInitiated: row.checkoutInitiated,
        checkoutInitiatedApp: row.checkoutInitiatedApp,
        checkoutInitiatedSite: row.checkoutInitiatedSite,
        checkoutInitiatedOffline: row.checkoutInitiatedOffline,
        checkoutInitiatedMeta: row.checkoutInitiatedMeta,
        landingPageViews: row.landingPageViews,
        landingPageViewsApp: row.landingPageViewsApp,
        landingPageViewsSite: row.landingPageViewsSite,
        purchases: row.purchases,
        purchasesApp: row.purchasesApp,
        purchasesSite: row.purchasesSite,
        purchasesOffline: row.purchasesOffline,
        purchasesMeta: row.purchasesMeta,
        costPerLandingPageView: row.costPerLandingPageView,
        costPerCheckoutInitiated: row.costPerCheckoutInitiated,
        costPerPurchase: row.costPerPurchase,
        purchaseConversionValue: row.purchaseConversionValue,
        purchaseConversionValueApp: row.purchaseConversionValueApp,
        purchaseConversionValueSite: row.purchaseConversionValueSite,
        purchaseConversionValueOffline: row.purchaseConversionValueOffline,
        purchaseConversionValueMeta: row.purchaseConversionValueMeta,
        roasPurchases: row.roasPurchases,
        roasPurchasesSite: row.roasPurchasesSite,
        roasPurchasesApp: row.roasPurchasesApp,
        granaNoBolso: row.granaNoBolso,
      };

      const existingEntry = existingByName.get(row.name.trim().toLowerCase());
      if (existingEntry) {
        const c = await db.campaign.update({ where: { id: existingEntry.id }, data, include: { product: true } });
        resultRows.push(toRow(c));
        updated++;
      } else {
        const c = await db.campaign.create({ data, include: { product: true } });
        resultRows.push(toRow(c));
        created++;
      }
    }

    return NextResponse.json({
      ok: true,
      created,
      updated,
      skipped,
      totalLines,
      detectedColumns,
      campaigns: resultRows,
    });
  } catch (e) {
    console.error("POST /api/campaigns/import error", e);
    return NextResponse.json({ error: "Falha ao importar campanhas" }, { status: 500 });
  }
}
