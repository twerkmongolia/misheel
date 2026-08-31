import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'
import { ButtonLink, Empty, Eyebrow } from '@/components/ui'
import { Media } from '@/components/site/media'
import { SessionRow } from '@/components/site/SessionRow'
import { VideoEmbed } from '@/components/site/VideoEmbed'
import { content, getDictionary, loc, isLocale } from '@/lib/i18n'
import { formatMnt } from '@/lib/format'
import { youtubeId } from '@/lib/youtube'
import {
  getClassTypes,
  getInstructors,
  getProducts,
  getSiteContent,
  getUpcomingSessions,
} from '@/lib/data'

/**
 * Админ `site_content` дээрх `videos` мөрийг засаагүй үед харагдах бичлэгүүд.
 * Тэнд `id_1`, `id_2` талбарт бүтэн YouTube холбоос буулгасан ч ажиллана.
 */
const FALLBACK_VIDEO_IDS = ['u261YyMWm0g', 'ju-HSfPFFxE', 'U7GUiQBVIs0']

/** `--d` нь CSS хувьсагч — TS-д стандарт биш тул энд хөрвүүлнэ. */
const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

/**
 * Нүүрний нэг бүлэг.
 *
 * `ui/Section` -ээс ялгаатай нь ДУГААРТАЙ бөгөөд гарчиг нь зүүн талын
 * наалдмал заагчтай хос болж ажиллана: заагч дээрх «02» болон энд байгаа
 * «02» хоёр нэг зүйлийг заана. Тиймээс нүүрэнд өөрийн гэсэн хувилбар
 * хэрэгтэй — бусад хуудасны `Section` -ийг хөндөхгүй.
 */
function Block({
  id,
  index,
  title,
  action,
  children,
}: {
  id: string
  index: string
  title: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="reveal underline-grow flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line pb-5">
        <h2 className="flex items-baseline gap-4 text-[clamp(1.75rem,4vw,2.5rem)] leading-none font-bold">
          <span className="font-display text-sm font-medium text-faint tabular-nums">{index}</span>
          {title}
        </h2>
        {action}
      </div>
      <div className="pt-8">{children}</div>
    </section>
  )
}

