import type { Dictionary } from '@/lib/i18n/dictionaries'

/**
 * Postgres функцээс ирсэн алдааны кодыг хэрэглэгчийн хэл рүү хөрвүүлнэ.
 *
 * Эдгээр нь цэвэр функц тул `'use server'` файлд байрлаж болохгүй —
 * тэнд зөвхөн async Server Action export хийхийг зөвшөөрдөг.
 */

export function bookingErrorMessage(t: Dictionary, code: string): string {
  const messages = t.booking.errors as Record<string, string>
  return messages[code] ?? messages.UNKNOWN ?? ''
}

export function orderErrorMessage(t: Dictionary, code: string): string {
  const messages = t.shop.errors as Record<string, string>
  return messages[code] ?? messages.UNKNOWN ?? ''
}
