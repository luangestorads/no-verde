"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { fmtBRL } from "@/lib/metrics";
import type { ProductRow } from "@/lib/campaign-types";
import { Package, Plus, Pencil, Trash2, Loader2, Tag, TrendingUp, ArrowUpCircle, ArrowDownCircle, Link2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FormState = {
  id?: string;
  name: string;
  description: string;
  price: string;
  orderBumpName: string;
  orderBumpPrice: string;
  upsellName: string;
  upsellPrice: string;
  downsellName: string;
  downsellPrice: string;
  url: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  orderBumpName: "",
  orderBumpPrice: "",
  upsellName: "",
  upsellPrice: "",
  downsellName: "",
  downsellPrice: "",
  url: "",
};

export function ProductsPanel({ onProductsChange }: { onProductsChange?: () => void }) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      toast.error("Não consegui carregar os produtos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function edit(p: ProductRow) {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: String(p.price || ""),
      orderBumpName: p.orderBumpName || "",
      orderBumpPrice: p.orderBumpPrice ? String(p.orderBumpPrice) : "",
      upsellName: p.upsellName || "",
      upsellPrice: p.upsellPrice ? String(p.upsellPrice) : "",
      downsellName: p.downsellName || "",
      downsellPrice: p.downsellPrice ? String(p.downsellPrice) : "",
      url: p.url || "",
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setForm(EMPTY_FORM);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Dê um nome ao produto");
      return;
    }
    setSaving(true);
    const t = toast.loading(form.id ? "Salvando produto…" : "Criando produto…");
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: num(form.price),
        orderBumpName: form.orderBumpName || null,
        orderBumpPrice: num(form.orderBumpPrice),
        upsellName: form.upsellName || null,
        upsellPrice: num(form.upsellPrice),
        downsellName: form.downsellName || null,
        downsellPrice: num(form.downsellPrice),
        url: form.url || null,
      };
      const res = form.id
        ? await fetch(`/api/products/${form.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro");
      toast.success(form.id ? "Produto atualizado" : "Produto criado", { id: t });
      reset();
      await load();
      onProductsChange?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar", { id: t });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const t = toast.loading("Excluindo produto…");
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro");
      toast.success("Produto excluído", { id: t });
      await load();
      onProductsChange?.();
    } catch {
      toast.error("Falha ao excluir", { id: t });
    }
  }

  const totalTicket = num(form.price) + num(form.orderBumpPrice) + num(form.upsellPrice);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Formulário */}
      <Card className="lg:col-span-2 lg:sticky lg:top-20 h-fit">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                {form.id ? "Editar produto" : "Cadastrar produto"}
              </CardTitle>
              <CardDescription className="text-xs">
                Registre o preço, order bump e upsell para análises precisas
              </CardDescription>
            </div>
            {form.id && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset} aria-label="Cancelar edição">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-name" className="text-xs">Nome do produto *</Label>
            <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Curso de Tráfego Pago" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc" className="text-xs">Descrição (opcional)</Label>
            <Textarea id="p-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalhes do produto…" className="min-h-[60px] resize-none text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-price" className="text-xs flex items-center gap-1.5"><Tag className="h-3 w-3" /> Ticket principal (preço) *</Label>
            <Input id="p-price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="297,00" className="tabular-nums" />
            <p className="text-[10px] text-muted-foreground">Preço base do produto. Usado nas regras (% do ticket).</p>
          </div>

          <Separator />
          <div className="text-xs font-medium text-muted-foreground">Aumentar o ticket (opcional)</div>

          <OfferField
            icon={<ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500" />}
            label="Order Bump"
            hint="Oferta extra dentro do checkout"
            name={form.orderBumpName} onName={(v) => setForm({ ...form, orderBumpName: v })}
            price={form.orderBumpPrice} onPrice={(v) => setForm({ ...form, orderBumpPrice: v })}
            placeholderName="Ex.: Mentoria individual"
            placeholderPrice="47,00"
          />
          <OfferField
            icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
            label="Upsell"
            hint="Oferta logo após a compra"
            name={form.upsellName} onName={(v) => setForm({ ...form, upsellName: v })}
            price={form.upsellPrice} onPrice={(v) => setForm({ ...form, upsellPrice: v })}
            placeholderName="Ex.: Pacote avançado"
            placeholderPrice="497,00"
          />
          <OfferField
            icon={<ArrowDownCircle className="h-3.5 w-3.5 text-amber-500" />}
            label="Downsell"
            hint="Oferta mais barata se recusar o upsell"
            name={form.downsellName} onName={(v) => setForm({ ...form, downsellName: v })}
            price={form.downsellPrice} onPrice={(v) => setForm({ ...form, downsellPrice: v })}
            placeholderName="Ex.: Versão simplificada"
            placeholderPrice="97,00"
          />

          <div className="space-y-1.5">
            <Label htmlFor="p-url" className="text-xs flex items-center gap-1.5"><Link2 className="h-3 w-3" /> Página de vendas (opcional)</Label>
            <Input id="p-url" type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" />
          </div>

          {/* Ticket máximo */}
          {totalTicket > 0 && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3">
              <div className="text-[10px] text-muted-foreground">Ticket máximo (se levar tudo)</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{fmtBRL(totalTicket)}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Preço + Order Bump + Upsell
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !form.name.trim()} className="flex-1 gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : form.id ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {form.id ? "Salvar" : "Cadastrar"}
            </Button>
            {form.id && <Button variant="outline" onClick={reset}>Cancelar</Button>}
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Seus produtos ({products.length})</CardTitle>
          <CardDescription className="text-xs">
            Vincule um produto a cada campanha para a análise usar o ticket certo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Nenhum produto cadastrado ainda.
              <br />
              Cadastre seu primeiro produto ao lado.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[36rem] overflow-y-auto pr-1 custom-scroll">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onEdit={() => edit(p)} onDelete={() => remove(p.id)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OfferField({
  icon, label, hint, name, onName, price, onPrice, placeholderName, placeholderPrice,
}: {
  icon: React.ReactNode; label: string; hint: string;
  name: string; onName: (v: string) => void;
  price: string; onPrice: (v: string) => void;
  placeholderName: string; placeholderPrice: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-1.5">{icon}{label}<span className="text-muted-foreground font-normal">· {hint}</span></Label>
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => onName(e.target.value)} placeholder={placeholderName} className="flex-1 text-sm" />
        <Input type="number" step="0.01" value={price} onChange={(e) => onPrice(e.target.value)} placeholder={placeholderPrice} className="w-28 tabular-nums" />
      </div>
    </div>
  );
}

function ProductCard({ product, onEdit, onDelete }: { product: ProductRow; onEdit: () => void; onDelete: () => void }) {
  const maxTicket = (product.price || 0) + (product.orderBumpPrice || 0) + (product.upsellPrice || 0);
  return (
    <div className="rounded-xl border p-3.5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{product.name}</span>
            {maxTicket > product.price && (
              <Badge variant="secondary" className="text-[10px]">
                Ticket máx {fmtBRL(maxTicket, { compact: true })}
              </Badge>
            )}
          </div>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{product.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Preço:</span>
              <span className="font-semibold tabular-nums">{fmtBRL(product.price)}</span>
            </span>
            {product.orderBumpPrice > 0 && (
              <span className="flex items-center gap-1">
                <ArrowUpCircle className="h-3 w-3 text-emerald-500" />
                <span className="text-muted-foreground">Bump:</span>
                <span className="font-medium tabular-nums">{fmtBRL(product.orderBumpPrice)}</span>
              </span>
            )}
            {product.upsellPrice > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-muted-foreground">Upsell:</span>
                <span className="font-medium tabular-nums">{fmtBRL(product.upsellPrice)}</span>
              </span>
            )}
            {product.downsellPrice > 0 && (
              <span className="flex items-center gap-1">
                <ArrowDownCircle className="h-3 w-3 text-amber-500" />
                <span className="text-muted-foreground">Down:</span>
                <span className="font-medium tabular-nums">{fmtBRL(product.downsellPrice)}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} aria-label="Editar">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete} aria-label="Excluir">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function num(v: string): number {
  const n = Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}
