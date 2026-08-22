/**
 * Canonical conversion ratios for unit *types* that have a fixed,
 * real-world relationship — these never vary by product, so the user
 * should never have to type them in manually.
 *
 * Each table is keyed by unit symbol (matching supabase/migrations/seed_units.sql)
 * and gives "how many of the canonical unit does 1 of this unit equal".
 *
 * Packaging units (Bag, Box, Carton, Pack, Sachet, Bottle) are deliberately
 * excluded — a "bag" means a different weight for every product, so there is
 * no fixed ratio to look up. Those are handled with a "1 Bag = ___ kg"-style
 * input in the UI instead (see UnitConversionField).
 */
export const CANONICAL_UNIT_RATIOS: Record<string, Record<string, number>> = {
  weight: { mg: 0.001, g: 1, kg: 1000 },
  volume: { ml: 1, L: 1000 },
  count: { pc: 1, dz: 12 },
};

/** Unit types that have a fixed lookup table and should never be hand-typed. */
export const AUTO_CONVERTIBLE_TYPES = new Set(Object.keys(CANONICAL_UNIT_RATIOS));

/**
 * Returns the conversion factor from `fromSymbol` to `toSymbol`, i.e. how many
 * `toSymbol` units equal 1 `fromSymbol` unit — or null if either symbol isn't
 * in a known canonical table, or they belong to different types.
 */
export function getAutoConversionFactor(
  type: string,
  fromSymbol: string,
  toSymbol: string,
): number | null {
  const table = CANONICAL_UNIT_RATIOS[type];
  if (!table) return null;
  const from = table[fromSymbol];
  const to = table[toSymbol];
  if (from === undefined || to === undefined) return null;
  return from / to;
}

/** Preferred "human" unit to ask packaging quantities in, per type. */
export const PREFERRED_REFERENCE_SYMBOL: Record<string, string> = {
  weight: "kg",
  volume: "L",
  count: "pc",
};
