"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Send, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SUGGESTED = [
  "Quais campanhas eu PAUSO hoje?",
  "Onde estou perdendo mais dinheiro?",
  "Qual campanha merece MAIS dinheiro?",
  "Meu anúncio ou minha página é o problema?",
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
        setError(data?.error || "Não consegui gerar a análise");
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
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              Analista de IA
              <Badge variant="secondary" className="text-[10px]">LLM</Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Pergunte qualquer coisa sobre suas campanhas e receba uma resposta simples e direta
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ação principal */}
        <Button onClick={() => run("")} disabled={loading || disabled} className="w-full gap-2 h-11">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Gerar diagnóstico completo
        </Button>

        {/* Sugestões */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <Button key={s} variant="outline" size="sm" onClick={() => run(s)} disabled={loading || disabled} className="text-xs">
              {s}
            </Button>
          ))}
        </div>

        {/* Pergunta livre */}
        <div className="relative">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ou escreva sua própria pergunta… (ex.: quanto eu ganho se dobrar o dinheiro da Promo Verão?)"
            className="min-h-[70px] text-sm resize-none pr-24"
            aria-label="Pergunta para a IA"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                run();
              }
            }}
          />
          <Button
            onClick={() => run()}
            disabled={loading || disabled || !question.trim()}
            size="sm"
            className="absolute right-2 bottom-2 gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Perguntar
          </Button>
        </div>

        {disabled && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            Carregue ou importe campanhas para liberar a IA.
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900 p-3 bg-red-50 dark:bg-red-950/30">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              A IA está analisando suas campanhas…
            </div>
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
          </div>
        )}

        {content && !loading && (
          <div className="rounded-xl border bg-card p-4 sm:p-5">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-base font-bold mt-4 mb-2 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mt-4 mb-2 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1.5">{children}</h3>,
                p: ({ children }) => <p className="text-sm leading-relaxed my-2">{children}</p>,
                ul: ({ children }) => <ul className="text-sm list-disc pl-5 my-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="text-sm list-decimal pl-5 my-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
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
