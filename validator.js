export function validateTrackingNumber(carrier, cleanedNumber) {
  if ((carrier === "sagawa" || carrier === "yamato") && cleanedNumber.length !== 12) {
    return { isValid: false, message: "配達番号は12桁の数字で入力してください" };
  }
  return { isValid: true };
}
