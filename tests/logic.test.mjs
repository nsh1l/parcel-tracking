import { describe, expect, test } from "bun:test";
import { detectCarrier } from "../detector.js";
import { validateTrackingNumber } from "../validator.js";
import { buildUrl, format } from "../url-builder.js";

describe("parcel tracking domain logic", () => {
  test("detects unique carrier formats without guessing ambiguous 12-digit numbers", () => {
    expect(detectCarrier("RR123456789JP")).toBe("japanpost");
    expect(detectCarrier("1234567890")).toBeNull();
    expect(detectCarrier("4044028295")).toBeNull();
    expect(detectCarrier("DT123456789012")).toBe("fedex");
    expect(detectCarrier("12345678901")).toBeNull();
    expect(detectCarrier("SF1234567890123")).toBe("sfexpress");
    expect(detectCarrier("123456789012")).toBeNull();
  });

  test("validates every configured carrier format", () => {
    const validNumbers = {
      sagawa: "1234567890",
      yamato: "12345678901",
      seino: "1234567890",
      fukutsu: "12345678901",
      okaken: "4044028295",
      dhl: "1234567890",
      fedex: "DT123456789012",
      ocs: "12345678901",
      ydh: "YDHABC1234",
      japanpost: "RR123456789JP",
      sfexpress: "SF1234567890123",
    };

    for (const [carrier, number] of Object.entries(validNumbers)) {
      expect(validateTrackingNumber(carrier, number).isValid).toBe(true);
    }

    const invalidNumbers = {
      sagawa: "12345678901",
      yamato: "1234567890",
      seino: "12345678901",
      fukutsu: "123456789012",
      okaken: "40440282950",
      dhl: "123456789012",
      fedex: "1234567890123",
      ocs: "1234567890",
      ydh: "YDH",
      japanpost: "1234567890",
      sfexpress: "SF123456789012",
    };

    for (const [carrier, number] of Object.entries(invalidNumbers)) {
      expect(validateTrackingNumber(carrier, number).isValid).toBe(false);
    }

    expect(validateTrackingNumber("unknown", "123456789012").isValid).toBe(false);
    expect(validateTrackingNumber("sagawa", "1234+567890").isValid).toBe(false);
  });

  test("builds a safe URL and preserves the readable share format", () => {
    const url = buildUrl("sagawa", "1234-5678-9012");
    expect(url).toContain("123456789012");
    expect(
      format({
        carrier: "sagawa",
        number: "1234-5678-9012",
        dateSlot: "6/25 午前",
        size: "80",
        itemCount: "2",
      }),
    ).toContain("佐川急便 | 6/25 午前着 | 80サイズ | 2個口 | お問合せNo. 1234-5678-9012");
  });
});
