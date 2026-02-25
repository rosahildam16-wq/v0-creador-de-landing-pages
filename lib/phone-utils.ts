/**
 * Normalizes a phone number to E.164 format.
 *
 * Rules:
 * - If the number already starts with +, keep it as-is (just strip non-digits after +).
 * - If the number has no +, prepend the defaultCountryCode.
 * - Always strip spaces, dashes, parentheses.
 *
 * Examples:
 *   normalizePhone("300 111 2233", "+57")  → "+573001112233"
 *   normalizePhone("+52 55 1234 5678")     → "+525512345678"
 *   normalizePhone("(300) 111-2233", "+57") → "+573001112233"
 */
export function normalizePhone(raw: string, defaultCountryCode = "+57"): string {
  if (!raw) return ""

  // Strip everything except digits and leading +
  const stripped = raw.replace(/[\s\-()]/g, "")

  if (stripped.startsWith("+")) {
    // Already has country code – just keep digits after +
    return "+" + stripped.slice(1).replace(/\D/g, "")
  }

  // No country code – prepend default
  const digitsOnly = stripped.replace(/\D/g, "")
  const code = defaultCountryCode.startsWith("+") ? defaultCountryCode : `+${defaultCountryCode}`

  return code + digitsOnly
}
