"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { FILTER_LABELS, DEFAULT_PRESET } from "@/lib/dashboard-filters";
import type { FilterPreset, DateRange } from "@/lib/dashboard-filters";

const PRESETS = Object.keys(FILTER_LABELS) as FilterPreset[];

interface DateRangeFilterProps {
  value: FilterPreset;
  customRange?: DateRange;
  onChange: (preset: FilterPreset, custom?: DateRange) => void;
}

export function DateRangeFilter({ value, customRange, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(value === "custom");
  const [customFrom, setCustomFrom] = useState(customRange?.from ?? "");
  const [customTo, setCustomTo] = useState(customRange?.to ?? "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectPreset(preset: FilterPreset) {
    if (preset === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    setOpen(false);
    onChange(preset);
  }

  function applyCustom() {
    if (!customFrom || !customTo) return;
    setOpen(false);
    setShowCustom(false);
    onChange("custom", { from: customFrom, to: customTo });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <CalendarDays className="w-4 h-4 text-muted-foreground" />
        <span>{FILTER_LABELS[value]}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-border bg-card shadow-lg py-1">
          {!showCustom ? (
            PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => selectPreset(preset)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-muted ${
                  value === preset ? "text-primary font-medium" : "text-foreground"
                }`}
              >
                {FILTER_LABELS[preset]}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Custom Range</p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground">From</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1.5 text-sm rounded-md border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">To</label>
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1.5 text-sm rounded-md border border-border bg-background text-foreground"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCustom(false)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={applyCustom}
                  disabled={!customFrom || !customTo}
                  className="flex-1 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
