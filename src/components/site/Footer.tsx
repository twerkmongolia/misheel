import Image from 'next/image'
import Link from 'next/link'
import { content, getDictionary, type Locale } from '@/lib/i18n'
import { getSiteContent } from '@/lib/data'

/**
 * Хуудасны хөл — сэтгүүлийн colophon.
 *
 * Хамгийн доод мөрөнд аварга нэр. Уншихад биш: хуудас дуусахдаа тамга
 * дардаг. Зурлагаар зурагдсан тул дэвсгэрийг дардаггүй, зөвхөн зааглана.
 */
export async function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale)

  // Уншилтыг `getSiteContent` -ээр — DB руу шууд хандвал демо горим тойрогдоно
  const site = await getSiteContent(['contact', 'hero'])
  const info = content(site.get('contact'), locale)
  const hero = content(site.get('hero'), locale)

  const link = 'lnk t-small w-fit text-foreground-soft hover:text-foreground'

  const columns = [
    {
      heading: t.nav.menu,
      items: [
        { href: `/${locale}/schedule`, label: t.nav.schedule },
        { href: `/${locale}/classes`, label: t.nav.classes },
        { href: `/${locale}/shop`, label: t.nav.shop },
      ],
    },
    {
      heading: t.nav.about,
      items: [
        { href: `/${locale}/instructors`, label: t.nav.instructors },
        { href: `/${locale}/gallery`, label: t.nav.gallery },
        { href: `/${locale}/faq`, label: t.nav.faq },
      ],
    },
  ]

  const socials = [
    info.instagram && { label: 'Instagram', href: `https://instagram.com/${info.instagram}` },
    info.facebook && { label: 'Facebook', href: String(info.facebook) },
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    // Доод самбар хөвж байдаг тул төгсгөлийн мөрүүд түүний ард дарагдахгүйн
    // тулд гар утсанд нэмэлт зай — самбарын өндөр + амьсгал.
    <footer className="relative mt-32 overflow-hidden border-t border-line pb-24 lg:pb-0">
      <div className="glow glow-soft -bottom-48 left-1/2 h-80 w-[40rem] -translate-x-1/2" />

      <div className="shell g12 gap-y-14 pt-20 pb-16">
        {/* ── Мэдэгдэл ────────────────────────────────────────────────
            Хөл нь холбоосын хогийн сав биш. Эхлээд ганц өгүүлбэр, дараа нь
            ганц үйлдэл — ёроолд хүрсэн хүн дээш эргэж гүйлгэх ёсгүй. */}
        <div className="col-span-12 flex flex-col items-start gap-7 lg:col-span-5" data-rv>
          <p className="t-h3 max-w-[24ch] text-balance">
            {hero.subtitle ?? t.brand}
          </p>
          <Link href={`/${locale}/schedule`} className="btn btn-line">
            {t.nav.booking}
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
              aria-hidden="true"
              className="ico h-3.5 w-3.5"
            >
              <path d="M2 8h11M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>

        {columns.map((column) => (
          <nav
            key={String(column.heading)}
            className="col-span-6 flex flex-col gap-4 sm:col-span-4 lg:col-span-2"
            data-rv
          >
            <p className="t-label text-faint">{column.heading}</p>
            <div className="flex flex-col gap-2.5">
              {column.items.map((item) => (
                <Link key={item.href} href={item.href} className={link}>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        ))}

        <address
          className="col-span-12 flex flex-col gap-4 not-italic sm:col-span-4 lg:col-span-3"
          data-rv
        >
          <p className="t-label text-faint">{t.nav.contact}</p>

          {info.phone && (
            <a
              href={`tel:${String(info.phone).replace(/\s/g, '')}`}
              className="t-h3 w-fit tabular-nums transition-opacity duration-200 hover:opacity-60"
            >
              {info.phone}
            </a>
          )}
          {info.email && (
            <a href={`mailto:${info.email}`} className={link}>
              {info.email}
            </a>
          )}
          {info.address && <span className="t-small max-w-[26ch] text-muted">{info.address}</span>}

          {socials.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  rel="noreferrer noopener"
                  target="_blank"
                  className="lnk t-label text-muted hover:text-foreground"
                >
                  {social.label}
                </a>
              ))}
            </div>
          )}
        </address>
      </div>

      {/* ── Тамга ──────────────────────────────────────────────────────
          Дэлгэцийн өргөнийг бүтэн дүүргэнэ. `92%` нь захын зайг үлдээж,
          нэр ирмэгт тулахаас сэргийлнэ — нэр нь зүсэгдэхгүй, багтана. */}
      <div aria-hidden className="shell overflow-hidden pb-4">
        <p
          className="font-display leading-[0.76] font-medium tracking-[-0.055em] whitespace-nowrap text-transparent select-none"
          style={{
            fontSize: 'min(12.6vw, 11rem)',
            WebkitTextStroke: '1px var(--line-strong)',
          }}
        >
          Twerk Mongolia
        </p>
      </div>

      <div className="shell flex flex-col gap-4 border-t border-line py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="t-meta text-faint">© {new Date().getFullYear()} Twerk Mongolia</p>

        <a
          href="https://tsstark.com"
          target="_blank"
          rel="noreferrer noopener"
          className="group flex items-center gap-2 text-faint transition-colors duration-200 hover:text-foreground"
        >
          <span className="t-meta">powered by</span>
          <Image
            src="/media/tsstark-logo.png"
            alt=""
            width={264}
            height={264}
            className="logo-invert h-5 w-5 opacity-70 transition-opacity duration-200 group-hover:opacity-100"
          />
          <span className="t-meta font-semibold">TS Stark</span>
        </a>
      </div>
    </footer>
  )
}
