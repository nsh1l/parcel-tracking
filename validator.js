export function validateTrackingNumber(carrier, cleanedNumber) {
  if ((carrier === "sagawa" || carrier === "yamato") && cleanedNumber.length !== 12) {
    return { isValid: false, message: "配達番号は12桁の数字で入力してください" };
  }
  if (carrier === "japanpost") {
    const ok = /^\d{11}$/.test(cleanedNumber) || /^[A-Za-z]{2}\d{9}JP$/i.test(cleanedNumber);
    if (!ok) {
      return {
        isValid: false,
        message:
          "日本郵便の追跡番号は11桁の数字、または英字2桁+数字9桁+JPの形式で入力してください",
      };
    }
  }
  return { isValid: true };
}
