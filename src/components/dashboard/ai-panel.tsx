"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Send, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SUGGESTED = [
  "Quais campanhas devo pausar hoje?",
  "Onde estou perdendo mais dinheiro no funil?",
  "Qual campanha tem maior potencial de escala?",
  "Compare o desempenho entre site e app",
];

export function AiPanel({ disabled }: { disabled?: boolean }) {
  const [content, setContent] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(prompt?: string) {
    const q = (prompt ?? question).trim();
    setLoading(true);
    setError(null);
    setContent("");
    try {
      const res = await fetch("/api/insights/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(q ? { question: q } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Falha ao gerar análise");
      } else {
        setContent(data.content || "");
        if (prompt) setQuestion(prompt);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-base">Analista de IA</CardTitle>
          <Badge variant="secondary" className="text-[10px]">LLM</Badge>
        </div>
        <CardDescription className="text-xs">
          Diagnóstico estratégico das suas campanhas e respostas a perguntas livres sobre os dados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ações sugeridas */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => run("")} disabled={loading || disabled} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Gerar diagnóstico completo
          </Button>
          {SUGGESTED.map((s) => (
            <Button key={s} variant="outline" size="sm" onClick={() => run(s)} disabled={loading || disabled} className="text-xs">
              {s}
            </Button>
          ))}
        </div>

        {/* Pergunta livre */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Pergunte algo sobre suas campanhas… (ex.: quanto posso ganhar se dobrar o orçamento da Promo Verão?)"
            className="min-h-[60px] sm:min-h-[60px] text-sm resize-none"
            aria-label="Pergunta para a IA"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                run();
              }
            }}
          />
          <Button onClick={() => run()} disabled={loading || disabled || !question.trim()} className="sm:w-auto gap-2">
            <Send className="h-4 w-4" />
            Perguntar
          </Button>
        </div>

        {disabled && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            Importe ou crie campanhas para liberar a análise com IA.
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900 p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
          </div>
        )}

        {content && !loading && (
          <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border bg-muted/20 p-4">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1.5 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-1.5 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-2.5 mb-1">{children}</h3>,
                p: ({ children }) => <p className="text-sm leading-relaxed my-1.5">{children}</p>,
                ul: ({ children }) => <ul className="text-sm list-disc pl-5 my-1.5 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="text-sm list-decimal pl-5 my-1.5 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                code: ({ children }) => <code className="text-xs bg-muted px-1 py-0.5 rounded">{children}</code>,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
