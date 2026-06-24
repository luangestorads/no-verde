"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Globe, Search, Shield, Fingerprint, Users, AlertTriangle, CheckCircle2, Zap, Lock, Server } from "lucide-react";
import { cn } from "@/lib/utils";

type Tool = {
  id: string;
  name: string;
  tag: string;
  icon: React.ReactNode;
  color: string;
  descricao: string;
  site: string;
  problemas: { problema: string; causa: string; solucao: string[] }[];
};

const TOOLS: Tool[] = [
  {
    id: "adspower",
    name: "AdsPower",
    tag: "Mais popular no Brasil",
    icon: <Globe className="h-5 w-5" />,
    color: "from-blue-500 to-cyan-500",
    descricao: "Navegador anti-detecção chinês, muito usado por afiliados e gestores de tráfego no Brasil. Cria perfis isolados com fingerprint única.",
    site: "adspower.com",
    problemas: [
      {
        problema: "Conta do Facebook sendo bloqueada logo após criar perfil novo",
        causa: "O perfil está sendo criado com IP residencial sujo (já usado por outra pessoa) ou fingerprint muito 'limpa' demais (parece robô).",
        solucao: [
          "Use um proxy residencial NOVO (não compartilhado) — recomendado: IPRoyal, Smartproxy ou Bright Data",
          "No AdsPower, ao criar perfil, escolha a opção de fingerprint que mais combina com seu proxy (SO e fuso horário)",
          "Antes de logar no Facebook, navegue 5-10 minutos em sites comuns (Google, YouTube) para 'aquecer' o perfil",
          "Não logue no Facebook no mesmo dia que criou o perfil — espere 24h",
        ],
      },
      {
        problema: "Sincronização de perfis falhando entre computadores",
        causa: "Versão do AdsPower desatualizada ou conflito de extensões",
        solucao: [
          "Atualize o AdsPower para a última versão em TODOS os computadores",
          "Desative extensões de VPN/antivírus que podem bloquear a sincronização",
          "Vá em Configurações → Sincronização → 'Forçar sincronização'",
          "Se persistir, exporte o perfil (backup .json) e importe no outro PC",
        ],
      },
      {
        problema: "Proxy caindo o tempo todo / desconectando",
        causa: "Proxy sobrecarregado, formato incorreto ou limite de conexões atingido",
        solucao: [
          "Confira o formato: usuario:senha@ip:porta (não use socks5 se for http)",
          "No AdsPower, vá no perfil → Editar → Proxy → 'Testar proxy' (deve retornar <2000ms)",
          "Se usar proxy residencial rotativo, configure 'mudar IP a cada 30 min' no painel do proxy",
          "Não use o mesmo proxy em mais de 3 perfis simultâneos",
        ],
      },
      {
        problema: "Facebook pede verificação de SMS toda hora",
        causa: "O perfil está sendo criado em IP diferente do país configurado no Facebook",
        solucao: [
          "O IP do proxy DEVE ser do mesmo país do Facebook (Brasil → proxy BR)",
          "Configure o fuso horário do perfil no AdsPower igual ao do proxy",
          "Use o mesmo número de telefone que foi usado para criar a conta originalmente",
          "Ative '2FA' no Facebook após logar — reduz verificações futuras",
        ],
      },
      {
        problema: "Navegador travando / lentidão com muitos perfis abertos",
        causa: "Falta de RAM ou muitos perfis abertos simultaneamente",
        solucao: [
          "Recomendado: 8GB RAM por perfil aberto simultâneo",
          "Feche perfis que não está usando (clique direito → 'Fechar')",
          "Vá em Configurações → Performance → ative 'Modo de baixo consumo de memória'",
          "Use a extensão 'OneTab' dentro do perfil para liberar memória das abas",
        ],
      },
    ],
  },
  {
    id: "dolphin",
    name: "Dolphin Anty",
    tag: "Foco em afiliados",
    icon: <Fingerprint className="h-5 w-5" />,
    color: "from-purple-500 to-pink-500",
    descricao: "Navegador anti-detecção focado em afiliados de tráfego. Interface limpa e integração com plataformas de afiliação.",
    site: "anty.dolphin.ru.com",
    problemas: [
      {
        problema: "Erro 'Proxy not working' mesmo com proxy válido",
        causa: "Formato do proxy no Dolphin exige separação clara entre tipo e credenciais",
        solucao: [
          "No Dolphin, use o formato: http://usuario:senha@ip:porta (com o 'http://' na frente)",
          "Para SOCKS5: socks5://usuario:senha@ip:porta",
          "Crie o proxy em 'Profiles → Proxies' ANTES de vincular ao perfil",
          "Clique em 'Check' — se mostrar IP e país, está funcionando",
        ],
      },
      {
        problema: "Perfis sumindo após atualização do Dolphin",
        causa: "Bug conhecido em versões antigas ao atualizar",
        solucao: [
          "NÃO desinstale — vá em Settings → Backups → 'Restore' (restaurar último backup)",
          "Os backups automáticos ficam em: C:\\Users\\SEU_USUARIO\\Dolphin Anty\\backups",
          "Após restaurar, exporte um backup manual (.zip) e guarde em local seguro",
          "Sempre atualize o Dolphin com todos os perfis FECHADOS",
        ],
      },
      {
        problema: "Facebook detecta que é navegador automatizado",
        causa: "Fingerprint muito 'perfeita' ou uso de automação (Puppeteer/Selenium) sem stealth",
        solucao: [
          "No Dolphin, ao criar perfil, use a opção 'Recommended' de fingerprint (não customizar tudo)",
          "Desative automação visível — se usar Selenium, instale 'undetected-chromedriver'",
          "Não use a API do Dolphin para automatizar login no Facebook (é detectável)",
          "Faça o login manualmente sempre que possível",
        ],
      },
      {
        problema: "Cookie não persiste entre sessões",
        causa: "Perfil configurado para limpar dados ao fechar",
        solucao: [
          "Vá em Edit Profile → Advanced → 'Clear cookies on close' = DESATIVADO",
          "Ative 'Save cookies and local storage' na criação do perfil",
          "Se usar proxy rotativo, fixe o IP por sessão (senão o cookie é invalidado)",
        ],
      },
      {
        problema: "Limite de perfis atingido no plano gratuito",
        causa: "Plano free do Dolphin limita a 10 perfis",
        solucao: [
          "Plano free: 10 perfis · Base: 100 perfis · Team: ilimitado",
          "Para gerenciar mais contas com plano free: crie perfis, use, e arquive (não conta no limite)",
          "Perfis arquivados podem ser desarquivados quando precisar",
          "Considere o plano Base (US$89/mês) se gerencia mais de 10 contas ativas",
        ],
      },
    ],
  },
  {
    id: "octo",
    name: "Octo Browser",
    tag: "Para equipes",
    icon: <Users className="h-5 w-5" />,
    color: "from-emerald-500 to-teal-500",
    descricao: "Navegador anti-detecção com foco em trabalho em equipe e gestão de múltiplos colaboradores. Bom para agências.",
    site: "octobrowser.net",
    problemas: [
      {
        problema: "Colaborador não consegue acessar perfis compartilhados",
        causa: "Permissões de equipe mal configuradas",
        solucao: [
          "Vá em Team → Members → convide o colaborador por email",
          "Atribua a role 'Member' (não 'Admin' se não for necessário)",
          "Em 'Profiles', selecione os perfis → 'Share' → escolha o colaborador",
          "Marque 'View only' se não quiser que ele edite, ou 'Full access' para edição",
        ],
      },
      {
        problema: "Perfis aparecem como 'In use' mas ninguém está usando",
        causa: "Travamento de lock quando o colaborador fecha o browser incorretamente",
        solucao: [
          "Peça ao colaborador para fechar via 'Stop' no Octo (não fechar a janela direto)",
          "Se travar: Admin vai no perfil → 'Force release' (libera o lock)",
          "Configuração → 'Auto-release lock after 10 min' evita o problema",
        ],
      },
      {
        problema: "Sincronização de cookies entre membros não funciona",
        causa: "Cookies são locais por padrão; sincronização precisa ser ativada",
        solucao: [
          "Settings → Cloud Sync → ative 'Sync cookies and local storage'",
          "Plano Team ou superior é necessário para sync entre membros",
          "Após ativar, TODOS os membros precisam reabrir o perfil para sincronizar",
        ],
      },
    ],
  },
  {
    id: "vmlogin",
    name: "VMLogin",
    tag: "Alternativa chinesa",
    icon: <Server className="h-5 w-5" />,
    color: "from-amber-500 to-orange-500",
    descricao: "Navegador anti-detecção chinês, alternativa ao AdsPower com preço menor. Bom para quem quer economizar.",
    site: "vmlogin.com",
    problemas: [
      {
        problema: "Interface em inglês confuso / tradução ruim",
        causa: "VMLogin é chinês, tradução para PT-BR incompleta",
        solucao: [
          "Use em inglês (mais completo que PT)",
          "Glossário: 'Browser Profile' = Perfil · 'Cookie' = Biscoito · 'Proxy' = Servidor intermediário",
          "Para suporte em PT, use o grupo de WhatsApp da comunidade brasileira",
        ],
      },
      {
        problema: "Perfis corrompendo após uso intenso",
        causa: "Bug conhecido em VMLogin com mais de 50 abas abertas",
        solucao: [
          "Mantenha menos de 30 abas abertas por perfil",
          "Use 'OneTab' ou 'Session Buddy' para gerenciar abas",
          "Faça backup do perfil (.json) semanalmente",
          "Se corromper: delete o perfil e restaure do backup",
        ],
      },
      {
        problema: "Proxy integrado não autentica",
        causa: "VMLogin tem bug com proxies que exigem autenticação por IP",
        solucao: [
          "No painel do proxy, adicione o IP do seu PC na lista de IPs autorizados (IP whitelist)",
          "Use proxy com usuário:senha em vez de IP whitelist",
          "Formato: ip:porta:usuario:senha (sem 'http://')",
        ],
      },
    ],
  },
  {
    id: "incogniton",
    name: "Incogniton",
    tag: "Simplificado",
    icon: <Lock className="h-5 w-5" />,
    color: "from-rose-500 to-red-500",
    descricao: "Navegador anti-detecção mais simples e barato. Bom para iniciantes ou poucas contas.",
    site: "incogniton.com",
    problemas: [
      {
        problema: "Plano gratuito muito limitado (10 perfis)",
        causa: "Plano free do Incogniton tem limite baixo",
        solucao: [
          "Plano free: 10 perfis · Automation: US$29,99/mês (50 perfis)",
          "Para mais perfis, considere AdsPower (mais caro) ou Octo (equipes)",
          "Use perfis arquivados para contas inativas (não contam no limite)",
        ],
      },
      {
        problema: "Fingerprint 'quebrada' em sites de checagem",
        causa: "Incogniton tem fingerprint menos sofisticada que AdsPower/Dolphin",
        solucao: [
          "Teste em browserleaks.com e fingerprint.com",
          "Se 'Canvas fingerprint' mostrar inconsistência, troque de perfil",
          "Para contas sensíveis (com saldo), prefira AdsPower ou Dolphin (fingerprint melhor)",
          "Incogniton é bom para contas secundárias/testes",
        ],
      },
    ],
  },
  {
    id: "geral",
    name: "Dicas Gerais (todas as ferramentas)",
    tag: "Aplicável a qualquer um",
    icon: <Shield className="h-5 w-5" />,
    color: "from-slate-500 to-slate-700",
    descricao: "Boas práticas que valem para AdsPower, Dolphin, Octo, VMLogin e qualquer navegador anti-detecção.",
    site: "",
    problemas: [
      {
        problema: "Como escolher o proxy certo (a base de tudo)",
        causa: "O proxy é mais importante que o navegador. Proxy ruim = conta banida não importa qual tool use.",
        solucao: [
          "Tipos: Residencial (melhor, parece pessoa real) > ISP (bom meio-termo) > Datacenter (evite para FB Ads)",
          "Fornecedores confiáveis: IPRoyal, Smartproxy, Bright Data, ProxyEmpire",
          "Formato ideal: 1 proxy : 1 perfil (nunca compartilhe proxy entre contas)",
          "Localização do proxy = mesma do Facebook (conta BR = proxy BR)",
          "Custo médio: R$ 50-150/mês por proxy residencial",
        ],
      },
      {
        problema: "Facebook bane conta mesmo com navegador anti-detecção",
        causa: "Navegador anti-detecção não é mágica — o Facebook detecta padrões de comportamento, não só fingerprint.",
        solucao: [
          "Não logue 10 contas no mesmo dia no mesmo PC (mesmo com perfis separados)",
          "Faça pausas de 5-10 min entre logins de contas diferentes",
          "Sempre feche um perfil antes de abrir outro (não use simultâneo se possível)",
          "Use o Business Manager da conta (não misture contas pessoais com de anúncios)",
          "Aqueça o perfil: navegue em sites comuns antes de ir pro Facebook",
        ],
      },
      {
        problema: "Como organizar múltiplas contas sem se perder",
        causa: "Gestão manual de 10+ contas vira caos sem organização",
        solucao: [
          "Nomeie perfis assim: [Cliente] - [Conta] - [Data criação] (ex: 'LojaA - BM1 - 15jan')",
          "Use tags/etiquetas: 'Ativa', 'Pausada', 'Banida', 'Verificar'",
          "Mantenha uma planilha: perfil, proxy, cliente, status, último acesso",
          "Faça backup SEMANAL de todos os perfis (export .json)",
          "Nunca delete um perfil banido — arquive (pode precisar dos dados)",
        ],
      },
      {
        problema: "Vazamento de IP real apesar do proxy",
        causa: "Alguns sites detectam IP real via WebRTC, DNS ou Canvas fingerprint",
        solucao: [
          "Ative 'Disable WebRTC' nas configurações do perfil (essencial!)",
          "Configure DNS do perfil para o mesmo do proxy (não use DNS do seu provedor)",
          "Teste em: browserleaks.com/webrtc e dnsleaktest.com",
          "Se aparecer seu IP real, o perfil está comprometido — não use para contas importantes",
        ],
      },
      {
        problema: "Automação (RPA/bot) detectada pelo Facebook",
        causa: "Facebook detecta padrões de movimento de mouse e digitação robóticos",
        solucao: [
          "Use bibliotecas que simulam comportamento humano: 'ghost-cursor' para mouse",
          "Adicione delays aleatórios entre ações (2-8 segundos)",
          "Não faça mais de 5 ações por minuto (login, clique, scroll)",
          "Para automação avançada, considere 'AdsPower API' + 'puppeteer-extra-plugin-stealth'",
          "NUNCA automatize login no Facebook — sempre manual",
        ],
      },
    ],
  },
];

