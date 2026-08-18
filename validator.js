import { CARRIERS } from "./carrier.js";

const MIN_TRACKING_NUMBER_LENGTH = 10;
const MAX_TRACKING_NUMBER_LENGTH = 40;

export function validateTrackingNumber(carrier, cleanedNumber) {
  const config = CARRIERS[carrier];
  if (!config) return { isValid: false, message: "不明な配送業者です" };

  const normalizedNumber = String(cleanedNumber ?? "")
    .replace(/-/g, "")
    .trim()
    .toUpperCase();
  const hasValidSyntax =
    /^[A-Z0-9]+$/.test(normalizedNumber) &&
    normalizedNumber.length >= MIN_TRACKING_NUMBER_LENGTH &&
    normalizedNumber.length <= MAX_TRACKING_NUMBER_LENGTH;

  if (!hasValidSyntax || (config.detect && !config.detect.test(normalizedNumber))) {
    return {
      isValid: false,
      message: `${config.label}の追跡番号は${config.formatHint || "正しい形式"}で入力してください`,
    };
  }

  return { isValid: true };
}
