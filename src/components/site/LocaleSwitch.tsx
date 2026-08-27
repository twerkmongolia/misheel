'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { isLocale, locales, type Locale } from '@/lib/i18n/config'

/** Одоогийн замын хэлний segment-ийг сольж, бусад хэсгийг хадгална. */
export function LocaleSwitch({ current }: { current: Locale }) {
  const pathname = usePathname()
  const search = useSearchParams().toString()

  const segments = pathname.split('/')
  const query = search ? `?${search}` : ''

  return (
    <div className="flex items-center gap-0.5 text-xs font-medium">
      {locales.map((locale) => {
        const next = [...segments]
        if (isLocale(next[1] ?? '')) next[1] = locale
        else next.splice(1, 0, locale)

        return (
          <Link
            key={locale}
            href={`${next.join('/')}${query}`}
            aria-current={locale === current ? 'true' : undefined}
            className={`rounded px-2 py-1 uppercase transition-colors ${
              locale === current ? 'bg-surface-2 text-foreground' : 'text-muted hover:text-foreground'
            }`}
          >
            {locale}
          </Link>
        )
      })}
    </div>
  )
}
