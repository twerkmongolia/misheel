import Link from 'next/link'
import { content, getDictionary, type Locale } from '@/lib/i18n'
import { getSiteContent } from '@/lib/data'

export async function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale)

  // Уншилтыг `getSiteContent` -ээр — DB руу шууд хандвал демо горим тойрогдоно
  const site = await getSiteContent(['contact'])
  const info = content(site.get('contact'), locale)

  const linkClass = 'text-foreground-soft transition-colors hover:text-foreground'

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line">
      {/* Хуудсын төгсгөлд сүүлчийн гэрэл */}
      <div className="glow glow-soft -bottom-40 left-1/2 h-72 w-[36rem] -translate-x-1/2" />

      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <p className="font-display text-lg font-bold tracking-[-0.045em]">Twerk Mongolia</p>
          <p className="max-w-[28ch] text-sm text-muted">
            {t.brand} · Улаанбаатар
          </p>
        </div>

        <nav className="flex flex-col gap-2.5 text-sm">
          <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-muted uppercase">
            {t.nav.menu}
          </p>
          <Link href={`/${locale}/schedule`} className={linkClass}>
            {t.nav.schedule}
          </Link>
          <Link href={`/${locale}/classes`} className={linkClass}>
            {t.nav.classes}
          </Link>
          <Link href={`/${locale}/shop`} className={linkClass}>
            {t.nav.shop}
          </Link>
        </nav>

        <nav className="flex flex-col gap-2.5 text-sm">
          <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-muted uppercase">
            {t.nav.about}
          </p>
          <Link href={`/${locale}/instructors`} className={linkClass}>
            {t.nav.instructors}
          </Link>
          <Link href={`/${locale}/gallery`} className={linkClass}>
            {t.nav.gallery}
          </Link>
          <Link href={`/${locale}/faq`} className={linkClass}>
            {t.nav.faq}
          </Link>
        </nav>

        <address className="flex flex-col gap-2.5 text-sm not-italic">
          <p className="mb-1 text-xs font-semibold tracking-[0.18em] text-muted uppercase">
            {t.nav.contact}
          </p>
          {info.address && <span className="text-muted">{info.address}</span>}
          {info.phone && (
            <a href={`tel:${String(info.phone).replace(/\s/g, '')}`} className={linkClass}>
              {info.phone}
            </a>
          )}
          {info.email && (
            <a href={`mailto:${info.email}`} className={linkClass}>
              {info.email}
            </a>
          )}
          {info.instagram && (
            <a
              href={`https://instagram.com/${info.instagram}`}
              className={linkClass}
              rel="noreferrer noopener"
              target="_blank"
            >
              Instagram
            </a>
          )}
          {info.facebook && (
            <a
              href={String(info.facebook)}
              className={linkClass}
              rel="noreferrer noopener"
              target="_blank"
            >
              Facebook
            </a>
          )}
        </address>
      </div>

      <div className="mx-auto w-full max-w-6xl border-t border-line/60 px-5 py-6">
        <p className="text-xs text-muted">© {new Date().getFullYear()} Twerk Mongolia</p>
      </div>
    </footer>
  )
}
