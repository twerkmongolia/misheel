export const locales = ['mn', 'en'] as const
export type Locale = (typeof locales)[number]
/**
 * Үндсэн хэл — МОНГОЛ.
 *
 * Хөтчийн `Accept-Language` -ийг зориудаар ҮЛ ХАРГАЛЗАНА. Улаанбаатарын
 * студийн сайт англи хэлтэй хөтөч дээр ч монголоор нээгдэх ёстой; англи
 * хувилбар нь хэрэглэгчийн шууд сонголт байна.
 */
export const defaultLocale: Locale = 'mn'

/** Хэрэглэгч хэлээ сольсон бол тэр сонголтыг эндээс санана. */
export const LOCALE_COOKIE = 'locale'

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}
