import { Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface PickOption { value: string; label: string }

/** Compact multi-select for relationships (evidence ↔ suspects ↔ clues…). */
export function MultiPicker({ options, value, onChange, placeholder = "Select…" }: { options: PickOption[]; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[11px]">
            {options.find((o) => o.value === v)?.label ?? v}
            <button onClick={() => toggle(v)} aria-label="Remove"><X className="size-2.5" /></button>
          </span>
        ))}
      </div>
      <Popover>
        <PopoverTrigger className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2.5 text-xs text-muted-foreground hover:bg-accent">
          {placeholder}<ChevronsUpDown className="size-3" />
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search…" className="h-8 text-xs" />
            <CommandList>
              <CommandEmpty>Nothing found.</CommandEmpty>
              {options.map((o) => (
                <CommandItem key={o.value} value={o.label} onSelect={() => toggle(o.value)} className="text-xs">
                  <Check className={cn("size-3", value.includes(o.value) ? "opacity-100" : "opacity-0")} />{o.label}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