export function MultiloginPanel() {
  const [activeTool, setActiveTool] = useState<string>("adspower");
  const [search, setSearch] = useState("");

  const tool = TOOLS.find((t) => t.id === activeTool)!;
  const filteredProblems = tool.problemas.filter(
    (p) =>
      p.problema.toLowerCase().includes(search.toLowerCase()) ||
      p.causa.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Header explicativo */}
      <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Guias de Multilogin e Anti-Detecção</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Soluções práticas para os problemas mais comuns em AdsPower, Dolphin Anty, Octo Browser,
                VMLogin e Incogniton. Use para gerenciar múltiplas contas de anúncios com segurança.
                <strong className="text-foreground"> Importante:</strong> nunca use para criar contas falsas
                ou violar políticas da Meta — use apenas para gerenciar contas legítimas que você possui.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seletor de ferramenta */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setActiveTool(t.id); setSearch(""); }}
            className={cn(
              "rounded-xl border p-3 text-left transition-all hover:shadow-sm",
              activeTool === t.id
                ? "border-foreground/30 bg-card shadow-sm ring-2 ring-foreground/10"
                : "border-border bg-card/50 hover:bg-card",
            )}
          >
            <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white mb-2", t.color)}>
              {t.icon}
            </div>
            <div className="text-xs font-semibold leading-tight">{t.name}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{t.tag}</div>
          </button>
        ))}
      </div>

      {/* Detalhes da ferramenta selecionada */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white", tool.color)}>
                {tool.icon}
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {tool.name}
                  {tool.site && (
                    <a
                      href={`https://${tool.site}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-normal text-muted-foreground hover:text-foreground underline"
                    >
                      {tool.site}
                    </a>
                  )}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5 max-w-2xl">{tool.descricao}</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">{tool.problemas.length} soluções</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Busca */}
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar problema…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
              aria-label="Buscar problema"
            />
          </div>

          <div className="space-y-3 max-h-[40rem] overflow-y-auto pr-1 custom-scroll">
            {filteredProblems.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                Nenhum problema encontrado com "{search}".
              </div>
            ) : (
              filteredProblems.map((p, i) => (
                <SolutionCard key={i} index={i + 1} {...p} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SolutionCard({
  index, problema, causa, solucao,
}: {
  index: number;
  problema: string;
  causa: string;
  solucao: string[];
}) {
  const [open, setOpen] = useState(index === 1);
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left p-3.5 flex items-start justify-between gap-3 hover:bg-muted/30 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold shrink-0">
            {index}
          </span>
          <span className="font-medium text-sm leading-snug">{problema}</span>
        </div>
        <Chevron className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 space-y-3 border-t bg-muted/10">
          <div className="pt-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Por que acontece
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{causa}</p>
          </div>
          <Separator />
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Como resolver
            </div>
            <ol className="space-y-1.5">
              {solucao.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-foreground/90">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
