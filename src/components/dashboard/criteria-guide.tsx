"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CRITERIOS_EXPLICADOS } from "@/lib/optimizer";
import { MousePointerClick, Eye, ShoppingCart, Tag, TrendingUp, Lightbulb } from "lucide-react";

const ICONS = [
  <MousePointerClick key="1" className="h-4 w-4" />,
  <Eye key="2" className="h-4 w-4" />,
  <ShoppingCart key="3" className="h-4 w-4" />,
  <Tag key="4" className="h-4 w-4" />,
  <TrendingUp key="5" className="h-4 w-4" />,
];

export function CriteriaGuide() {
  return (
    <Card className="border-dashed bg-muted/20">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold">Como o sistema julga cada campanha</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Baseado nos critérios de um grande player de Meta Ads. Cada métrica recebe um sinal: <span className="text-emerald-600 dark:text-emerald-400 font-medium">verde</span> (bom), <span className="text-amber-600 dark:text-amber-400 font-medium">amarelo</span> (atenção) ou <span className="text-red-600 dark:text-red-400 font-medium">vermelho</span> (ruim).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {CRITERIOS_EXPLICADOS.map((c, i) => (
            <div key={i} className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {ICONS[i]}
                </span>
                <span className="text-sm font-medium">{c.titulo}</span>
              </div>
              <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-1">{c.regra}</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{c.explicacao}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
