"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutocompleteOption {
  id: string;
  label: string;
  subtitle?: string;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  displayFormat?: (option: AutocompleteOption) => string;
}

export function Autocomplete({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  label,
  error,
  required,
  disabled,
  className,
  displayFormat,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = React.useState<DOMRect | null>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((option) => {
      const labelMatch = option.label.toLowerCase().includes(query);
      const subtitleMatch = option.subtitle?.toLowerCase().includes(query);
      return labelMatch || subtitleMatch;
    });
  }, [options, searchQuery, value]);

  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
        setSearchQuery("");
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  React.useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownRect(rect);
    }
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setOpen(true);
  };

  const handleInputFocus = () => {
    setOpen(true);
    setSearchQuery("");
  };

  const handleSelect = (optionId: string) => {
    onValueChange(optionId);
    setOpen(false);
    setSearchQuery("");
    setTimeout(() => inputRef.current?.blur(), 0);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(null);
    setSearchQuery("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].id);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div ref={containerRef} className="relative">
        <div
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-text",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            error && "border-red-500",
            disabled && "cursor-not-allowed opacity-50",
          )}
          onClick={() => inputRef.current?.focus()}
        >
          <input
            ref={inputRef}
            type="text"
            value={open ? searchQuery : selectedOption?.label || ""}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "flex-1 bg-transparent outline-none placeholder:text-muted-foreground",
              disabled && "cursor-not-allowed",
            )}
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
          />
          <div className="flex items-center gap-1">
            {value && !open && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </div>

        {open &&
          filteredOptions.length > 0 &&
          dropdownRect &&
          createPortal(
            <div
              ref={dropdownRef}
              className={cn(
                "fixed z-[9999] max-h-96 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-lg",
              )}
              style={{
                top: `${dropdownRect.bottom + window.scrollY}px`,
                left: `${dropdownRect.left}px`,
                width: `${dropdownRect.width}px`,
              }}
            >
              {filteredOptions.map((option, index) => (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-3 pr-8 text-sm outline-none",
                    "hover:bg-accent hover:text-accent-foreground",
                    index === highlightedIndex && "bg-accent",
                    value === option.id && "bg-accent",
                  )}
                >
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        {option.subtitle}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>,
            document.body,
          )}

        {open &&
          searchQuery &&
          filteredOptions.length === 0 &&
          dropdownRect &&
          createPortal(
            <div
              className="fixed z-[9999] w-full rounded-md border bg-popover text-popover-foreground shadow-lg"
              style={{
                top: `${dropdownRect.bottom + window.scrollY}px`,
                left: `${dropdownRect.left}px`,
                width: `${dropdownRect.width}px`,
              }}
            >
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found
              </div>
            </div>,
            document.body,
          )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
