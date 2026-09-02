import Image from 'next/image'
import Link from 'next/link'
import { Arrow, FacebookIcon, InstagramIcon } from '@/components/ui'
import { content, getDictionary, type Locale } from '@/lib/i18n'
import { getSiteContent } from '@/lib/data'

/**
 * Хуудасны хөл — харанхуй хуудсан дээр хэвтэх ЦАГААН КАРТ.
 *
 * ── Яагаад карт ───────────────────────────────────────────────────────────
 * Өмнө нь хөл нь дэлгэцийн хоёр ирмэг хүртэл үргэлжилсэн, зөвхөн дээд
 * шугамаараа зааглагдсан харанхуй талбай байв. Тэр нь агуулгын үргэлжлэл
 * мэт уншигдаж, «хуудас дууслаа» гэдгийг хэлж чаддаггүй байлаа.
 *
 * Карт нь эсрэгээрээ: дөрвөн талаараа хаагдсан, доороо зайтай биет.
 * Гүйлгэж яваа хүн түүний доод ирмэгийг хараад цааш юу ч байхгүйг мэднэ —
 * үг ашиглалгүйгээр.
 *
 * ── Яагаад цагаан ─────────────────────────────────────────────────────────
 * Сайт бүхэлдээ харанхуй тул эргүүлсэн блок нь хамгийн хүчтэй ЗОГСООХ
 * дохио. Хөлд яг тэр хэрэгтэй. Дээд талын өдрийн тууз ч мөн цагаан —
 * хуудас цагаанаар эхэлж, цагаанаар төгсөж, хооронд нь харанхуй агуулга
 * хаалттай байна.
 *
 * Доторх бүрдлүүд дахин бичигдээгүй: палитр нь саванаасаа өвлөгддөг тул
 * товч, дүрст товч, шугам бүгд өөрөө эргэнэ (§ globals.css `.panel-invert`).
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
    info.instagram && {
      label: 'Instagram',
      href: `https://instagram.com/${info.instagram}`,
      Icon: InstagramIcon,
    },
    info.facebook && { label: 'Facebook', href: String(info.facebook), Icon: FacebookIcon },
  ].filter(Boolean) as { label: string; href: string; Icon: typeof InstagramIcon }[]

  return (
    // Гар утсанд доод самбар хөвж байдаг тул картын доод ирмэг түүний ард
    // дарагдахгүйн тулд нэмэлт зай — самбарын өндөр + амьсгал.
    <footer className="mt-[var(--bay)] pb-28 lg:pb-10">
      <div className="shell">
        <div className="panel-invert overflow-hidden rounded-[var(--r-xl)]" data-rv="scale">
          <div className="px-6 pt-14 pb-12 sm:px-10 sm:pt-16 lg:px-14">
            <div className="g12 gap-y-12">
              {/* ── Мэдэгдэл ────────────────────────────────────────────
                  Хөл нь холбоосын хогийн сав биш. Эхлээд ганц өгүүлбэр,
                  дараа нь ганц үйлдэл — ёроолд хүрсэн хүн дээш эргэж
                  гүйлгэх ёсгүй. */}
              <div className="col-span-12 flex flex-col items-start gap-7 lg:col-span-5">
                <p className="t-h2 max-w-[16ch] text-balance">{hero.subtitle ?? t.brand}</p>
                <Link href={`/${locale}/schedule`} className="btn btn-solid">
                  {t.nav.booking}
                  <Arrow />
                </Link>
              </div>

              {columns.map((column) => (
                <nav
                  key={String(column.heading)}
                  className="col-span-6 flex flex-col gap-4 sm:col-span-4 lg:col-span-2"
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

              <address className="col-span-12 flex flex-col gap-4 not-italic sm:col-span-4 lg:col-span-3">
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
                {info.address && (
                  <span className="t-small max-w-[26ch] text-muted">{info.address}</span>
                )}

                {/* Хөлд зай хомс, нэр нь давтагдсан мэдээлэл — Instagram
                    гэдгийг дүрс нь өөрөө хэлнэ. Нэр `aria-label` дээр үлдэнэ. */}
                {socials.length > 0 && (
                  <div className="mt-1 -ml-2.5 flex flex-wrap gap-1">
                    {socials.map(({ label, href, Icon }) => (
                      <a
                        key={label}
                        href={href}
                        rel="noreferrer noopener"
                        target="_blank"
                        aria-label={label}
                        className="icon-btn"
                      >
                        <Icon />
                      </a>
                    ))}
                  </div>
                )}
              </address>
            </div>
          </div>

          {/* ── Тамга ──────────────────────────────────────────────────
              Картын өргөнийг бүтэн дүүргэнэ. Уншихад биш: хуудас дуусахдаа
              тамга дардаг. Зурлагаар зурагдсан (дүүргэлтгүй) тул доорх
              мөрийг дардаггүй, зөвхөн зааглана.

              ⚠️ Хэмжээ нь ХАРАГДАХ ХЭСГЭЭС биш КАРТААС хамаарна. Эхний
              оролдлогод `15.5vw` байсан нь картын өргөнөөс халиж, нэр нь
              «TWERK MONGO…» гэж дундуураа тасарч байв — зориудын зүсэлт
              биш, эвдэрсэн зохиомж мэт уншигдана.

              Картын дотоод өргөн ≈ `100vw − 2×--shell-pad − 2×дотоод зай`.
              Oswald bold дээр «Twerk Mongolia» нь ойролцоогоор 6.3em
              өргөнтэй тул `11vw` нь бүх өргөнд зайтай багтана. Дээд хязгаар
              нь 9.5rem: багана 88rem дээр тогтдог тул vw цаашид ургахад
              нэр дахин халина.

              Доод талаараа бага зэрэг зүсэгдэнэ (`-mb`) — суурь шугам нь
              доорх мөрийн хүрээтэй нийлж, тамга дарагдсан мэт мэдрэгдэнэ.

              Зурлага нь ХАР (`--foreground`), дүүргэлт нь тунгалаг. Өмнө нь
              бүдэг саарал (`--line-strong`) байсан нь тамга биш угаагдсан
              ул мөр мэт уншигдаж байв. Хар зурлага нь эрч өгөх ч дүүргэлт
              нь хоосон хэвээр тул хөлийн холбоосуудтай өрсөлдөхгүй —
              «зурсан» биш «дарсан» тамга. Токеноор бичсэн тул самбар
              хэзээ нэгэн цагт харанхуй болбол зурлага нь өөрөө цагаан
              болно. */}
          <div aria-hidden className="overflow-hidden px-6 sm:px-10 lg:px-14">
            <p
              className="font-display -mb-[0.1em] leading-[0.82] font-bold tracking-[0.005em] whitespace-nowrap text-transparent uppercase select-none"
              style={{
                fontSize: 'min(11vw, 9.5rem)',
                WebkitTextStroke: '1.5px var(--foreground)',
              }}
            >
              Twerk Mongolia
            </p>
          </div>

          {/* ── Доод мөр ───────────────────────────────────────────────
              Картын дотор, өөрийн шугамаар зааглагдсан. Дэвсгэрийг нэг шат
              бүдгэрүүлснээр «энэ бол агуулга биш, гарын үсэг» гэдгийг
              хэлнэ. */}
          <div className="border-t border-line bg-surface px-6 py-5 sm:px-10 lg:px-14">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="t-meta text-muted">© {new Date().getFullYear()} Twerk Mongolia</p>

              <a
                href="https://tsstark.com"
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-center gap-2 text-muted transition-colors duration-200 hover:text-foreground"
              >
                <span className="t-meta">powered by</span>
                {/* Лого нь ХАР зурлагатай, дэвсгэргүй. Хөл цагаан болсон
                    тул эргүүлэх шаардлагагүй — `logo-invert` хасагдав. */}
                <Image
                  src="/media/tsstark-logo.png"
                  alt=""
                  width={264}
                  height={264}
                  className="h-5 w-5 opacity-60 transition-opacity duration-200 group-hover:opacity-100"
                />
                <span className="t-meta font-semibold">TS Stark</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
