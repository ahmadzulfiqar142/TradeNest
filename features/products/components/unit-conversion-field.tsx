"use client";

import { useEffect, useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import type { CreateProductFormValues } from "@/schemas/product";
import {
  AUTO_CONVERTIBLE_TYPES,
  getAutoConversionFactor,
  PREFERRED_REFERENCE_SYMBOL,
} from "@/lib/unit-conversion";

export type UnitOption = { id: string; name: string; symbol: string; type: string };

/**
 * Renders the "conversion" cell for one unit row on the product form.
 *
 * - Default (base) unit: always 1, not editable.
 * - Same type as base AND that type has a fixed real-world ratio
 *   (weight: mg/g/kg, volume: ml/L, count: pc/dz): auto-computed, not editable.
 * - Packaging units (Bag, Box, Carton, Pack, Sachet, Bottle) or any other
 *   mismatch: ask "1 <Unit> = ___ <reference unit>" in human terms
 *   (e.g. "1 Bag = 50 kg") and compute the base-unit factor from that.
 * - Anything else (no usable reference at all): falls back to the original
 *   raw numeric factor input.
 */
export function UnitConversionField({
  form,
  index,
  unitsById,
  baseUnit,
}: {
  form: UseFormReturn<CreateProductFormValues>;
  index: number;
  unitsById: Map<string, UnitOption>;
  baseUnit: UnitOption | undefined;
}) {
  const unitId = form.watch(`units.${index}.unitId`);
  const isDefault = form.watch(`units.${index}.isDefault`);
  const currentFactor = form.watch(`units.${index}.conversionFactor`);
  const selectedUnit = unitId ? unitsById.get(unitId) : undefined;

  const sameAutoType =
    !!selectedUnit &&
    !!baseUnit &&
    selectedUnit.type === baseUnit.type &&
    AUTO_CONVERTIBLE_TYPES.has(selectedUnit.type);

  const referenceOptions = useMemo(
    () =>
      baseUnit
        ? Array.from(unitsById.values()).filter(
            (u) => u.type === baseUnit.type && AUTO_CONVERTIBLE_TYPES.has(u.type),
          )
        : [],
    [baseUnit, unitsById],
  );

  const usesHumanInput =
    !isDefault && !!selectedUnit && !!baseUnit && !sameAutoType && referenceOptions.length > 0;

  // User's explicit choice of reference unit, if they've changed the dropdown.
  const [refSymbolOverride, setRefSymbolOverride] = useState<string>("");

  // Default reference unit (kg for weight, L for volume, pc for count) —
  // derived at render time so we never need to setState from an effect.
  const defaultRefSymbol = useMemo(() => {
    if (!usesHumanInput || !baseUnit) return "";
    const preferred = PREFERRED_REFERENCE_SYMBOL[baseUnit.type];
    const fallback = referenceOptions.find((u) => u.symbol === preferred) ?? referenceOptions[0];
    return fallback?.symbol ?? "";
  }, [usesHumanInput, baseUnit, referenceOptions]);

  const refSymbol =
    refSymbolOverride && referenceOptions.some((u) => u.symbol === refSymbolOverride)
      ? refSymbolOverride
      : defaultRefSymbol;

  // Keep the default unit locked at 1, and auto-fill same-type conversions.
  useEffect(() => {
    if (isDefault) {
      if (currentFactor !== 1) form.setValue(`units.${index}.conversionFactor`, 1);
      return;
    }
    if (sameAutoType && selectedUnit && baseUnit) {
      const factor = getAutoConversionFactor(baseUnit.type, selectedUnit.symbol, baseUnit.symbol);
      if (factor !== null && factor !== currentFactor) {
        form.setValue(`units.${index}.conversionFactor`, factor);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDefault, sameAutoType, selectedUnit?.id, baseUnit?.id]);

  if (isDefault) {
    return (
      <div>
        <span className="text-sm font-medium md:hidden">Conversion</span>
        <div className="flex h-10 items-center rounded-lg border border-dashed bg-muted/40 px-3 text-sm text-muted-foreground">
          Base unit (= 1)
        </div>
      </div>
    );
  }

  if (sameAutoType && selectedUnit && baseUnit) {
    const factor = getAutoConversionFactor(baseUnit.type, selectedUnit.symbol, baseUnit.symbol);
    return (
      <div>
        <span className="text-sm font-medium md:hidden">Conversion</span>
        <div className="flex h-10 items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm">
          <span>
            1 {selectedUnit.symbol} = {factor} {baseUnit.symbol}
          </span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">auto</span>
        </div>
      </div>
    );
  }

  if (usesHumanInput && selectedUnit && baseUnit) {
    const refUnit = referenceOptions.find((u) => u.symbol === refSymbol) ?? referenceOptions[0];
    const refToBase = refUnit
      ? getAutoConversionFactor(baseUnit.type, refUnit.symbol, baseUnit.symbol)
      : null;
    const displayValue =
      refToBase && refToBase > 0 && currentFactor
        ? Number((currentFactor / refToBase).toFixed(6))
        : "";

    function handleAmountChange(value: number) {
      if (!refToBase || Number.isNaN(value)) return;
      form.setValue(`units.${index}.conversionFactor`, value * refToBase);
    }

    return (
      <div className="space-y-1">
        <span className="text-sm font-medium md:hidden">
          1 {selectedUnit.symbol} equals
        </span>
        <div className="flex gap-2">
          <Input
            type="number"
            min="0.000001"
            step="any"
            value={displayValue}
            onChange={(e) => handleAmountChange(e.target.valueAsNumber)}
            placeholder="e.g. 50"
            className="flex-1"
          />
          <select
            value={refSymbol}
            onChange={(e) => setRefSymbolOverride(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-2 text-sm"
          >
            {referenceOptions.map((u) => (
              <option key={u.id} value={u.symbol}>
                {u.symbol}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-muted-foreground">
          = {Number(currentFactor || 0).toLocaleString()} {baseUnit.symbol} (base unit)
        </p>
      </div>
    );
  }

  // Fallback — no fixed ratio and no usable reference unit (rare).
  return (
    <div>
      <span className="text-sm font-medium md:hidden">Conversion (base units)</span>
      <Input
        type="number"
        min="0.000001"
        step="any"
        value={currentFactor}
        onChange={(e) => form.setValue(`units.${index}.conversionFactor`, e.target.valueAsNumber)}
        placeholder="e.g. 50 if 1 of this = 50 base units"
      />
    </div>
  );
}
