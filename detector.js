import { CARRIERS } from "./carrier.js";

// Detection order: most unique pattern first
const DETECT_ORDER = ["japanpost", "dhl"];

/**
 * Detect carrier from tracking number.
 * Returns carrier key if unique match, null if ambiguous.
 */
export function detectCarrier(number) {
  const cleaned = number.replace(/-/g, "").trim().toUpperCase();
  if (!cleaned) return null;

  for (const key of DETECT_ORDER) {
    const cfg = CARRIERS[key];
    if (cfg.detect && cfg.detect.test(cleaned)) {
      return key;
    }
  }

  // 12-digit numbers match sagawa/yamato/seino/fukutsu/okaken/ydh
  // Too many conflicts → not detected automatically
  return null;
}
