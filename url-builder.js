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

export function formatUrlDisplay(carrier, trackingNumber, url) {
  const carrierLabel = getCarrierLabel(carrier);
  const label = getTrackingLabel(carrier);
  return `<span style="color: black;">${carrierLabel} | ${label} ${trackingNumber} <br></span><a href="${url}" target="_blank" style="color: blue; text-decoration: underline;">${url}</a>`;
}
