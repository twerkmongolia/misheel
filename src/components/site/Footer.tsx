import Image from 'next/image'
import Link from 'next/link'
import { content, getDictionary, type Locale } from '@/lib/i18n'
import { getSiteContent } from '@/lib/data'

export async function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale)

  // Уншилтыг `getSiteContent` -ээр — DB руу шууд хандвал демо горим тойрогдоно
  const site = await getSiteContent(['contact', 'hero'])
  const info = content(site.get('contact'), locale)
  const hero = content(site.get('hero'), locale)

  const linkClass =
    'inline-flex w-fit items-center text-foreground-soft transition-colors hover:text-foreground'
  const headingClass = 'mb-1 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase'

  // Сүлжээний холбоосууд — байгаа нь л гарна
  const socials = [
    info.instagram && {
      label: 'Instagram',
      href: `https://instagram.com/${info.instagram}`,
    },
    info.facebook && { label: 'Facebook', href: String(info.facebook) },
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    // Доод самбар хөвж байдаг тул төгсгөлийн мөрүүд түүний ард дарагдахгүйн
    // тулд гар утсанд нэмэлт зай — самбарын өндөр + амьсгал.
    <footer className="relative mt-28 overflow-hidden border-t border-line pb-24 lg:pb-0">
      {/* Хуудсын төгсгөлд сүүлчийн гэрэл */}
      <div className="glow glow-soft -bottom-40 left-1/2 h-72 w-[36rem] -translate-x-1/2" />

      <div className="mx-auto grid w-full max-w-6xl gap-x-8 gap-y-12 px-4 py-16 sm:px-5 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col items-start gap-4">
          <p className="font-display text-lg font-bold tracking-[-0.045em]">Twerk Mongolia</p>
          <p className="max-w-[30ch] text-sm text-muted">
            {hero.subtitle ? `${hero.subtitle} · Улаанбаатар` : `${t.brand} · Улаанбаатар`}
          </p>

          {/* Гол үйлдэл хөлд ч давтагдана — хуудсын ёроолд хүрсэн хүн
              дээш эргэж гүйлгэх ёсгүй. */}
          <Link
            href={`/${locale}/schedule`}
            className="group mt-1 inline-flex items-center gap-2 rounded-full border border-line-strong px-4 py-2 text-sm font-semibold transition-colors hover:border-foreground hover:bg-surface-2"
          >
            {t.nav.booking}
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>

        <nav className="flex flex-col gap-2.5 text-sm">
          <p className={headingClass}>{t.nav.menu}</p>
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
          <p className={headingClass}>{t.nav.about}</p>
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
          <p className={headingClass}>{t.nav.contact}</p>
          {info.address && <span className="max-w-[26ch] text-muted">{info.address}</span>}
          {info.phone && (
            <a
              href={`tel:${String(info.phone).replace(/\s/g, '')}`}
              className={`${linkClass} font-display text-lg font-bold tabular-nums`}
            >
              {info.phone}
            </a>
          )}
          {info.email && (
            <a href={`mailto:${info.email}`} className={linkClass}>
              {info.email}
            </a>
          )}

          {socials.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  rel="noreferrer noopener"
                  target="_blank"
                  className="rounded-full border border-line px-3 py-1.5 text-xs text-foreground-soft transition-colors hover:border-line-strong hover:text-foreground"
                >
                  {social.label} ↗
                </a>
              ))}
            </div>
          )}
        </address>
      </div>

      {/* Аварга тамга — доод ирмэгээсээ зүсэгдэж, хуудас үргэлжилж буй мэдрэмж
          үлдээнэ. Гоёл тул уншигчид хэрэггүй: `aria-hidden`. */}
      <div
        aria-hidden
        className="pointer-events-none mx-auto max-w-6xl overflow-hidden px-4 pb-2 sm:px-5"
      >
        <p className="wordmark">Twerk Mongolia</p>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 border-t border-line/60 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-xs text-muted">© {new Date().getFullYear()} Twerk Mongolia</p>

        <a
          href="https://tsstark.com"
          target="_blank"
          rel="noreferrer noopener"
          className="group flex items-center gap-2 text-xs text-muted transition-colors hover:text-foreground"
        >
          powered by
          <Image
            src="/media/tsstark-logo.png"
            alt=""
            width={264}
            height={264}
            className="logo-invert h-6 w-6 opacity-80 transition-opacity group-hover:opacity-100"
          />
          <span className="font-medium">TS Stark</span>
        </a>
      </div>
    </footer>
  )
}
