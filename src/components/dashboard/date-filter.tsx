"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { PERIOD_LABELS, type Period } from "@/lib/date-ranges";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type DateFilterValue = {
  period: Period;
  from?: string;
  to?: string;
};

export function DateFilter({
  value,
  onChange,
}: {
  value: DateFilterValue;
  onChange: (v: DateFilterValue) => void;
}) {
  const showCustom = value.period === "custom";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select
        value={value.period}
        onValueChange={(p) => onChange({ period: p as Period })}
      >
        <SelectTrigger className="h-9 w-[150px] text-xs sm:text-sm" aria-label="Período">
          <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_LABELS.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showCustom && (
        <div className="flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 text-xs gap-1.5", !value.from && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {value.from ? format(new Date(value.from), "dd/MM/yyyy", { locale: ptBR }) : "De"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value.from ? new Date(value.from) : undefined}
                onSelect={(d) => d && onChange({ ...value, from: d.toISOString() })}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-xs">até</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 text-xs gap-1.5", !value.to && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {value.to ? format(new Date(value.to), "dd/MM/yyyy", { locale: ptBR }) : "Até"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value.to ? new Date(value.to) : undefined}
                onSelect={(d) => d && onChange({ ...value, to: d.toISOString() })}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
