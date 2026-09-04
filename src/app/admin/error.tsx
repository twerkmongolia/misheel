'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Удирдлагын алдааны хил.
 *
 * `AdminShell` -ийн ДОТОР ажиллана — зүүн цэс байрандаа үлдэх тул ажилтан
 * эвдэрсэн хуудсаас өөр зүг рүү нэг даралтаар явна.
 *
 * Удирдлага нь зөвхөн монголоор (§ proxy.ts `NON_LOCALIZED`) тул толь
 * бичиг хэрэггүй — үлдсэн админы файлуудтай ижил.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col gap-5 py-10">
      <h1 className="t-h2">Алдаа гарлаа</h1>
      <p className="t-small max-w-[56ch] text-foreground-soft">
        Энэ хуудсыг ачаалах үед алдаа гарлаа. Дахин оролдоод үзнэ үү.
      </p>

      {error.digest && (
        <p className="t-meta text-faint">
          Алдааны дугаар: <span className="tabular-nums">{error.digest}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <button type="button" onClick={reset} className="btn btn-solid btn-sm">
          Дахин оролдох
        </button>
        <Link href="/admin" className="btn btn-line btn-sm">
          Хяналтын самбар
        </Link>
      </div>
    </div>
  )
}
