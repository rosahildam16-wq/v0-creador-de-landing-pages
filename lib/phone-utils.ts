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

export function guessCountryFromPhone(phone: string): string {
  if (!phone.startsWith("+")) return "Otro"

  const codes: Record<string, string> = {
    "+52": "Mexico",
    "+57": "Colombia",
    "+51": "Peru",
    "+54": "Argentina",
    "+56": "Chile",
    "+593": "Ecuador",
    "+34": "España",
    "+1": "USA",
    "+58": "Venezuela",
    "+502": "Guatemala",
    "+506": "Costa Rica",
    "+507": "Panama",
    "+591": "Bolivia",
    "+595": "Paraguay",
    "+598": "Uruguay",
    "+504": "Honduras",
    "+505": "Nicaragua",
    "+503": "El Salvador",
    "+55": "Brasil",
  }

  // Check 4-digit prefixes (like +1809) then 3-digit then 2-digit
  for (let len = 5; len >= 2; len--) {
    const prefix = phone.slice(0, len)
    if (codes[prefix]) return codes[prefix]
  }

  return "Otro"
}
