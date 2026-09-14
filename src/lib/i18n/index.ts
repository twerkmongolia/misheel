export * from './config'
export * from './dictionaries'

/**
 * DB мөрөөс тухайн хэлний талбарыг авна: `loc(row, 'name', 'en')` → `name_en`.
 * Англи талбар хоосон бол монголоор нь буцаана.
 */
export function loc<
  Row extends Record<string, unknown>,
  Field extends string,
>(row: Row, field: Field, locale: 'mn' | 'en'): string {
  const localized = row[`${field}_${locale}` as keyof Row]
  if (typeof localized === 'string' && localized.trim() !== '') return localized

  const fallback = row[`${field}_mn` as keyof Row]
  return typeof fallback === 'string' ? fallback : ''
}

/**
 * `loc` -ийн жагсаалт хувилбар: `locList(row, 'background', 'en')` → `background_en`.
 *
 * Хоосон МАССИВ нь хоосон мөртэй ижил утгатай — «энэ хэлээр бичээгүй». Тиймээс
 * `loc` -той яг ижил дүрмээр монгол руу ухарна: орчуулга хүлээж хоосон хэсэг
 * үзүүлэхээс монголоор нь харуулсан нь дээр.
 */
export function locList<
  Row extends Record<string, unknown>,
  Field extends string,
>(row: Row, field: Field, locale: 'mn' | 'en'): string[] {
  const localized = row[`${field}_${locale}` as keyof Row]
  if (Array.isArray(localized) && localized.length > 0) return localized as string[]

  const fallback = row[`${field}_mn` as keyof Row]
  return Array.isArray(fallback) ? (fallback as string[]) : []
}

/** site_content мөрөөс тухайн хэлний jsonb-г авна. */
export function content(
  row: { value_mn: Record<string, string | number>; value_en: Record<string, string | number> } | null | undefined,
  locale: 'mn' | 'en',
): Record<string, string | number> {
  if (!row) return {}
  const value = locale === 'en' ? row.value_en : row.value_mn
  if (!value || Object.keys(value).length === 0) return row.value_mn ?? {}
  return value
}
