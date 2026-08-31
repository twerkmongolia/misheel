'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { isLocale, locales, type Locale } from '@/lib/i18n/config'

/**
 * Хэл сонгогч.
 *
 * Товч биш ЖАГСААЛТ: хоёр код ташуу зураасаар тусгаарлагдана. Идэвхтэйг
 * дэвсгэрээр биш гэрэлтүүлэлтээр заана — навбарын бусад зүйлстэй ижил
 * дүрэм. Одоогийн замын хэлний segment-ийг сольж, бусад хэсгийг хадгална.
 */
export function LocaleSwitch({ current }: { current: Locale }) {
  const pathname = usePathname()
  const search = useSearchParams().toString()

  const segments = pathname.split('/')
  const query = search ? `?${search}` : ''

  return (
    <div className="t-label flex items-center gap-1.5">
      {locales.map((locale, index) => {
        const next = [...segments]
        if (isLocale(next[1] ?? '')) next[1] = locale
        else next.splice(1, 0, locale)

        return (
          <span key={locale} className="flex items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden className="text-faint">
                /
              </span>
            )}
            <Link
              href={`${next.join('/')}${query}`}
              aria-current={locale === current ? 'true' : undefined}
              className={`transition-colors duration-200 ${
                locale === current ? 'text-foreground' : 'text-faint hover:text-foreground-soft'
              }`}
            >
              {locale}
            </Link>
          </span>
        )
      })}
    </div>
  )
}
