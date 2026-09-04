'use client'

import { useParams } from 'next/navigation'
import { ButtonLink, Eyebrow } from '@/components/ui'
import { defaultLocale, getDictionary, isLocale } from '@/lib/i18n'

/**
 * Хэлний хэсгийн 404.
 *
 * `notFound()` нь энэ сайтад бараг хуудас болгоноос дуудагдана — буруу
 * хэл, устсан бүтээгдэхүүн, байхгүй багш. Өмнө нь тэдгээр нь бүгд Next-ийн
 * анхдагч 404 руу унадаг байсан: навбаргүй, хөлгүй, хэлгүй, цааш явах
 * замгүй цагаан хуудас.
 *
 * Одоо энэ нь `[locale]/layout.tsx` -ийн дотор зурагдана — навбар, хөл,
 * хэл сонгогч бүгд байрандаа. 404 бол мухар БИШ, зүгээр л буруу эргэлт.
 *
 * Client Component: 404 хуудас props хүлээж авдаггүй тул зам дахь хэлийг
 * `useParams` -аар уншина.
 */
export default function LocaleNotFound() {
  const params = useParams<{ locale: string }>()
  const segment = params.locale ?? ''
  const locale = isLocale(segment) ? segment : defaultLocale
  const t = getDictionary(locale)

  return (
    <div className="shell flex flex-col gap-9 pt-16 sm:pt-24">
      <Eyebrow>{t.errorPage.notFoundCode}</Eyebrow>

      <h1 className="t-h1 max-w-[16ch]">{t.errorPage.notFoundTitle}</h1>
      <p className="t-lead max-w-[52ch] text-foreground-soft">{t.errorPage.notFoundBody}</p>

      {/* Хоёр зам санал болгоно: нүүр, ба хамгийн олон хайгддаг хуудас.
          «Буцах» товч энд БАЙХГҮЙ — хэрэглэгч дөнгөж сая тэндээс ирсэн. */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <ButtonLink href={`/${locale}`}>{t.errorPage.home}</ButtonLink>
        <ButtonLink href={`/${locale}/courses`} variant="secondary">
          {t.nav.courses}
        </ButtonLink>
      </div>
    </div>
  )
}
