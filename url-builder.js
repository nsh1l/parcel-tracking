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
 * Build the metadata infix string from optional fields (between carrier and tracking number).
 * Format: | 指定日・時間帯 | XXサイズ | XX個口
 * Empty fields are omitted. Returns empty string if all fields empty.
 */
export function buildMetaInfix(dateSlot, size, itemCount) {
  const parts = [];
  if (dateSlot) parts.push(dateSlot);
  if (size) parts.push(`${size}サイズ`);
  if (itemCount) parts.push(`${itemCount}個口`);
  if (parts.length === 0) return "";
  return " | " + parts.join(" | ") + " | ";
}

/**
 * Build the full plain-text line for "テキスト全体をコピー".
 * Format: CarrierLabel | 指定日・時間帯 | XXサイズ | XX個口 | お問合せNo. XXXXXXXXXX
 *          URL
 */
export function buildPlainText(direction, dateSlot, size, itemCount, carrier, trackingNumber, url) {
  const infix = buildMetaInfix(dateSlot, size, itemCount);
  const carrierLabel = getCarrierLabel(carrier);
  const label = getTrackingLabel(carrier);
  return `${carrierLabel}${infix}${label} ${trackingNumber}\n${url}`;
}

export function formatUrlDisplay(carrier, trackingNumber, url, direction = "", dateSlot = "", size = "", itemCount = "") {
  const infix = buildMetaInfix(dateSlot, size, itemCount);
  const carrierLabel = getCarrierLabel(carrier);
  const label = getTrackingLabel(carrier);
  return `<span style="color: black;">${carrierLabel}${infix}${label} ${trackingNumber} <br></span><a href="${url}" target="_blank" style="color: blue; text-decoration: underline;">${url}</a>`;
}
