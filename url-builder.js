import { CARRIERS } from "./carrier.js";

/** Build a tracking URL from carrier key + tracking number (hyphens auto-stripped). */
export function buildUrl(carrier, number) {
  return CARRIERS[carrier]?.buildUrl(number.replace(/-/g, "")) ?? null;
}

/** Get carrier display label. Falls back to the raw key if not found. */
export function carrierLabel(carrier) {
  return CARRIERS[carrier]?.label ?? carrier;
}

/* ── internals (not exported) ── */

function trackingLabel(carrier) {
  return carrier === "dhl" ? "Waybill No." : "お問合せNo.";
}

function buildMetaMiddle(dateSlot, size, itemCount) {
  const parts = [];
  if (dateSlot) parts.push(`${dateSlot}着`);
  if (size) parts.push(`${size}サイズ`);
  if (itemCount) parts.push(`${itemCount}個口`);
  if (parts.length === 0) return "";
  return " | " + parts.join(" | ");
}

/* ── public formatter ── */

/**
 * Format a tracking record as plain text or HTML.
 *
 * @param {Object} record
 * @param {string} record.carrier       - carrier key (e.g. "sagawa")
 * @param {string} record.number        - tracking number (hyphens OK, shown as-is)
 * @param {string} [record.dateSlot]    - 指定日・時間帯
 * @param {string} [record.size]        - サイズ (number string)
 * @param {string} [record.itemCount]   - 個口数 (number string)
 * @param {"plain"|"html"} [record.format="plain"] - output format
 * @returns {string}
 *
 * Plain:  "佐川急便 | 6/25 午前着 | 80サイズ | 2個口 | お問合せNo. 123456789012\nhttps://..."
 * HTML:   '<span style="color: black;">佐川急便 | ... <br></span><a href="..." ...>...</a>'
 */
export function format(record) {
  const {
    carrier,
    number,
    dateSlot = "",
    size = "",
    itemCount = "",
    format: fmt = "plain",
  } = record;

  const url = buildUrl(carrier, number);
  const label = carrierLabel(carrier);
  const tLabel = trackingLabel(carrier);
  const middle = buildMetaMiddle(dateSlot, size, itemCount);
  const head = `${label}${middle} | ${tLabel} ${number}`;

  if (fmt === "html") {
    return `<span style="color: black;">${head} <br></span><a href="${url}" target="_blank" style="color: blue; text-decoration: underline;">${url}</a>`;
  }
  return `${head}\n${url}`;
}