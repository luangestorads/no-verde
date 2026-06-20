"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fmtBRL, fmtNumber } from "@/lib/metrics";
import type { CampaignRow } from "@/lib/campaign-types";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  Cell, PieChart, Pie, ComposedChart, Line,
} from "recharts";

const CHART_COLORS = {
  spent: "oklch(0.646 0.222 41.116)",       // laranja
  revenue: "oklch(0.6 0.118 184.704)",      // verde-água
  grana: "oklch(0.769 0.188 70.08)",        // âmbar
  positive: "oklch(0.696 0.17 162.48)",     // verde
  negative: "oklch(0.577 0.245 27.325)",    // vermelho
};

function shortName(name: string, max = 16): string {
  if (!name) return "—";
  return name.length > max ? name.slice(0, max - 1) + "…" : name;
}

function BRLTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-xs">
      <div className="font-medium mb-1.5">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium tabular-nums">{fmtBRL(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function ChartsPanel({ campaigns }: { campaigns: CampaignRow[] }) {
  if (campaigns.length === 0) return null;

  // Dados: top campanhas por grana (máx 8 para legibilidade)
  const barData = [...campaigns]
    .sort((a, b) => (b.granaNoBolso || 0) - (a.granaNoBolso || 0))
    .slice(0, 8)
    .map((c) => ({
      name: shortName(c.name),
      Investido: Math.round(c.spent || 0),
      Receita: Math.round(c.purchaseConversionValue || 0),
      "Grana No Bolso": Math.round(c.granaNoBolso || 0),
    }));

  // Funil agregado
  const funnelData = [
    { stage: "Views", value: sum(campaigns, "landingPageViews"), color: CHART_COLORS.spent },
    { stage: "Checkout", value: sum(campaigns, "checkoutInitiated"), color: CHART_COLORS.grana },
    { stage: "Compras", value: sum(campaigns, "purchases"), color: CHART_COLORS.revenue },
  ];

  // Distribuição de ROAS
  const buckets = [
    { name: "< 1x (prejuízo)", count: 0, color: CHART_COLORS.negative },
    { name: "1–2x", count: 0, color: CHART_COLORS.spent },
    { name: "2–3x", count: 0, color: CHART_COLORS.grana },
    { name: "> 3x (lucro)", count: 0, color: CHART_COLORS.positive },
  ];
  campaigns.forEach((c) => {
    const r = c.roasPurchases || 0;
    if (r < 1) buckets[0].count++;
    else if (r < 2) buckets[1].count++;
    else if (r < 3) buckets[2].count++;
    else buckets[3].count++;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Investido vs Receita vs Grana */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Investido × Receita × Grana No Bolso</CardTitle>
          <CardDescription className="text-xs">Top campanhas por lucro líquido</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} className="fill-muted-foreground" />
                <YAxis tickFormatter={(v) => fmtBRL(v, { compact: true })} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip content={<BRLTooltip />} cursor={{ fill: "oklch(0.97 0 0 / 0.5)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Investido" fill={CHART_COLORS.spent} radius={[3, 3, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Receita" fill={CHART_COLORS.revenue} radius={[3, 3, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Grana No Bolso" fill={CHART_COLORS.grana} radius={[3, 3, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição ROAS */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribuição de ROAS</CardTitle>
          <CardDescription className="text-xs">Quantas campanhas em cada faixa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={buckets.filter((b) => b.count > 0)}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {buckets.filter((b) => b.count > 0).map((b, i) => (
                    <Cell key={i} fill={b.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                  formatter={(v: number, n: string) => [`${fmtNumber(v)} campanhas`, n]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Funil */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Funil de conversão agregado</CardTitle>
          <CardDescription className="text-xs">Visualizações → Checkouts iniciados → Compras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={funnelData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tickFormatter={(v) => fmtNumber(v)} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                  formatter={(v: number, n: string) => [fmtNumber(v), n === "value" ? "Conversões" : n]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={120}>
                  {funnelData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
                <Line type="monotone" dataKey="value" stroke="oklch(0.398 0.07 227.392)" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <FunnelStat label="Views → Checkout" value={rate(campaigns, "landingPageViews", "checkoutInitiated")} />
            <FunnelStat label="Checkout → Compra" value={rate(campaigns, "checkoutInitiated", "purchases")} />
            <FunnelStat label="Views → Compra" value={rate(campaigns, "landingPageViews", "purchases")} />
            <FunnelStat label="Ticket médio" value={fmtBRL(avgTicket(campaigns))} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FunnelStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function sum(rows: CampaignRow[], key: keyof CampaignRow): number {
  return rows.reduce((a, r) => a + ((r[key] as number) || 0), 0);
}
function rate(rows: CampaignRow[], from: keyof CampaignRow, to: keyof CampaignRow): string {
  const f = sum(rows, from);
  const t = sum(rows, to);
  if (f === 0) return "—";
  return `${((t / f) * 100).toFixed(1)}%`;
}
function avgTicket(rows: CampaignRow[]): number {
  const rev = sum(rows, "purchaseConversionValue");
  const pur = sum(rows, "purchases");
  return pur > 0 ? rev / pur : 0;
}
