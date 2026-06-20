"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, Upload, Database, Sparkles } from "lucide-react";

export function EmptyState({
  onSeed,
  onImport,
}: {
  onSeed: () => void;
  onImport: () => void;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 px-6 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center mb-4">
          <PiggyBank className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold">Nenhuma campanha ainda</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Importe os dados direto do Gerenciador de Anúncios da Meta ou carregue dados de exemplo
          para ver o otimizador em ação.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-5">
          <Button onClick={onImport} className="gap-2">
            <Upload className="h-4 w-4" />
            Importar Meta Ads
          </Button>
          <Button variant="outline" onClick={onSeed} className="gap-2">
            <Database className="h-4 w-4" />
            Carregar exemplo
          </Button>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-4">
          <Sparkles className="h-3 w-3" />
          O sistema detecta as colunas do Meta Ads automaticamente
        </div>
      </CardContent>
    </Card>
  );
}