/** Бүлгүүд рүү үсрэх сум — давтагдах тул нэг дор */
function More({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm text-foreground-soft transition-colors hover:text-foreground"
    >
      {children}
      <span aria-hidden className="transition-transform group-hover:translate-x-1">
        →
      </span>
    </Link>
  )
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const [site, sessions, classTypes, instructors, products] = await Promise.all([
    getSiteContent(['hero', 'about', 'videos']),
    getUpcomingSessions(5),
    getClassTypes(),
    getInstructors(),
    getProducts(),
  ])

  const hero = content(site.get('hero'), locale)
  const about = content(site.get('about'), locale)
  const videoContent = content(site.get('videos'), locale)

  const videos = FALLBACK_VIDEO_IDS.map((fallback, index) => ({
    id: youtubeId(videoContent[`id_${index + 1}`]) ?? fallback,
    title: String(videoContent[`title_${index + 1}`] ?? '') || undefined,
  })).filter((video) => Boolean(video.id))

  const stats = [
    [about.stat_students, t.home.students],
    [about.stat_years, t.home.years],
    [about.stat_classes, t.home.weekly],
  ] as const

  const heroWords = String(hero.title ?? 'Twerk Mongolia')
    .split(' ')
    .filter(Boolean)

  /* Заагчид зөвхөн ӨГӨГДӨЛТЭЙ бүлгүүд орно — хоосон холбоос заахгүй */
  const blocks = [
    { id: 'schedule', label: t.home.upcoming, show: true },
    { id: 'classes', label: t.home.classesTitle, show: classTypes.length > 0 },
    { id: 'instructors', label: t.home.instructorsTitle, show: instructors.length > 0 },
    { id: 'videos', label: t.home.videosTitle, show: videos.length > 0 },
    { id: 'shop', label: t.home.shopTitle, show: products.length > 0 },
  ].filter((block) => block.show)

  const numberOf = (id: string) =>
    String(blocks.findIndex((block) => block.id === id) + 1).padStart(2, '0')

  return (
    <div className="flex flex-col">
      {/* ══ Баатар ═══════════════════════════════════════════════════════
          Хуудасны баганаас ГАРНА. Текст зүүн ирмэгийн баганадаа эгнэсэн
          хэвээр ч, зураг баруун тийш дэлгэцээс цааш үргэлжилнэ — заал энэ
          хүрээнд багтахгүй гэдгийг зохиомж өөрөө хэлнэ. */}
      <section className="bleed relative -mt-10 pt-10 sm:-mt-14 sm:pt-14">
        <div className="glow -top-28 left-[8%] h-80 w-80" />
        <div className="glow glow-soft top-10 right-[6%] h-72 w-96" />
        <div
          aria-hidden
          className="hairlines pointer-events-none absolute inset-x-0 -top-10 -z-10 h-[620px] opacity-70"
        />

        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,46%)] lg:gap-12">
          {/* Зүүн багана — хуудасны ирмэгтэй эгнэнэ */}
          <div className="flex flex-col items-start gap-6 px-4 sm:px-5 lg:pr-4 lg:pl-[max(1.25rem,calc(50vw-34.75rem))]">
            <span
              className="rise inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/60 py-1.5 pr-4 pl-3 backdrop-blur-sm"
              style={delay(0)}
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="ping-ring absolute inline-flex h-full w-full rounded-full bg-foreground" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground" />
              </span>
              <Eyebrow>Улаанбаатар</Eyebrow>
            </span>

            {/* Үг бүрийг тусад нь мөрлөнө — өнгөгүй тул хэмжээ өөрөө мэдэгдэл болно.
                Сүүлийн үг зурлагатай: хоёр дахь шатыг өнгөгүйгээр үүсгэнэ. */}
            <h1 className="text-[clamp(3rem,8.2vw,5.5rem)] leading-[0.85] font-bold">
              {heroWords.map((word, index) => (
                <span
                  key={word + index}
                  style={delay(90 + index * 95)}
                  className={`rise block ${
                    heroWords.length > 1 && index === heroWords.length - 1 ? 'text-outline' : ''
                  }`}
                >
                  {word}
                </span>
              ))}
            </h1>

            <p
              className="rise max-w-[34ch] text-xl leading-snug text-foreground-soft"
              style={delay(90 + heroWords.length * 95)}
            >
              {hero.subtitle}
            </p>
            <p
              className="rise max-w-[46ch] text-foreground-soft/80"
              style={delay(160 + heroWords.length * 95)}
            >
              {hero.body}
            </p>

            <div
              className="rise flex flex-wrap items-center gap-3 pt-2"
              style={delay(230 + heroWords.length * 95)}
            >
              <ButtonLink href={`/${locale}/schedule`} className="group px-6 py-3">
                {hero.cta ?? t.nav.schedule}
                <span aria-hidden className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </ButtonLink>
              <ButtonLink href={`/${locale}/classes`} variant="secondary" className="px-6 py-3">
                {t.nav.classes}
              </ButtonLink>
            </div>
          </div>

          {/* Баруун багана — дэлгэцээс цааш. Зураг хэвтээ, өргөн эгнээтэй тул
              4:3 хэвээр: босоо зүсэлт урд талын бүжигчнийг тасална. */}
          <div className="rise px-4 sm:px-5 lg:px-0" style={delay(300)}>
            <div className="lg:w-[calc(100%+4rem)]">
              <Media
                src="/media/hero.jpg"
                alt={String(hero.title ?? '')}
                ratio="aspect-[4/3]"
                className="zoom-in lg:rounded-l-[1.75rem] lg:rounded-r-none lg:border-r-0"
                priority
              />
            </div>
          </div>
        </div>

        {/* Тоон үзүүлэлт нь тусдаа хэсэг БИШ — баатрын доод ирмэгийн шугам.
            Гарчиг ба хуудасны биеийг тусгаарлана. */}
        {about.stat_students && (
          <div className="mt-14 border-y border-line sm:mt-16">
            <dl className="bleed-inner stagger grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {stats.map(([value, label], index) => (
                <div
                  key={String(label)}
                  className={`flex items-baseline gap-4 py-7 transition-colors hover:bg-surface/60 sm:flex-col sm:gap-2 sm:py-9 ${
                    index === 0 ? 'sm:pr-8' : index === 1 ? 'sm:px-8' : 'sm:pl-8'
                  }`}
                >
                  <dt className="order-2 text-sm text-muted sm:order-none">{label}</dt>
                  <dd className="font-display order-1 text-4xl leading-none font-bold tabular-nums sm:order-none sm:text-5xl">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>

      {/* ══ Хичээлийн нэрсийн тууз ═══════════════════════════════════════
          Чимэглэл — уншигчид биш, хэмнэлд зориулав. Тиймээс `aria-hidden`:
          яг ижил нэрс доор жагсаалт болж дахин гарна. */}
      {classTypes.length > 0 && (
        <section
          aria-hidden
          className="marquee edge-fade bleed relative overflow-hidden border-b border-line py-6"
        >
          <div className="marquee-track">
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0 items-center gap-7 pr-7">
                {classTypes.map((classType) => (
                  <span
                    key={classType.id}
                    className="font-display flex items-center gap-7 text-2xl font-bold whitespace-nowrap text-foreground-soft sm:text-3xl"
                  >
                    {loc(classType, 'name', locale)}
                    <span className="text-faint">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══ Хуудасны бие ═════════════════════════════════════════════════
          Нэг баганад дараалсан хэсгүүдийн оронд ХОЁР БАГАНА: зүүн талд
          наалдмал агуулга, баруун талд бүлгүүд. Ингэснээр уншигч гүйлгэх
          үедээ «энэ хуудсанд өөр юу байна» гэдгийг байнга хардаг — доош
          гүйлгэж туршихгүй. Нарийн дэлгэцэд заагч ажиллахгүй тул алга
          болж, бүлгүүд ердийн багана болно. */}
      <div className="grid gap-x-14 gap-y-24 pt-20 sm:gap-y-28 lg:grid-cols-[11rem_minmax(0,1fr)] lg:pt-24">
        <aside className="hidden lg:block">
          <nav className="sticky top-28 flex flex-col gap-4">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-faint uppercase">
              {t.nav.menu}
            </p>
            <ol className="flex flex-col gap-2.5">
              {blocks.map((block, index) => (
                <li key={block.id}>
                  <a
                    href={`#${block.id}`}
                    className="group flex items-baseline gap-2.5 text-sm text-muted transition-colors hover:text-foreground"
                  >
                    <span className="font-display text-[11px] text-faint tabular-nums transition-colors group-hover:text-foreground-soft">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {block.label}
                  </a>
                </li>
              ))}
            </ol>

            <div className="rule mt-3" />

            <Link
              href={`/${locale}/contact`}
              className="group inline-flex items-center gap-1.5 text-sm text-foreground-soft transition-colors hover:text-foreground"
            >
              {t.nav.contact}
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </nav>
        </aside>

        <div className="flex flex-col gap-24 sm:gap-28">
          {/* ── Ойрын хичээлүүд ── тор биш, ЖАГСААЛТ ────────────────── */}
          <Block
            id="schedule"
            index={numberOf('schedule')}
            title={t.home.upcoming}
            action={<More href={`/${locale}/schedule`}>{t.home.upcomingAll}</More>}
          >
            {sessions.length === 0 ? (
              <Empty>{t.schedule.noSessions}</Empty>
            ) : (
              <ul className="stagger -mt-2 divide-y divide-line border-b border-line">
                {sessions.map((session) => (
                  <SessionRow key={session.id} session={session} locale={locale} />
                ))}
              </ul>
            )}
          </Block>

          {/* ── Хичээлийн төрлүүд ── хэвтээ зам ─────────────────────── */}
          {classTypes.length > 0 && (
            <Block
              id="classes"
              index={numberOf('classes')}
              title={t.home.classesTitle}
              action={<More href={`/${locale}/classes`}>{t.common.all}</More>}
            >
              <div className="rail reveal -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-5 sm:px-5 lg:mx-0 lg:px-0">
                {classTypes.map((classType, index) => (
                  <Link
                    key={classType.id}
                    href={`/${locale}/classes/${classType.slug}`}
                    className="card card-link sheen group relative w-[72vw] shrink-0 snap-start overflow-hidden p-0 sm:w-[19rem]"
                  >
                    <Media
                      src={classType.cover_url}
                      alt={loc(classType, 'name', locale)}
                      seed={index}
                      ratio="aspect-[3/4]"
                      className="zoom-in rounded-none border-0"
                    />
                    <div aria-hidden className="tile-scrim pointer-events-none absolute inset-0" />

                    <span className="absolute top-4 left-4 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white/85 uppercase backdrop-blur-sm">
                      {t.level[classType.level]}
                    </span>

                    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5 text-white">
                      <p className="font-display text-xl leading-tight font-bold">
                        {loc(classType, 'name', locale)}
                      </p>
                      <p className="text-xs text-white/70 tabular-nums">
                        {classType.duration_min}
                        {t.common.minutes} · {formatMnt(classType.base_price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Block>
          )}

          {/* ── Багш нар ── шатласан хөрөг ───────────────────────────── */}
          {instructors.length > 0 && (
            <Block
              id="instructors"
              index={numberOf('instructors')}
              title={t.home.instructorsTitle}
              action={<More href={`/${locale}/instructors`}>{t.common.all}</More>}
            >
              <div className="stagger grid gap-5 sm:grid-cols-3">
                {instructors.slice(0, 3).map((instructor, index) => (
                  <Link
                    key={instructor.id}
                    href={`/${locale}/instructors/${instructor.slug}`}
                    className={`card card-link sheen group relative overflow-hidden p-0 ${
                      /* Шатлал — эгнээ хавтгай биш, шатаар бууна */
                      index === 1 ? 'sm:mt-10' : index === 2 ? 'sm:mt-20' : ''
                    }`}
                  >
                    <Media
                      src={instructor.photo_url}
                      alt={instructor.name}
                      seed={index + 2}
                      ratio="aspect-[4/5]"
                      className="zoom-in rounded-none border-0"
                    />
                    <div aria-hidden className="tile-scrim pointer-events-none absolute inset-0" />

                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <p className="font-display text-lg font-bold">{instructor.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-white/70">
                        {loc(instructor, 'bio', locale)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Block>
          )}

          {/* ── Бичлэгүүд ── нэг том, бусад нь дэргэд ────────────────── */}
          {videos.length > 0 && (
            <Block id="videos" index={numberOf('videos')} title={t.home.videosTitle}>
              <div className="reveal grid gap-5 lg:grid-cols-[1.55fr_1fr]">
                <VideoEmbed
                  id={videos[0].id}
                  title={videos[0].title}
                  playLabel={t.home.playVideo}
                  watchLabel={t.home.watchOnYoutube}
                />
                {videos.length > 1 && (
                  <div className="flex flex-col gap-5">
                    {videos.slice(1).map((video) => (
                      <VideoEmbed
                        key={video.id}
                        id={video.id}
                        title={video.title}
                        playLabel={t.home.playVideo}
                        watchLabel={t.home.watchOnYoutube}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Block>
          )}

          {/* ── Дэлгүүр ── зэрэгцээ хос, шугамаар тусгаарласан ───────── */}
          {products.length > 0 && (
            <Block
              id="shop"
              index={numberOf('shop')}
              title={t.home.shopTitle}
              action={<More href={`/${locale}/shop`}>{t.nav.shop}</More>}
            >
              <div className="stagger grid gap-x-5 sm:grid-cols-2">
                {products.slice(0, 4).map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/${locale}/shop/${product.slug}`}
                    className="card-link group flex flex-col gap-4 border-b border-line py-6 first:pt-0 sm:[&:nth-child(2)]:pt-0"
                  >
                    <Media
                      src={product.images[0]?.url}
                      alt={loc(product, 'name', locale)}
                      seed={index + 1}
                      ratio="aspect-[5/4]"
                      className="zoom-in"
                    />
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold transition-colors group-hover:text-foreground-soft">
                        {loc(product, 'name', locale)}
                      </p>
                      <p className="shrink-0 text-sm text-muted tabular-nums">
                        {formatMnt(product.minPrice)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Block>
          )}
        </div>
      </div>

      {/* ══ Төгсгөлийн уриалга ═══════════════════════════════════════════
          Хуудас жагсаалтаар дуусах ёсгүй. Хайрцаг ч биш — бүтэн өргөн тууз:
          сонголт нэг л үлдсэн гэдгийг зохиомж хэлнэ. */}
      <section className="bleed relative isolate mt-28 -mb-10 overflow-hidden border-t border-line py-20 sm:-mb-14 sm:py-28">
        <div className="glow -top-24 left-1/2 h-72 w-[30rem] -translate-x-1/2" />
        <div aria-hidden className="hairlines pointer-events-none absolute inset-0 opacity-60" />

        <div className="bleed-inner reveal relative flex flex-col items-center gap-6 text-center">
          <Eyebrow>{t.brand}</Eyebrow>
          <h2 className="max-w-[18ch] text-[clamp(2rem,6vw,4rem)] leading-[0.92] font-bold">
            {t.about.ctaTitle}
          </h2>
          <p className="max-w-[46ch] text-foreground-soft">{t.about.ctaBody}</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <ButtonLink href={`/${locale}/schedule`} className="group px-6 py-3">
              {t.schedule.book}
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </ButtonLink>
            <ButtonLink href={`/${locale}/contact`} variant="secondary" className="px-6 py-3">
              {t.nav.contact}
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  )
}
