// Helpers de período para filtros de data.
// Retorna [inicio, fim] como Date (fim é exclusivo no fim do dia).
export type Period = "today" | "yesterday" | "week" | "month" | "year" | "all" | "custom";

export type DateRange = { from: Date; to: Date };

export function resolveRange(period: Period, from?: string, to?: string): DateRange | null {
  const now = new Date();
  // Usar timezone local do servidor (São Paulo conforme config)
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  switch (period) {
    case "today":
      return { from: todayStart, to: todayEnd };
    case "yesterday": {
      const y = new Date(todayStart);
      y.setDate(y.getDate() - 1);
      return { from: y, to: todayStart };
    }
    case "week": {
      // Início da semana (domingo)
      const d = new Date(todayStart);
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      return { from: d, to: addDays(todayEnd, 1) };
    }
    case "month": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { from: first, to: next };
    }
    case "year": {
      const first = new Date(now.getFullYear(), 0, 1);
      const next = new Date(now.getFullYear() + 1, 0, 1);
      return { from: first, to: next };
    }
    case "custom": {
      if (!from || !to) return null;
      const f = new Date(from);
      const t = new Date(to);
      if (isNaN(f.getTime()) || isNaN(t.getTime())) return null;
      return { from: startOfDay(f), to: addDays(endOfDay(t), 1) };
    }
    case "all":
    default:
      return null; // sem filtro
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export const PERIOD_LABELS: { value: Period; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
  { value: "year", label: "Este ano" },
  { value: "all", label: "Tudo" },
  { value: "custom", label: "Personalizado" },
];
