"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Sparkles, Trash2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Ola! Sou a IA do No Verde. Pergunte sobre suas campanhas, ROAS, CPA, CTR, funil de conversao ou pergunte 'resumo geral' para comecar." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: messages }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else if (data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: "Erro: " + data.error }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Falha ao conectar. Tente novamente." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const quickActions = [
    "Resumo geral",
    "Quais pausar?",
    "Quais escalar?",
    "Analisar ROAS",
    "Analisar funil",
  ];

  return (
    <Card className="border-border flex flex-col h-[500px]">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-verde-400" />
          Chat com IA
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => setMessages([{ role: "assistant", content: "Chat limpo! Pergunte sobre suas campanhas." }])}
          title="Limpar chat"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3">
          {messages.map((m, i) => (
            <div key={i} className={"flex gap-3 " + (m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-verde-500/20 border border-verde-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-verde-400" />
                </div>
              )}
              <div className={"max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line " + (m.role === "user" ? "bg-verde-500 text-white rounded-br-md" : "bg-muted rounded-bl-md")}>
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-verde-500/20 border border-verde-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-verde-400 animate-pulse" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-muted-foreground">
                Analisando...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {quickActions.map((a) => (
              <button
                key={a}
                onClick={() => { setInput(a); }}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-verde-500/10 hover:border-verde-500/30 hover:text-verde-400 transition-all"
              >
                {a}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Pergunte sobre suas campanhas..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={send} disabled={loading || !input.trim()} size="icon" className="bg-verde-500 hover:bg-verde-600 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}