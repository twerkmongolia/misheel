import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ButtonLink, Empty, Eyebrow, Section } from '@/components/ui'
import { Media } from '@/components/site/media'
import { SessionCard } from '@/components/site/SessionCard'
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

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const [site, sessions, classTypes, instructors, products] = await Promise.all([
    getSiteContent(['hero', 'about', 'videos']),
    getUpcomingSessions(4),
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

  return (
    <div className="flex flex-col gap-28">
      {/* ── Hero ─────────────────────────────────────────────────────────
          Хар дэвсгэр дээр гэрэл нь орон зайг үүсгэнэ. Гарчиг хамгийн том,
          бусад бүх зүйл түүнээс хойш эрэмбэлэгдэнэ. */}
      <section className="relative -mt-4">
        <div className="glow -top-28 -left-24 h-80 w-80" />
        <div className="glow glow-soft top-16 right-0 h-72 w-96" />

        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col items-start gap-7">
            <Eyebrow>Улаанбаатар</Eyebrow>

            {/* Үг бүрийг тусад нь мөрлөнө — өнгөгүй тул хэмжээ өөрөө мэдэгдэл болно */}
            <h1 className="text-[clamp(2.75rem,8vw,5.25rem)] leading-[0.9] font-bold">
              {String(hero.title ?? 'Twerk Mongolia')
                .split(' ')
                .map((word, index) => (
                  <span key={word + index} className="block">
                    {word}
                  </span>
                ))}
            </h1>

            <p className="max-w-[34ch] text-xl leading-snug text-foreground-soft">{hero.subtitle}</p>
            <p className="max-w-[46ch] text-foreground-soft/80">{hero.body}</p>

            <div className="flex flex-wrap gap-3 pt-2">
              <ButtonLink href={`/${locale}/schedule`}>{hero.cta ?? t.nav.schedule}</ButtonLink>
              <ButtonLink href={`/${locale}/classes`} variant="secondary">
                {t.nav.classes}
              </ButtonLink>
            </div>
          </div>

          {/* Багийн зураг хэвтээ, өргөн эгнээтэй — босоо хүрээнд хийвэл
              урд талын бүжигчин тасарна. Тиймээс 4:3, ирмэгээс өчүүхэн зүснэ. */}
          <Media
            src="/media/hero.jpg"
            alt={String(hero.title ?? '')}
            ratio="aspect-[4/3]"
            priority
          />
        </div>
      </section>

      {/* ── Тоон үзүүлэлт ────────────────────────────────────────────── */}
      {about.stat_students && (
        <section className="grid gap-4 sm:grid-cols-3">
          {stats.map(([value, label]) => (
            <div key={String(label)} className="card flex flex-col gap-1 p-7">
              <span className="font-display text-4xl leading-none font-bold tabular-nums">
                {value}
              </span>
              <span className="text-sm text-muted">{label}</span>
            </div>
          ))}
        </section>
      )}

      {/* ── Бичлэгүүд ────────────────────────────────────────────────────
          Заалны уур амьсгалыг үг хэлж чадахгүй — хөдөлгөөнийг харуулна. */}
      {videos.length > 0 && (
        <Section eyebrow="Видео" title={t.home.videosTitle}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <VideoEmbed
                key={video.id}
                id={video.id}
                title={video.title}
                playLabel={t.home.playVideo}
                watchLabel={t.home.watchOnYoutube}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ── Ойрын хичээлүүд ──────────────────────────────────────────── */}
      <Section
        eyebrow="Хуваарь"
        title={t.home.upcoming}
        action={
          <Link
            href={`/${locale}/schedule`}
            className="text-sm text-foreground-soft underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {t.home.upcomingAll} →
          </Link>
        }
      >
        {sessions.length === 0 ? (
          <Empty>{t.schedule.noSessions}</Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} locale={locale} />
            ))}
          </div>
        )}
      </Section>

      {/* ── Хичээлийн төрлүүд ────────────────────────────────────────── */}
      {classTypes.length > 0 && (
        <Section eyebrow="Юу сурах вэ" title={t.home.classesTitle}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {classTypes.map((classType, index) => (
              <Link
                key={classType.id}
                href={`/${locale}/classes/${classType.slug}`}
                className="card card-link flex flex-col gap-4 overflow-hidden p-4"
              >
                <Media
                  src={classType.cover_url}
                  alt={loc(classType, 'name', locale)}
                  seed={index}
                  ratio="aspect-[4/3]"
                />
                <div className="px-1 pb-1">
                  <p className="font-semibold">{loc(classType, 'name', locale)}</p>
                  <p className="mt-1 text-xs text-muted">
                    {t.level[classType.level]} · {classType.duration_min}
                    {t.common.minutes}
                  </p>
                  <p className="mt-3 text-sm font-semibold tabular-nums">
                    {formatMnt(classType.base_price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ── Багш нар ─────────────────────────────────────────────────── */}
      {instructors.length > 0 && (
        <Section
          eyebrow="Хэн заах вэ"
          title={t.home.instructorsTitle}
          action={
            <Link
              href={`/${locale}/instructors`}
              className="text-sm text-foreground-soft underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t.common.all} →
            </Link>
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {instructors.slice(0, 3).map((instructor, index) => (
              <Link
                key={instructor.id}
                href={`/${locale}/instructors/${instructor.slug}`}
                className="card card-link group relative overflow-hidden p-0"
              >
                <Media
                  src={instructor.photo_url}
                  alt={instructor.name}
                  seed={index + 2}
                  ratio="aspect-[4/5]"
                  className="rounded-none border-0"
                />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-display text-lg font-bold">{instructor.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-foreground-soft/85">
                    {loc(instructor, 'bio', locale)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ── Дэлгүүр ──────────────────────────────────────────────────── */}
      {products.length > 0 && (
        <Section
          eyebrow="Merch"
          title={t.home.shopTitle}
          action={
            <Link
              href={`/${locale}/shop`}
              className="text-sm text-foreground-soft underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {t.nav.shop} →
            </Link>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 4).map((product, index) => (
              <Link
                key={product.id}
                href={`/${locale}/shop/${product.slug}`}
                className="card card-link flex flex-col gap-4 p-4"
              >
                <Media
                  src={product.images[0]?.url}
                  alt={loc(product, 'name', locale)}
                  seed={index + 1}
                  ratio="aspect-square"
                />
                <div className="px-1 pb-1">
                  <p className="font-semibold">{loc(product, 'name', locale)}</p>
                  <p className="mt-1 text-sm text-muted tabular-nums">
                    {formatMnt(product.minPrice)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
