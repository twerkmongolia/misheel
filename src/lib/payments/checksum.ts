import { createHmac, timingSafeEqual } from 'node:crypto'

/** Bonum-ийн `x-checksum-v2` header-т ашиглагддаг арга: түүхий body дээрх HMAC-SHA256 (hex). */
export function sign(rawBody: string, key: string): string {
  return createHmac('sha256', key).update(rawBody, 'utf8').digest('hex')
}

/** Цагийн зөрүүгээр түлхүүр таах халдлагаас сэргийлж тогтмол хугацаанд харьцуулна. */
export function verify(rawBody: string, key: string, received: string | null): boolean {
  if (!received) return false

  const expected = Buffer.from(sign(rawBody, key), 'utf8')
  const actual = Buffer.from(received.trim().toLowerCase(), 'utf8')

  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}
