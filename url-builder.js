import { CARRIERS } from "./carrier.js";

export function buildUrl(carrier, cleanedNumber) {
  return CARRIERS[carrier]?.buildUrl(cleanedNumber) ?? null;
}

export function getCarrierLabel(carrier) {
  return CARRIERS[carrier]?.label ?? carrier;
}

export function getTrackingLabel(carrier) {
  return carrier === "dhl" ? "Waybill No." : "お問合せNo.";
}

/**
 * Build the metadata suffix string from optional fields.
 * Format: | 指定日・時間帯 | XXサイズ | XX個口
 * Empty fields are omitted. Returns empty string if all fields empty.
 */
export function buildMetaSuffix(dateSlot, size, itemCount) {
  const parts = [];
  if (dateSlot) parts.push(dateSlot);
  if (size) parts.push(`${size}サイズ`);
  if (itemCount) parts.push(`${itemCount}個口`);
  if (parts.length === 0) return "";
  return " | " + parts.join(" | ");
}

/**
 * Build the direction prefix: "発送 | " or "受取 | " or "".
 */
export function buildDirectionPrefix(direction) {
  if (direction === "shipping") return "発送 | ";
  if (direction === "receiving") return "受取 | ";
  return "";
}

/**
 * Build the full plain-text line for "テキスト全体をコピー".
 * Format: [発送|受取] CarrierLabel | お問合せNo. XXXXXXXXXX | 指定日・時間帯 | XXサイズ | XX個口
 *          URL
 */
export function buildPlainText(direction, dateSlot, size, itemCount, carrier, trackingNumber, url) {
  const dirPrefix = buildDirectionPrefix(direction);
  const suffix = buildMetaSuffix(dateSlot, size, itemCount);
  const carrierLabel = getCarrierLabel(carrier);
  const label = getTrackingLabel(carrier);
  return `${dirPrefix}${carrierLabel} | ${label} ${trackingNumber}${suffix}\n${url}`;
}

export function formatUrlDisplay(carrier, trackingNumber, url, direction = "", dateSlot = "", size = "", itemCount = "") {
  const dirPrefix = buildDirectionPrefix(direction);
  const suffix = buildMetaSuffix(dateSlot, size, itemCount);
  const carrierLabel = getCarrierLabel(carrier);
  const label = getTrackingLabel(carrier);
  return `<span style="color: black;">${dirPrefix}${carrierLabel} | ${label} ${trackingNumber}${suffix} <br></span><a href="${url}" target="_blank" style="color: blue; text-decoration: underline;">${url}</a>`;
}
