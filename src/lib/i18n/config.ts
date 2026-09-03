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

/**
 * Хэлний ӨӨРИЙНХ нь нэр — «Mongolian» биш «Монгол».
 *
 * Хэл сонгогч нь одоо ойлгохгүй байгаа хэлээ хайж буй хүнд зориулагдсан:
 * жагсаалт хэрэглэгчийн ОДООГИЙН хэлээр орчуулагдвал тэр хүн өөрийн хэлээ
 * танихгүй өнгөрнө. Тиймээс энэ хоёр нэр толь бичигт БИШ, эндээ байна —
 * хэлнээс үл хамааран нэг л хэвээр үлдэнэ.
 */
export const localeNames: Record<Locale, string> = {
  mn: 'Монгол',
  en: 'English',
}
