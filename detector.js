import { CARRIERS } from "./carrier.js";

/**
 * Detect carrier from tracking number.
 * Returns a carrier key only when exactly one configured format matches.
 * Ambiguous formats stay manual instead of being guessed.
 */
export function detectCarrier(number) {
  const cleaned = String(number ?? "").replace(/-/g, "").trim().toUpperCase();
  if (!cleaned) return null;

  let match = null;
  for (const [key, config] of Object.entries(CARRIERS)) {
    if (!config.detect?.test(cleaned)) continue;
    if (match) return null;
    match = key;
  }

  return match;
}
