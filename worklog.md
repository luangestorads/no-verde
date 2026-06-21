# No Verde — Diário do Projeto

> SaaS de otimização de campanhas de Meta Ads (Facebook/Instagram Ads).
> **Nome:** No Verde (gíria financeira = "estar no lucro").
> **Tagline:** Suas campanhas no lucro · sua grana no bolso.

---

## ⚠️ PRIMEIRA COISA AO VOLTAR

O servidor de desenvolvimento **cai entre sessões**. Para reiniciar:

```bash
cd /home/z/my-project
pkill -f next 2>/dev/null; sleep 2
./node_modules/.bin/next dev -p 3000 > dev.log 2>&1 &
# aguardar HTTP 200 em http://localhost:3000/
```

Os dados NÃO se perdem (ficam em `db/custom.db`).

---

## Conta de teste e acesso

### Login (reativado)
- **Só Gmail** entra (validação no registro + aviso visual se não for Gmail)
- **Só quem está na lista de compradores** (AllowedEmail) consegue criar conta
- A senha é por escolha própria do usuário (mín. 6 caracteres, hasheada com bcrypt)
- Depois de cadastrado, o email é marcado como `used: true` (não pode cadastrar de novo)

### Painel Admin (cadastrar compradores)
Acesse via URL com a chave admin:
```
http://localhost:3000/?admin=701d221beae72e1d8492cc808cb8f1c9804a4e6e23edf408
```
A chave está no `.env` (`NO_ADMIN_KEY`). No painel admin você:
- Adiciona o Gmail do cliente + anotação (ex.: "João, comprou 21/06, R$ 197")
- Vê a lista de liberados (com status "Aguardando" / "Cadastrou")
- Remove emails da lista

### Conta de teste já criada
- Email: `cliente.teste@gmail.com`
- Senha: `minhasenha123`
- (Foi cadastrada via o fluxo admin → registro)

---

## Stack técnica

- Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui
- Prisma ORM + SQLite (`db/custom.db`)
- NextAuth.js v4 (CredentialsProvider, JWT, bcrypt)
- z-ai-web-dev-sdk (LLM) para o analista de IA
- xlsx (SheetJS) para importar .xlsx/.xls

---

## Arquitetura

### Autenticação e Multi-tenancy
- **MODO ATUAL: sem login.** `src/lib/session.ts` cria/usa um usuário local único.
- O código de NextAuth (`src/lib/auth.ts`, `src/app/api/auth/*`) ainda existe mas não é usado.
- Toda API continua filtrando por `userId` (o usuário local).
- Para voltar a ter login: restaurar `src/app/page.tsx` com `getServerSession` + `AuthScreen`.

### Modelos do banco (`prisma/schema.prisma`)
- `User` — id, email (unique), name, passwordHash
- `Product` — userId, name, price, orderBump*, upsell*, downsell*, url
- `Campaign` — userId, reportDate (para filtros), productId, + todas as métricas do Meta Ads
- Relações: User 1→N Campaign, User 1→N Product, Product 1→N Campaign (onDelete: SetNull/Cascade)

### Lógica de negócio (server-side, o "cérebro")
- `src/lib/optimizer.ts` — motor de otimização com regras precisas
- `src/lib/metrics.ts` — cálculos (Grana No Bolso, ROAS, ticket médio, formatação BRL)
- `src/lib/meta-import.ts` — parser de TSV/CSV do Gerenciador de Anúncios da Meta
- `src/lib/date-ranges.ts` — filtros de período (today/yesterday/week/month/year/custom)

### API routes
- `GET/POST /api/campaigns` (com `?period=&from=&to=`)
- `GET/PATCH/DELETE /api/campaigns/[id]`
- `POST /api/campaigns/import` (raw TSV/CSV)
- `POST /api/campaigns/seed?days=N` (dados de exemplo)
- `DELETE /api/campaigns/clear`
- `GET /api/insights?period=` (recomendações + resumo)
- `POST /api/insights/ai` (análise com LLM, passa período)
- `GET/POST /api/products`
- `PATCH/DELETE /api/products/[id]`

