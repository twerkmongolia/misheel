import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'
import { Arrow, ButtonLink, Empty, Eyebrow } from '@/components/ui'
import { ContactTrigger } from '@/components/site/ContactDialog'
import { Media } from '@/components/site/media'
import { SessionList } from '@/components/site/SessionList'
import { VideoEmbed } from '@/components/site/VideoEmbed'
import { Stat } from '@/components/site/Stat'
import { content, getDictionary, loc, isLocale } from '@/lib/i18n'
import { pageMetadata } from '@/lib/seo'
import { formatMnt } from '@/lib/format'
import { youtubeId } from '@/lib/youtube'
import {
  getClassTypes,
  getInstructors,
  getMyBookedSessionIds,
  getProducts,
  getSiteContent,
  getUpcomingSessions,
} from '@/lib/data'
import { getUser } from '@/lib/auth/dal'

/**
 * Админ `site_content` дээрх `videos` мөрийг засаагүй үед харагдах бичлэгүүд.
 * Тэнд `id_1`, `id_2` талбарт бүтэн YouTube холбоос буулгасан ч ажиллана.
 */
const FALLBACK_VIDEO_IDS = ['u261YyMWm0g', 'ju-HSfPFFxE', 'U7GUiQBVIs0']

/* ───────────────────────────────────────────────────────────────────────────
   БҮЛЭГ

   Нүүр хуудас бол ЖАГСААЛТ биш, ДУГААРЛАСАН бүлгүүд. Бүлэг бүр гарчиг,
   хажуудаа нэг өгүүлбэр, доогуураа шугамтай — сэтгүүлийн бүлгийн нээлт.

   Гарчиг зүүн талын 7 багана, тайлбар баруун талын 4 багана дээр сууна.
   Хоорондоо ЗАЙТАЙ: уншигч гарчгийг уншаад доош биш, хажуу тийш нүдээ
   шилжүүлнэ. Ингэснээр толгой хэсэг хуудсыг битүүлэхгүй, зөвхөн нээнэ.
   ─────────────────────────────────────────────────────────────────────── */
function Chapter({
  id,
  index,
  count,
  title,
  note,
  action,
  children,
}: {
  id: string
  index: string
  /** Нийт бүлгийн тоо — эйброу дээрх «01 / 05» тоолуурын хоёр дахь тал. */
  count: string
  title: ReactNode
  note?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="shell scroll-mt-28 pt-[var(--bay)]">
      <div className="g12 items-end gap-y-7">
        <div className="col-span-12 flex flex-col gap-5 lg:col-span-7" data-rv>
          {/* ── Эйброу нь ТООЛУУР, гарчгийн давталт БИШ ────────────────────
              Өмнө нь энд «01 / Ойрын хичээлүүд» гэж бичигдээд яг доор нь
              «Ойрын хичээлүүд» гэсэн H2 дахин гардаг байв. Нэг гарчиг
              хоёр удаа: нүд түүнийг хоёр өөр зүйл гэж уншиж эхлээд
              ижил болохыг нь мэдээд буцдаг, дэлгэц уншигч бүр нь бүлэг
              бүрийг хоёр удаа зарлана.

              Дугаар нь ганцаараа бол ямар ч мэдээлэлгүй: «01» гэдэг нь
              хэдээс нэг вэ? Тиймээс хоёр дахь тал нь ГАРЧИГ биш НИЙТ
              ТОО болно — «01 / 05». Зураас нь хэвээр, хэмнэл нь хэвээр,
              харин одоо тэр нь уншигчид хуудсан дахь байрлалаа хэлнэ. */}
          <Eyebrow>
            {index}
            <span aria-hidden className="mx-2 text-faint">
              /
            </span>
            {count}
          </Eyebrow>
          <h2 className="t-h2">{title}</h2>
        </div>

        {note && (
          <p
            className="t-small col-span-12 max-w-[42ch] text-muted lg:col-span-4 lg:col-start-9"
            data-rv
          >
            {note}
          </p>
        )}
      </div>

      <div className="hr mt-9" data-rv="line" />

      <div className="flex flex-col gap-10 pt-12">
        {children}
        {action && (
          <div className="flex justify-start" data-rv>
            {action}
          </div>
        )}
      </div>
    </section>
  )
}

