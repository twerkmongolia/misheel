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
