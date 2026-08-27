export const locales = ['mn', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'mn'

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

/** `Accept-Language` толгойгоос хэлийг таана. */
export function pickLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale
  for (const part of acceptLanguage.split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase() ?? ''
    if (tag.startsWith('mn')) return 'mn'
    if (tag.startsWith('en')) return 'en'
  }
  return defaultLocale
}
