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
 * Build the metadata prefix string from optional fields.
 * Format: [発送|受取] 指定日・時間帯 | サイズ | 個口数 |
 * Empty fields are omitted. Returns empty string if all fields empty.
 */
export function buildMetaPrefix(direction, dateSlot, size, itemCount) {
  const parts = [];
  if (direction === "shipping") parts.push("発送");
  else if (direction === "receiving") parts.push("受取");
  if (dateSlot) parts.push(dateSlot);
  if (size) parts.push(`${size}サイズ`);
  if (itemCount) parts.push(`${itemCount}個口`);
  if (parts.length === 0) return "";
  return parts.join(" | ") + " | ";
}

/**
 * Build the full plain-text line for "テキスト全体をコピー".
 * Format: [発送|受取] 指定日・時間帯 | サイズ | 個口数 | CarrierLabel | お問合せNo. XXXXXXXXXX
 *          URL
 */
export function buildPlainText(direction, dateSlot, size, itemCount, carrier, trackingNumber, url) {
  const prefix = buildMetaPrefix(direction, dateSlot, size, itemCount);
  const carrierLabel = getCarrierLabel(carrier);
  const label = getTrackingLabel(carrier);
  return `${prefix}${carrierLabel} | ${label} ${trackingNumber}\n${url}`;
}

export function formatUrlDisplay(carrier, trackingNumber, url, direction = "", dateSlot = "", size = "", itemCount = "") {
  const prefix = buildMetaPrefix(direction, dateSlot, size, itemCount);
  const carrierLabel = getCarrierLabel(carrier);
  const label = getTrackingLabel(carrier);
  return `<span style="color: black;">${prefix}${carrierLabel} | ${label} ${trackingNumber} <br></span><a href="${url}" target="_blank" style="color: blue; text-decoration: underline;">${url}</a>`;
}
