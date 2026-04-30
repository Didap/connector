"use client";

import { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  onApplySuggestion?: (s: string) => void;
  className?: string;
}

export function ChipInput({ value, onChange, placeholder, suggestions, onApplySuggestion, className }: Props) {
  const [draft, setDraft] = useState("");

  function add(text: string) {
    const t = text.trim();
    if (!t) return;
    if (value.includes(t)) return;
    onChange([...value, t]);
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
      setDraft("");
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      remove(value.length - 1);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2 flex flex-wrap gap-1.5 min-h-[42px] focus-within:border-[var(--color-accent)] transition-colors">
        {value.map((chip, i) => (
          <span
            key={`${chip}-${i}`}
            className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-2)] px-2 py-1 text-xs"
          >
            <span className="break-all">{chip}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-[var(--color-fg-muted)] hover:text-[var(--color-danger)]"
              aria-label="remove"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim()) {
              add(draft);
              setDraft("");
            }
          }}
          placeholder={value.length === 0 ? placeholder : "+ aggiungi"}
          className="flex-1 min-w-[140px] bg-transparent text-sm focus:outline-none placeholder:text-[var(--color-fg-muted)]"
        />
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions
            .filter((s) => !value.includes(s))
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  add(s);
                  onApplySuggestion?.(s);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-dashed border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:border-[var(--color-accent)]/50"
                title="Aggiungi"
              >
                <Plus size={10} />
                <span className="truncate max-w-[260px]">{s}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
