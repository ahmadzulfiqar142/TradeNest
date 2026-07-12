"use client";

import * as React from "react";

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxValue,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

interface AutocompleteOption {
  id: string;
  label: string;
  subtitle?: string;
  group?: string;
  isCustom?: boolean;
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
  groupBy?: string;
  allowCustom?: boolean;
  onCustomCreate?: (value: string) => void;
  customLabel?: string;
  isCustomItem?: boolean; // Track if current value is a custom/one-time item
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
  groupBy,
  allowCustom = false,
  onCustomCreate,
  customLabel = "Add",
  isCustomItem = false,
}: AutocompleteProps) {
  const selectedOption = options.find((opt) => opt.id === value);
  const [inputValue, setInputValue] = React.useState("");

  // Update input value when selection changes
  React.useEffect(() => {
    if (selectedOption) {
      const display = displayFormat
        ? displayFormat(selectedOption)
        : selectedOption.label;
      setInputValue(display);
    } else {
      setInputValue("");
    }
  }, [selectedOption, displayFormat]);

  // Group options if groupBy is provided
  const groupedOptions = React.useMemo(() => {
    if (!groupBy) {
      return [{ value: "options", items: options }];
    }

    const groups: Array<{ value: string; items: AutocompleteOption[] }> = [];
    const groupMap = new Map<string, AutocompleteOption[]>();

    options.forEach((option) => {
      const groupValue =
        (option[groupBy as keyof AutocompleteOption] as string) || "Other";
      if (!groupMap.has(groupValue)) {
        groupMap.set(groupValue, []);
      }
      groupMap.get(groupValue)!.push(option);
    });

    groupMap.forEach((items, groupValue) => {
      groups.push({ value: groupValue, items });
    });

    return groups;
  }, [options, groupBy]);

  const displayValue = displayFormat
    ? selectedOption
      ? displayFormat(selectedOption)
      : ""
    : selectedOption?.label || "";

  // Prepare items list with custom option at the top if needed
  const shouldShowCustomOption = allowCustom;
  const customOption = shouldShowCustomOption
    ? {
        id: "__custom__",
        label: inputValue || "new line item",
        isCustom: true,
      }
    : null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="rounded-lg border border-gray-300 bg-transparent">
        <Combobox
          onValueChange={(newValue) => {
            // Check if this is a custom create action
            if (allowCustom && newValue?.startsWith("__custom__:")) {
              const customValue = newValue.replace("__custom__:", "");
              onCustomCreate?.(customValue);
              // Clear the value and set input to show the custom value
              onValueChange(null);
              setInputValue(customValue);
              return;
            }

            // Find the option by label (since that's what we're storing as value)
            const selected = options.find((opt) => opt.label === newValue);
            if (selected) {
              onValueChange(selected.id);
              const display = displayFormat
                ? displayFormat(selected)
                : selected.label;
              setInputValue(display);
            } else {
              onValueChange(newValue);
              setInputValue(newValue || "");
            }
          }}
          value={
            value && !value.startsWith("__custom__:")
              ? options.find((opt) => opt.id === value)?.label
              : undefined
          }
          items={shouldShowCustomOption ? [customOption, ...options] : options}
        >
          <ComboboxValue>
            {(selectedOption) => {
              if (!selectedOption) return null;
              return (
                <div className="flex flex-col">
                  <span>{selectedOption.value}</span>
                </div>
              );
            }}
          </ComboboxValue>
          <ComboboxInput
            placeholder={placeholder}
            disabled={disabled}
            showClear={!!value}
          />
          <ComboboxContent>
            <ComboboxList>
              {/* Custom create option at the top - always visible when allowCustom is true */}
              {shouldShowCustomOption && (
                <>
                  <ComboboxItem
                    value={`__custom__:${inputValue || "new item"}`}
                    className="font-medium text-primary"
                  >
                    <div className="flex flex-col">
                      <span>
                        + {customLabel} "{inputValue || "new line item"}"
                      </span>
                      <span className="text-xs text-muted-foreground">
                        as a new line item
                      </span>
                    </div>
                  </ComboboxItem>
                  {groupedOptions.length > 0 && <ComboboxSeparator />}
                </>
              )}
              {groupedOptions.map((group, index) => (
                <ComboboxGroup key={group.value} items={group.items}>
                  <ComboboxLabel>{group.value}</ComboboxLabel>
                  <ComboboxCollection>
                    {(item) => (
                      <ComboboxItem key={item.id} value={item.label}>
                        <div className="flex flex-col">
                          <span>{item.label}</span>
                          {item.subtitle && (
                            <span className="text-xs text-muted-foreground">
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                  {index < groupedOptions.length - 1 && <ComboboxSeparator />}
                </ComboboxGroup>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
