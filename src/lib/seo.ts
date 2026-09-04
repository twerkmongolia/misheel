import type { Metadata } from 'next'
import { locales, type Locale } from './i18n/config'

/* ═══════════════════════════════════════════════════════════════════════════
   ХАЙЛТ БА ХУВААЛЦЛАГА

   Өмнө нь метадата зөвхөн `app/layout.tsx` дээр байсан: 26 хуудас БҮГД
   «Twerk Mongolia» гэсэн ижил гарчигтай, тайлбаргүй, зурагггүй. Хайлтын
   үр дүнд ялгагдахгүй, Facebook эсвэл Messenger-т хуваалцахад хоосон
   тэгш өнцөгт гарна.

   Энэ файл нь ГАНЦ эх сурвалж: хуудас бүр `pageMetadata()` дуудаад
   гарчиг, зам хоёроо л өгнө. Canonical, hreflang, OpenGraph бүгд эндээс
   ижил дүрмээр үүснэ — хуудас нэмэгдэх бүрд эдгээрийг санах шаардлагагүй.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Сайтын үндсэн хаяг.
 *
 * `metadataBase` -тэй нэг эх сурвалжтай байх ёстой (§ app/layout.tsx) —
 * эс бөгөөс canonical нэг домэйн, OpenGraph өөр домэйн заана.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/** OpenGraph -ийн хэлний код. Facebook `mn` биш `mn_MN` хүлээж авна. */
const ogLocale: Record<Locale, string> = { mn: 'mn_MN', en: 'en_US' }

/**
 * Хуудасны метадата.
 *
 * `path` нь ХЭЛГҮЙ зам: `''` (нүүр), `'/shop'`, `'/courses/twerk-101'`.
 * Хэлийг энэ функц өөрөө наана — дуудлагын газарт `/${locale}` бичих
 * бүрд нэг нь мартагдаж, canonical буруу хэл рүү заадаг.
 */
export function pageMetadata({
  locale,
  title,
  description,
  path = '',
  image,
  noIndex = false,
}: {
  locale: Locale
  /** `%s · Twerk Mongolia` загварт орох хэсэг. Нүүр хуудсанд `null`. */
  title: string | null
  description: string
  path?: string
  /** `/media/...` -аас эхэлсэн зам. Байхгүй бол баатрын зураг. */
  image?: string | null
  /** Хувийн хуудас — хайлтад орох ёсгүй. */
  noIndex?: boolean
}): Metadata {
  const canonical = `/${locale}${path}`

  /**
   * hreflang.
   *
   * Хоёр хэл нэг агуулгыг харуулж байгааг хайлтын системд ХЭЛЭХГҮЙ бол
   * тэдгээр нь бие биенийхээ давхардал мэт үнэлэгдэж, аль нэг нь л
   * индексэд үлдэнэ. `x-default` нь хэлээ сонгоогүй хүнд аль хувилбарыг
   * үзүүлэхийг заана — энэ сайтын хувьд монгол (§ i18n/config).
   */
  const languages = Object.fromEntries([
    ...locales.map((code) => [code, `/${code}${path}`]),
    ['x-default', `/mn${path}`],
  ])

  const ogImage = image ?? '/media/hero.jpg'

  return {
    title,
    description,
    alternates: { canonical, languages },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: 'website',
      siteName: 'Twerk Mongolia',
      title: title ?? 'Twerk Mongolia',
      description,
      url: canonical,
      locale: ogLocale[locale],
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: title ?? 'Twerk Mongolia',
      description,
      images: [ogImage],
    },
  }
}

/**
 * Хувийн хэсгүүд — бүртгэл, сагс, төлбөр, удирдлага.
 *
 * Эдгээр нь индексэд орох ёсгүй: агуулга нь нэвтэрсэн хүн тус бүрд өөр,
 * хайлтын үр дүнд гарвал зөвхөн нэвтрэх хуудас руу хөтөлнө. Тайлбар,
 * OpenGraph шаардахгүй тул тусад нь энгийн функц.
 */
export function privateMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false } }
}