### Frontend
- `src/app/page.tsx` — gate SSR: sem sessão → AuthScreen; com sessão → Dashboard
- `src/components/dashboard/auth-screen.tsx` — login/registro
- `src/components/dashboard/dashboard.tsx` — painel principal (com filtro de data e logout)
- `src/components/dashboard/kpi-cards.tsx` — 6 KPIs com semáforo
- `src/components/dashboard/charts-panel.tsx` — 3 gráficos (recharts)
- `src/components/dashboard/campaign-table.tsx` — tabela com filtro/status
- `src/components/dashboard/optimization-panel.tsx` — plano de ação (vereditos por métrica)
- `src/components/dashboard/campaign-detail-drawer.tsx` — detalhe + vínculo de produto
- `src/components/dashboard/products-panel.tsx` — cadastro de produtos (ticket, bump, upsell, downsell)
- `src/components/dashboard/ai-panel.tsx` — analista de IA (perguntas livres)
- `src/components/dashboard/import-dialog.tsx` — upload .csv/.xlsx + colar texto
- `src/components/dashboard/date-filter.tsx` — filtro de período + calendário custom
- `src/components/dashboard/protection-guard.tsx` — bloqueia devtools/right-click + aviso console

---

## Critérios do grande player de Meta Ads (implementados no optimizer.ts)

| Métrica | Regra |
|---|---|
| CTR (cliques no anúncio) | Acima de 2% essencial · 1-2% atenção · <1% ruim |
| Custo por view da página | Ótimo ≤ R$1,20 · bom ≤ R$1,50 · máx R$2,50 · ≤10% do ticket |
| Custo por checkout | Sempre <10% do ticket (se passar = copy/oferta ruim) |
| Custo por venda (CPA) | ≤30% excelente · ≤60% OK · >60% ruim |
| ROAS | ≥2,0x magnífico · ≥1,5x ideal · ≥1,0x atenção · <1,0x perdendo |

Diagnósticos combinados:
- CTR baixo + custo/view alto = **criativo ruim**
- Muitas views + custo/checkout >10% = **copy/oferta ruim**
- Muitos checkouts + baratos + ROAS bom = **perfeito, escalar**

Linguagem: nível criança (ex.: "De cada 100 pessoas que viram seu anúncio, 2,4 clicaram").

---

## Proteções contra cópia (realistas, não infalíveis)

HONESTIDADE: nenhum site é 100% inclonável. O que foi feito:
1. Lógica inteligente (otimizador, IA, cálculos) roda **só no servidor**
2. Bloqueio de botão direito, F12, Ctrl+Shift+I/J/C, Ctrl+U
3. Aviso vermelho no console
4. Dados isolados por usuário (mesmo clonando a interface, não têm os dados)

---

## Histórico de decisões

1. **Nome "No Verde"** — gíria financeira BR ("estar no verde" = no lucro). 2 sílabas, fácil de lembrar. "Grana No Bolso" virou o nome da métrica interna (lucro líquido = receita − investido).
2. **Não criar perfil/BM automaticamente** — recusado no início porque viola Termos da Meta. O SaaS só otimiza campanhas de contas já existentes.
3. **Multi-tenancy** — cada usuário só vê seus dados. Implementado com userId em todas as tabelas e filtro em todas as queries.
4. **Login com email/senha** — NextAuth + bcrypt. Sem OAuth social (mais simples e seguro pra MVP).
5. **Filtros de data** — reportDate em Campaign para filtrar por hoje/ontem/semana/mês/ano/custom.

---

## Próximos passos sugeridos (não implementados)

- Recuperação de senha por email
- Painel admin (ver todos os usuários)
- Integração direta com Marketing API da Meta (puxar métricas automaticamente)
- Taxa de adesão de order bump/upsell (para calcular ticket médio realista)
- Hospedagem de produção (Vercel + banco gerenciado) — o sandbox não é produção