/** Бүлгийн төгсгөлийн холбоос — сум нь hover дээр чиглэлээ заана */
function More({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="btn btn-line">
      {children}
      <Arrow />
    </Link>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const t = getDictionary(locale)
  return pageMetadata({
    locale,
    title: null,
    description: t.meta.home,
    path: '',
    image: '/media/hero.jpg',
  })
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const [site, sessions, classTypes, instructors, products, user] = await Promise.all([
    getSiteContent(['hero', 'about', 'videos']),
    getUpcomingSessions(6),
    getClassTypes(),
    getInstructors(),
    getProducts(),
    getUser(),
  ])
  /* Аль хичээлд нь аль хэдийн бүртгүүлснийг мэдэхгүй бол «Бүртгүүлэх» товч
     худал амлалт болно — дарахад л алдаа буцаана. */
  const booked = await getMyBookedSessionIds(user?.id ?? null)

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

  /* Дугаарлалт нь ӨГӨГДӨЛТЭЙ бүлгүүдийг л тоолно — хоосон бүлэг дугаар
     эзэлбэл дараалал тасарч, «02 дараа нь 04» болно. */
  const chapters = [
    { id: 'schedule', show: true },
    { id: 'classes', show: classTypes.length > 0 },
    { id: 'instructors', show: instructors.length > 0 },
    { id: 'videos', show: videos.length > 0 },
    { id: 'shop', show: products.length > 0 },
  ].filter((chapter) => chapter.show)

  const no = (id: string) =>
    String(chapters.findIndex((chapter) => chapter.id === id) + 1).padStart(2, '0')

  const chapterCount = String(chapters.length).padStart(2, '0')

  return (
    <div className="flex flex-col">
      {/* ══════════════════════════════════════════════════════════════════
          БААТАР

          Давхарласан зохиомж: ард нь шалны тор, дунд нь гэрэл, урд нь
          гарчиг ба зураг. Гарчиг зүүн 6 багана дээр, зураг баруун 6 багана
          дээр — тэгш хуваалт БИШ: зураг дэлгэцийн ирмэг хүртэл гарч,
          хуудсын хүрээнээс мултарна. Заал энэ дэлгэцэнд багтахгүй гэдгийг
          зохиомж өөрөө хэлнэ.

          Утсан дээр давхарлал утгагүй — босоо дараалал болж задарна:
          гарчиг, тайлбар, үйлдэл, дараа нь зураг бүтэн өргөнөөр.
          ══════════════════════════════════════════════════════════════════ */}
      <section className="relative">
        {/* Баатар нь ХАВТГАЙ САМБАР дээр сууна: дэлгэцийн хоёр ирмэг хүртэл
            үргэлжилсэн `--surface`, доороо ганц шугам. Өмнө нь энд торон
            дэвсгэр, хоёр прожектор байсан — тэдгээр нь гүн үүсгэдэг ч
            хуудасны эхлэлийг БҮДГЭРҮҮЛДЭГ. Нэг өнгийн блок нь эсрэгээрээ:
            «энд эхэлж байна, эндээс доош өөр зүйл» гэдгийг ганц шугамаар
            хэлнэ. Мөн ачаалал хөнгөрнө — blur(110px) хоёр давхарга,
            хоёр давхар градиент маск бүгд хасагдав. */}
        <div className="border-b border-line bg-surface pt-10 pb-16 sm:pt-16 sm:pb-20 lg:pt-20">
        <div className="shell">
          <div className="g12 items-center gap-y-12">
            {/* ── Мэдэгдэл ─────────────────────────────────────────────── */}
            <div className="col-span-12 flex flex-col items-start gap-8 lg:col-span-6">
              <span className="enter flex items-center gap-3">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="ping-ring absolute inline-flex h-full w-full rounded-full bg-foreground" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground" />
                </span>
                {/* Хотын нэр толь бичгээс — англи хувилбарт «Ulaanbaatar»
                    байх ёстой (§ i18n `about.eyebrow`). */}
                <span className="t-label text-muted">{t.about.eyebrow}</span>
              </span>

              {/* Мөр бүр өөрийн цонхтой; текст доороосоо өргөгдөж орж ирнэ.
                  Зүсэгдсэн ирмэг нь хэвлэлийн хуудас нээгдэж буй мэдрэмж
                  өгнө — тунгалагжих аргаас хамаагүй хүчтэй нээлт. */}
              <h1 className="t-display enter-mask" style={{ '--d': '80ms' } as CSSProperties}>
                {heroWords.map((word, index) => (
                  <span key={word + index} className="mask-line">
                    {/* Сүүлийн үг нь бүдгэрч, гарчгийг хоёр өнгөлөг болгоно —
                        гэхдээ ЗӨВХӨН бусад үг байгаа үед. Админаас гарчгийг
                        нэг үгээр («Twerk») бичихэд «сүүлийн» үг нь цорын ганц
                        үг болж, баатрын гарчиг БҮХЭЛДЭЭ саарал болно. */}
                    <span
                      className={
                        heroWords.length > 1 && index === heroWords.length - 1
                          ? 't-it'
                          : undefined
                      }
                    >
                      {word}
                    </span>
                  </span>
                ))}
              </h1>

              <div
                className="enter flex max-w-[46ch] flex-col gap-4"
                style={{ '--d': '380ms' } as CSSProperties}
              >
                <p className="t-lead text-foreground-soft">{hero.subtitle}</p>
                <p className="t-small text-muted">{hero.body}</p>
              </div>

              {/* Утсан дээр товчнууд БҮТЭН өргөнөөр дараалан сууна: хоёр
                  урт шошготой товч 390px -д зэрэгцэхгүй, зэрэгцүүлэх гэвэл
                  хүрээ халина. `xs` -ээс дээш л мөр болно. */}
              <div
                className="enter flex w-full flex-col gap-3 min-[420px]:w-auto min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center"
                style={{ '--d': '480ms' } as CSSProperties}
              >
                <ButtonLink href={`/${locale}/schedule`} className="btn-lg">
                  {hero.cta ?? t.nav.schedule}
                  <Arrow />
                </ButtonLink>
                <ButtonLink href={`/${locale}/classes`} variant="secondary" className="btn-lg">
                  {t.nav.classes}
                </ButtonLink>
              </div>
            </div>

            {/* ── Зураг ───────────────────────────────────────────────────
                Зүсэлтээр нээгдэнэ: бүтэн зураг доороос дээш илчлэгдэнэ.
                Дотор нь параллакс — хуудас гүйхэд зураг өөрийн хүрээндээ
                удаанаар хөдөлж, гүн үүсгэнэ. Зөвхөн ЭНЭ зурагт: бүх зүйл
                өөр хурдтай хөдөлбөл хуудас сэлгэцэлж уншихад хэцүү болно.

                4:3 харьцаа санаатай — зураг нь хэвтээ, өргөн эгнээтэй тул
                босоо хүрээнд хийвэл урд талын бүжигчин тасарна. */}
            <div
              className="enter-clip bleed-r col-span-12 lg:col-span-6"
              style={{ '--d': '260ms' } as CSSProperties}
            >
              <div className="media aspect-[4/3]">
                {/* Параллаксын хүрээ — зураг өөрийн цонхноос 12% өндөр тул
                    гүйлтийн туршид дотроо гулсах зайтай. Зөвхөн энэ зурагт. */}
                <div className="drift absolute inset-0 -top-[6%] h-[112%]">
                  <Media
                    src="/media/hero.jpg"
                    alt={String(hero.title ?? '')}
                    ratio="h-full w-full"
                    className="rounded-none"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* ── Үзүүлэлт ───────────────────────────────────────────────────
            Тусдаа хэсэг БИШ — баатрын доод ирмэгийн шугам. Гарчиг ба
            хуудасны биеийг тусгаарлана. Тоо нь харагдмагцаа тэгээс дээш
            тоологдоно: бичсэн тоо бол баримт, тоологдсон тоо бол хэмжээ. */}
        {about.stat_students && (
          <div className="shell mt-20 sm:mt-28">
            <div className="hr" data-rv="line" />
            <dl className="grid grid-cols-1 sm:grid-cols-3" data-stagger>
              {stats.map(([value, label], index) => (
                <div
                  key={String(label)}
                  data-rv
                  className={`flex flex-col gap-2 border-b border-line py-7 sm:gap-4 sm:border-b-0 sm:py-10 ${
                    index > 0 ? 'sm:border-l sm:border-line sm:pl-8' : ''
                  } ${index < 2 ? 'sm:pr-8' : ''}`}
                >
                  <dd className="t-num text-[3rem] sm:text-[4rem]">
                    <Stat value={String(value)} />
                  </dd>
                  <dt className="t-label text-muted">{label}</dt>
                </div>
              ))}
            </dl>
            <div className="hr" data-rv="line" />
          </div>
        )}
      </section>

      {/* ══ Хичээлийн нэрсийн тууз ═══════════════════════════════════════
          Чимэглэл — уншигчид биш, хэмнэлд зориулав. Тиймээс `aria-hidden`:
          яг ижил нэрс доор жагсаалт болж дахин гарна. Налуу serif нь
          хөдөлгөөнд өөр эрч өгнө — босоо үсэг гүйхэд хатуу харагддаг. */}
      {classTypes.length > 0 && (
        <section
          aria-hidden
          className="marquee edge-fade bleed relative mt-[var(--bay)] overflow-hidden border-y border-line py-7"
        >
          <div className="marquee-track">
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0 items-center gap-10 pr-10">
                {classTypes.map((classType) => (
                  <span
                    key={classType.id}
                    className="font-display flex items-center gap-10 text-[1.75rem] leading-none font-bold tracking-[0.01em] whitespace-nowrap text-foreground-soft uppercase sm:text-[2.5rem]"
                  >
                    {loc(classType, 'name', locale)}
                    <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-faint" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══ 01 · Ойрын хичээлүүд ══════════════════════════════════════════
          Тор биш ЖАГСААЛТ, түүнчлэн ӨДРӨӨР БҮЛЭГЛЭСЭН. Огноо бүлгийн
          гарчигт нэг л удаа бичигдэж, мөрүүд нь зөвхөн цаг ба хичээлээ
          хэлнэ — нүд доошоо гүйж, хичээлүүдийг шууд харьцуулна. */}
      <Chapter
        id="schedule"
        index={no('schedule')}
        count={chapterCount}
        title={t.home.upcoming}
        note={t.home.scheduleNote}
        action={<More href={`/${locale}/schedule`}>{t.home.upcomingAll}</More>}
      >
        {sessions.length === 0 ? (
          <Empty>{t.schedule.noSessions}</Empty>
        ) : (
          /* `back` дамжуулаагүй — бүртгэл хийгдсэний дараа хуваарийн хуудас
             руу буцна. Баталгаажуулах мэдэгдэл зөвхөн тэнд харагддаг тул
             энд буцаавал хэрэглэгч «болов уу, үгүй юу» гэдгээ мэдэхгүй. */
          <SessionList sessions={sessions} locale={locale} booked={booked} />
        )}
      </Chapter>

      {/* ══ 02 · Хичээлийн төрлүүд ════════════════════════════════════════
          Хэвтээ зам. Тор нь «бүгд ижил жинтэй» гэж хэлдэг бол зам нь
          «үргэлжилсэн цуглуулга» гэж хэлнэ — галерейн хана. Мөн дэлгэцийн
          ирмэгээс цааш үргэлжилснээр гүйлгэхийг өөрөө урина. */}
      {classTypes.length > 0 && (
        <Chapter
          id="classes"
          index={no('classes')}
          count={chapterCount}
          title={t.home.classesTitle}
          note={t.home.classesNote}
          action={<More href={`/${locale}/classes`}>{t.common.all}</More>}
        >
          <div
            className="rail bleed flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
            data-rv
          >
            {/* Захын зайг зам дотор нь хийнэ — эхний хайрцаг баганадаа
                эгнэж, сүүлийнх нь ирмэгт наалдахгүй. */}
            <span aria-hidden className="w-[var(--shell-pad)] shrink-0" />

            {classTypes.map((classType, index) => (
              <Link
                key={classType.id}
                href={`/${locale}/classes/${classType.slug}`}
                className="card card-link sheen group relative w-[76vw] shrink-0 snap-start overflow-hidden p-0 sm:w-[21rem]"
              >
                <Media
                  src={classType.cover_url}
                  alt={loc(classType, 'name', locale)}
                  seed={index}
                  ratio="aspect-[3/4]"
                  className="rounded-none"
                  sizes="(max-width: 640px) 76vw, 21rem"
                  overlay
                />

                <span className="tag tag-line absolute top-4 left-4 border-white/25 text-white/85 backdrop-blur-sm">
                  {t.level[classType.level]}
                </span>

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white">
                  <div className="min-w-0">
                    <p className="font-display text-[1.45rem] leading-tight font-semibold tracking-[0.005em]">
                      {loc(classType, 'name', locale)}
                    </p>
                    <p className="t-meta mt-1.5 text-white/65">
                      {classType.duration_min}
                      {t.common.minutes} · {formatMnt(classType.base_price)}
                    </p>
                  </div>
                  <span className="shrink-0 translate-x-2 text-white opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:opacity-100">
                    <Arrow className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}

            <span aria-hidden className="w-[var(--shell-pad)] shrink-0" />
          </div>
        </Chapter>
      )}

      {/* ══ 03 · Багш нар ═════════════════════════════════════════════════
          Хөрөг эгнээ хавтгай биш ШАТААР бууна. Гурван ижил хайрцаг зэрэгцвэл
          каталог болно; шатлал нь тэднийг хүн болгож, эгнээнд хэмнэл өгнө. */}
      {instructors.length > 0 && (
        <Chapter
          id="instructors"
          index={no('instructors')}
          count={chapterCount}
          title={t.home.instructorsTitle}
          note={t.home.instructorsNote}
          action={<More href={`/${locale}/instructors`}>{t.common.all}</More>}
        >
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3" data-stagger>
            {instructors.slice(0, 3).map((instructor, index) => (
              <Link
                key={instructor.id}
                href={`/${locale}/instructors/${instructor.slug}`}
                data-rv
                className={`group relative block ${
                  /* Утсан дээр хоёр багана — гурав дахь нь бүтэн өргөнөөр.
                     Шатлал зөвхөн өргөн дэлгэцэд утгатай. */
                  index === 2 ? 'col-span-2 lg:col-span-1' : ''
                } ${index === 1 ? 'lg:mt-14' : index === 2 ? 'lg:mt-28' : ''}`}
              >
                <div className="media sheen aspect-[4/5] border border-line transition-colors duration-300 group-hover:border-line-strong">
                  <Media
                    src={instructor.photo_url}
                    alt={instructor.name}
                    seed={index + 2}
                    ratio="absolute inset-0"
                    className="rounded-none border-0"
                    sizes="(max-width: 640px) 50vw, 33vw"
                    overlay
                  />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="font-display text-[1.3rem] leading-tight font-semibold tracking-[0.005em]">
                      {instructor.name}
                    </p>
                    {/* Товч намтар нь hover дээр ГАРЧ ирнэ: тайван үедээ
                        зураг дангаараа ярина, сонирхсон үед нь дэлгэрнэ. */}
                    <p className="t-meta bio-reveal mt-1.5 line-clamp-2 text-white/70">
                      {loc(instructor, 'bio', locale)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Chapter>
      )}

      {/* ══ 04 · Бичлэгүүд ════════════════════════════════════════════════
          Нэг том, хажууд нь хоёр жижиг. Тэнцүү гурав нь «сонголт» гэж
          хэлдэг бол энэ нь «эхлээд үүнийг үз» гэж хэлнэ. */}
      {videos.length > 0 && (
        <Chapter
          id="videos"
          index={no('videos')}
          count={chapterCount}
          title={t.home.videosTitle}
          note={t.home.videosNote}
        >
          <div className="g12 gap-y-6" data-rv>
            <div className="col-span-12 lg:col-span-7">
              <VideoEmbed
                id={videos[0].id}
                title={videos[0].title}
                playLabel={t.home.playVideo}
                watchLabel={t.home.watchOnYoutube}
              />
            </div>
            {videos.length > 1 && (
              <div className="col-span-12 flex flex-col gap-6 lg:col-span-4 lg:col-start-9">
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
        </Chapter>
      )}

      {/* ══ 05 · Дэлгүүр ══════════════════════════════════════════════════
          Хайрцаг биш ШУГАМААР тусгаарлагдсан бүртгэл. Барааны зураг өөрөө
          хайрцаг тул дээр нь хүрээ нэмэх нь давхардал. */}
      {products.length > 0 && (
        <Chapter
          id="shop"
          index={no('shop')}
          count={chapterCount}
          title={t.home.shopTitle}
          note={t.home.shopNote}
          action={<More href={`/${locale}/shop`}>{t.nav.shop}</More>}
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4" data-stagger>
            {products.slice(0, 4).map((product, index) => (
              <Link
                key={product.id}
                href={`/${locale}/shop/${product.slug}`}
                className="group flex flex-col gap-4"
                data-rv
              >
                <Media
                  src={product.images[0]?.url}
                  alt={loc(product, 'name', locale)}
                  seed={index + 1}
                  ratio="aspect-[4/5]"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
                  <p className="t-small font-medium transition-opacity duration-200 group-hover:opacity-60">
                    {loc(product, 'name', locale)}
                  </p>
                  <p className="t-meta shrink-0 text-muted">{formatMnt(product.minPrice)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Chapter>
      )}

      {/* ══ Төгсгөлийн уриалга ════════════════════════════════════════════
          Хуудас жагсаалтаар дуусах ёсгүй. Бүтэн өргөн тууз, ганц мэдэгдэл,
          ганц үндсэн үйлдэл — сонголт нэг л үлдсэнийг зохиомж хэлнэ. */}
      <section className="bleed relative isolate mt-[var(--bay)] overflow-hidden border-y border-line bg-surface py-24 sm:py-32">
        <div className="shell relative">
          <div className="g12 items-end gap-y-8">
            <h2 className="t-h1 col-span-12 max-w-[16ch] lg:col-span-7" data-rv>
              {t.about.ctaTitle}
            </h2>

            <div
              className="col-span-12 flex flex-col items-start gap-7 lg:col-span-4 lg:col-start-9"
              data-rv
            >
              <p className="t-small max-w-[40ch] text-muted">{t.about.ctaBody}</p>
              <div className="flex w-full flex-col gap-3 min-[420px]:w-auto min-[420px]:flex-row min-[420px]:flex-wrap">
                <ButtonLink href={`/${locale}/schedule`} className="btn-lg">
                  {t.schedule.book}
                  <Arrow />
                </ButtonLink>
                {/* Хуудас руу үсрэхгүй — цонх нээгдэнэ. Уриалгын хажууд
                    байгаа хоёрдогч зам тул хэрэглэгчийг эндээс хөдөлгөх нь
                    үндсэн товчны эрчийг тасалдаг. */}
                <ContactTrigger className="btn btn-bare btn-lg">
                  {t.nav.contact}
                </ContactTrigger>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
