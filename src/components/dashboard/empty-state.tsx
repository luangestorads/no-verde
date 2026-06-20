"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, Upload, Database } from "lucide-react";

export function EmptyState({
  onSeed,
  onImport,
}: {
  onSeed: () => void;
  onImport: () => void;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-14 px-6 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
          <PiggyBank className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold">Bem-vindo ao No Verde</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
          Aqui você descobre exatamente quais campanhas estão te dando lucro
          e o que fazer com as que estão te fazendo perder dinheiro.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
          <Button onClick={onImport} size="lg" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar meus dados do Meta Ads
          </Button>
          <Button variant="outline" onClick={onSeed} size="lg" className="gap-2">
            <Database className="h-4 w-4" />
            Ver com dados de exemplo
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-5">
          Cola os dados do Gerenciador de Anúncios que a gente reconhece as colunas sozinho.
        </p>
      </CardContent>
    </Card>
  );
}
