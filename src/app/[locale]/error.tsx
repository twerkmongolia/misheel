'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button, ButtonLink, Eyebrow } from '@/components/ui'
import { defaultLocale, getDictionary, isLocale } from '@/lib/i18n'

/**
 * Хэлний хэсгийн алдааны хил.
 *
 * ── Яагаад энд, `app/` -ийн үндэсд биш ─────────────────────────────────
 * Энэ хил нь `[locale]/layout.tsx` -ийн ДОТОР ажилладаг тул навбар, хөл,
 * хэл сонгогч бүгд байрандаа үлдэнэ: хэрэглэгч эвдэрсэн хуудсанд гацахгүй,
 * ямар ч цэснээс цааш явж чадна. Layout ӨӨРӨӨ унасан тохиолдлыг зөвхөн
 * `app/global-error.tsx` барина (тэнд навбар байхгүй тул хамаагүй нүцгэн).
 *
 * ── `useParams` ────────────────────────────────────────────────────────
 * Алдааны хил нь ЗААВАЛ Client Component байх ёстой (`reset` нь функц),
 * тиймээс `params` -ыг props-оор авахгүй. Зам дахь хэлийг эндээс уншина —
 * буруу утга ирвэл монгол руу унана.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams<{ locale: string }>()
  const segment = params.locale ?? ''
  const locale = isLocale(segment) ? segment : defaultLocale
  const t = getDictionary(locale)

  useEffect(() => {
    // Хөтчийн консол дээр л үлдэнэ. Сервер талын мөр Next-ийн лог руу
    // аль хэдийн бичигдсэн байгаа — `digest` нь хоёрыг холбоно.
    console.error(error)
  }, [error])

  return (
    <div className="shell flex flex-col gap-9 pt-16 sm:pt-24">
      <Eyebrow>{t.errorPage.digest.toUpperCase()}</Eyebrow>

      <h1 className="t-h1 max-w-[16ch]">{t.errorPage.title}</h1>
      <p className="t-lead max-w-[52ch] text-foreground-soft">{t.errorPage.body}</p>

      {/* `digest` нь серверийн лог дахь мөртэй тохирох ганц утга. Хэрэглэгч
          бидэнд бичихэд энэ дугаар байвал хайлт хормын зуур болно. */}
      {error.digest && (
        <p className="t-meta text-faint">
          {t.errorPage.digest}: <span className="tabular-nums">{error.digest}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button onClick={reset}>{t.errorPage.retry}</Button>
        <ButtonLink href={`/${locale}`} variant="secondary">
          {t.errorPage.home}
        </ButtonLink>
      </div>
    </div>
  )
}
