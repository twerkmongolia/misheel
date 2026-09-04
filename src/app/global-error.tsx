'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { defaultLocale, getDictionary, isLocale } from '@/lib/i18n'
import './globals.css'

/**
 * Хамгийн сүүлийн хил.
 *
 * Энэ нь ҮНДСЭН layout-ыг БҮХЭЛД нь орлоно — тиймээс `<html>`, `<body>`
 * -ийг өөрөө зурах ёстой бөгөөд навбар, хөл, фонтын хувьсагч аль нь ч
 * байхгүй. Зөвхөн `layout.tsx` өөрөө унасан үед л ажиллана: өдөр тутмын
 * алдааг `[locale]/error.tsx` (сайтын хэв маягтай) барина.
 *
 * ⚠️ `next/font` -ийн хувьсагч нь орлуулагдсан layout дээр амьдардаг тул
 * энд БАЙХГҮЙ. Хэв нь эвдрэхгүй: `globals.css` дахь фонтын овог бүр
 * `'Arial Narrow', ui-sans-serif` гэсэн жинхэнэ нөөцтэй (§ § 0).
 *
 * Хэв, өнгө нь дан ганц утилит ангиас ирнэ — энэ файл ямар ч тохиолдолд
 * ажиллах ёстой тул нэмэлт бүрдэл ИМПОРТЛОХГҮЙ. Импорт бүр нь дахин
 * унах бас нэг боломж.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams<{ locale?: string }>()
  const segment = params?.locale ?? ''
  const locale = isLocale(segment) ? segment : defaultLocale
  const t = getDictionary(locale)

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang={locale} className="h-full">
      <body className="flex min-h-full flex-col">
        <main className="shell flex flex-1 flex-col justify-center gap-8 py-24">
          <h1 className="t-h1 max-w-[16ch]">{t.errorPage.title}</h1>
          <p className="t-lead max-w-[52ch] text-foreground-soft">{t.errorPage.body}</p>

          {error.digest && (
            <p className="t-meta text-faint">
              {t.errorPage.digest}: <span className="tabular-nums">{error.digest}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button type="button" onClick={reset} className="btn btn-solid">
              {t.errorPage.retry}
            </button>
            {/* `next/link` БИШ энгийн `<a>`: бүтэн ачаалал нь router-ийн
                эвдэрсэн төлөвийг цэвэрлэнэ. */}
            <a href={`/${locale}`} className="btn btn-line">
              {t.errorPage.home}
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
