import "server-only"
import { createHmac, randomBytes } from "crypto"

// ─── TOTP implementation (RFC 6238) using Node.js built-in crypto ─────────────
// No external dependencies required.

const TOTP_STEP    = 30       // 30-second window
const TOTP_DIGITS  = 6        // 6-digit code
const TOTP_WINDOW  = 1        // Accept 1 step before/after (clock skew)
const BACKUP_CODES = 8        // Number of backup codes to generate

// Base32 charset (RFC 4648)
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

/**
 * Encodes a buffer to Base32 string (Google Authenticator compatible).
 */
export function base32Encode(buf: Buffer): string {
  let bits = 0
  let value = 0
  let output = ""

  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31]
  }
  return output
}

/**
 * Decodes a Base32 string to Buffer.
 */
export function base32Decode(str: string): Buffer {
  const s = str.replace(/=+$/, "").toUpperCase()
  const bytes: number[] = []
  let bits = 0
  let value = 0

  for (const char of s) {
    const idx = BASE32_CHARS.indexOf(char)
    if (idx < 0) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

/**
 * Generates a HOTP code for a given counter value.
 */
function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8)
  let tmp = counter
  for (let i = 7; i >= 0; i--) {
    buf[i] = tmp & 0xff
    tmp = Math.floor(tmp / 256)
  }

  const hmac    = createHmac("sha1", secret).update(buf).digest()
  const offset  = hmac[hmac.length - 1] & 0x0f
  const code    = ((hmac[offset] & 0x7f) << 24)
                | (hmac[offset + 1] << 16)
                | (hmac[offset + 2] << 8)
                |  hmac[offset + 3]

  return String(code % Math.pow(10, TOTP_DIGITS)).padStart(TOTP_DIGITS, "0")
}

/**
 * Generates the current TOTP code for a secret.
 */
export function generateTOTP(base32Secret: string, time?: number): string {
  const secret  = base32Decode(base32Secret)
  const counter = Math.floor((time ?? Date.now()) / 1000 / TOTP_STEP)
  return hotp(secret, counter)
}

/**
 * Verifies a TOTP code against a secret, with clock-skew window.
 * Returns true if valid.
 */
export function verifyTOTP(base32Secret: string, code: string): boolean {
  const secret  = base32Decode(base32Secret)
  const now     = Math.floor(Date.now() / 1000 / TOTP_STEP)

  for (let delta = -TOTP_WINDOW; delta <= TOTP_WINDOW; delta++) {
    if (hotp(secret, now + delta) === code.replace(/\s/g, "")) {
      return true
    }
  }
  return false
}

/**
 * Generates a new random TOTP secret (Base32 encoded, 20 bytes = 160 bits).
 */
export function generateTOTPSecret(): string {
  return base32Encode(randomBytes(20))
}

/**
 * Generates backup codes (cryptographically random 8-character alphanumeric strings).
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < BACKUP_CODES; i++) {
    const raw   = randomBytes(5).toString("hex").toUpperCase().slice(0, 8)
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4)}`)
  }
  return codes
}

/**
 * Builds the otpauth:// URI for QR code generation.
 */
export function buildOTPAuthURI(
  secret: string,
  email: string,
  issuer = "Magic Funnel"
): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits:    String(TOTP_DIGITS),
    period:    String(TOTP_STEP),
  })
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?${params.toString()}`
}
