import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { notFound } from 'next/navigation'
import { ButtonLink, Card, Eyebrow, Section } from '@/components/ui'
import { Media } from '@/components/site/media'
import { getDictionary, loc, isLocale, type Locale } from '@/lib/i18n'
import { getInstructors } from '@/lib/data'
import { PageBanner } from '@/components/site/PageBanner'

/**
 * Хуудасны гэрэл зургууд.
 *
 * `public/media/about/` дотор ижил нэртэй файл байвал ХАРАГДАНА, байхгүй бол
 * орлуулагч зурагдана (§ components/site/media.tsx). Ингэснээр зургаа хожим
 * хаясан ч код засах шаардлагагүй — файлаа хийхэд л асна.
 */
const PHOTOS = {
  lineup: '/media/about/team-lineup.jpg',
  circle: '/media/about/team-circle.jpg',
  row: '/media/about/team-row.jpg',
  trio: '/media/about/trio.jpg',
  stage: '/media/about/stage.jpg',
} as const

/**
 * Файл байгаа эсэхийг шалгана.
 *
 * Уншиж чадахгүй орчин (жишээ нь edge runtime) байвал БАЙГАА гэж үзнэ —
 * зураг нь байсаар байтал орлуулагч гаргахаас хамаагүй дээр.
 */
function photo(path: string): string | null {
  try {
    return existsSync(join(process.cwd(), 'public', path)) ? path : null
  } catch {
    return path
  }
}

/**
 * Тоонуудын ЦОРЫН ГАНЦ эх сурвалж.
 *
 * Хэл тус бүрийн толь бичигт тоо давхардуулбал нэгийг нь засаад нөгөөг
 * мартах эрсдэлтэй тул текст тэнд, тоо энд.
 */
const STATS = { years: 4, students: '10 000+', shows: 4 } as const

/**
 * Battle Show-ийн үзэгчдийн тоо.
 *
 * `min`/`max` нь зохион байгуулагчийн хэлсэн муж (400–500 гэх мэт). Дундажийг
 * нь бодож ганц тоо болгосон бол байхгүй нарийвчлалыг зохиох байсан — тиймээс
 * баганыг мужаараа нь зурна: дүүрэн хэсэг = доод хязгаар, цайвар сүүл = дээд.
 *
 * Volume 4-ийн тоог мэдэхгүй тул ХООСОН. Таамаглаж бөглөхгүй.
 */
const SHOWS = [
  { key: 'v1' as const, name: 'Volume 1', date: null, min: 400, max: 500, women: 90 },
  { key: 'v2' as const, name: 'Volume 2', date: '2023.06.30', min: 600, max: 700, women: 80 },
  { key: 'v3' as const, name: 'Volume 3', date: null, min: 900, max: 1000, women: null },
  { key: 'v4' as const, name: 'Volume 4', date: null, min: null, max: null, women: null },
]

/** Хамгийн өндөр багана дэлгэцийн 100% -ийг эзэлнэ. */
const SCALE = Math.max(...SHOWS.map((show) => show.max ?? 0))

const numberFormat: Record<Locale, string> = { mn: 'mn-MN', en: 'en-US' }

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const instructors = await getInstructors()
  const format = (value: number) => new Intl.NumberFormat(numberFormat[locale]).format(value)

  const stats = [
    { value: String(STATS.years), label: t.about.statYears, hint: t.about.statYearsHint },
    { value: STATS.students, label: t.about.statStudents, hint: t.about.statStudentsHint },
    { value: String(STATS.shows), label: t.about.statShows, hint: t.about.statShowsHint },
  ]

  const points = [t.about.what.free, t.about.what.health, t.about.what.why]

  return (
    <>
      {/* Нээлтийн зураг ба гарчиг НЭГ блок боллоо. Урьд нь гарчиг дээр,
          зураг доор нь тусдаа зогсдог байсан — тууз хоёрыг нэгтгэнэ.
          `banners/about.jpg` олдоогүй бол хуудасны хуучин зургаа хэвээр
          хэрэглэнэ, юу ч алдагдахгүй. */}
      <PageBanner
        page="about"
        eyebrow={t.about.eyebrow}
        title="Twerk"
        lead={t.about.lead}
        fallbackSrc={photo(PHOTOS.lineup) ?? undefined}
      />

      <div className="shell flex flex-col gap-24 pt-12 sm:pt-16">

      {/* ── Twerk гэж юу вэ ──────────────────────────────────────────── */}
      <Section title={t.about.whatTitle}>
        <div className="grid gap-4 md:grid-cols-3">
          {points.map((point, index) => (
            <Card key={point.title} className="flex flex-col gap-3">
              <span className="font-display text-sm font-bold text-muted tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="t-h3">{point.title}</h3>
              <p className="text-sm leading-relaxed text-foreground-soft">{point.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── Зургийн эвлүүлэг ─────────────────────────────────────────────
          Өргөн зураг зүүн талд том, хоёр хөрөг баруун талд — гурвуулаа ижил
          хэмжээтэй байвал нүд хаана тогтохоо мэдэхгүй. */}
      <Section title={t.about.photosTitle}>
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Media
            src={photo(PHOTOS.row)}
            alt={t.about.photos.row}
            ratio="aspect-[4/3] lg:aspect-auto lg:h-full"
            seed={2}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Media
              src={photo(PHOTOS.trio)}
              alt={t.about.photos.trio}
              ratio="aspect-[4/5] lg:aspect-[5/4]"
              seed={3}
            />
            <Media
              src={photo(PHOTOS.stage)}
              alt={t.about.photos.stage}
              ratio="aspect-[4/5] lg:aspect-[5/4]"
              seed={4}
            />
          </div>
        </div>
      </Section>

      {/* ── Түүх ба үзүүлэлт ─────────────────────────────────────────────
          Гурван толгой тоо бол ГРАФИК биш — карт болгон харуулна. */}
      <Section title={t.about.storyTitle}>
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div className="flex flex-col gap-8">
            <p className="max-w-[52ch] text-lg leading-relaxed text-foreground-soft">
              {t.about.story}
            </p>

            <dl className="grid grid-cols-3 gap-4 border-y border-line py-6">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                  {/* Том тоо — пропорциональ цифрээр. `tabular-nums` нь цифр
                      бүрийг «0»-ийн өргөнтэй болгодог тул энэ хэмжээнд сулхан
                      харагдана; түүнийг зөвхөн багана дотор хэрэглэнэ. */}
                  <dd className="font-display text-[clamp(2rem,5vw,2.75rem)] leading-none font-bold">
                    {stat.value}
                  </dd>
                  <dt className="text-sm font-medium">{stat.label}</dt>
                  <dd className="text-xs leading-snug text-muted">{stat.hint}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Media src={photo(PHOTOS.circle)} alt={t.about.photos.circle} ratio="aspect-[4/5]" seed={1} />
        </div>
      </Section>

      {/* ── Battle Show ──────────────────────────────────────────────────
          Ажил нь «хэмжээг харьцуулах» тул хэвтээ багана. Нэг өнгө, хоёр шат:
          дүүрэн = доод хязгаар, цайвар = дээд хязгаар хүртэл. Өнгө биш УРТ
          нь мэдээлэл дамжуулна. */}
      <Section title={t.about.showsTitle}>
        <p className="max-w-[60ch] text-foreground-soft">{t.about.showsLead}</p>

        <ol className="flex flex-col">
          {SHOWS.map((show) => {
            const note = t.about.shows[show.key]
            const solid = show.min ? (show.min / SCALE) * 100 : 0
            const tail = show.max && show.min ? ((show.max - show.min) / SCALE) * 100 : 0

            return (
              <li
                key={show.key}
                className="flex flex-col gap-3 border-b border-line py-6 first:border-t sm:flex-row sm:items-center sm:gap-8"
              >
                <div className="flex min-w-0 shrink-0 flex-col gap-0.5 sm:w-44">
                  <span className="font-display t-h3">{show.name}</span>
                  <span className="t-meta text-muted tabular-nums">
                    {show.date ?? (note || ' ')}
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {show.min && show.max ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl leading-none font-semibold tabular-nums">
                          {format(show.min)}–{format(show.max)}
                        </span>
                        <span className="t-small text-muted">{t.about.showsAudience}</span>
                      </div>

                      {/* Замын өндөр нимгэн, төгсгөл нь бөөрөнхий. Хоёр
                          хэсгийн хооронд 2px зай — нийлээд нэг болж харагдахгүй. */}
                      <div
                        className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full bg-surface-2"
                        role="img"
                        aria-label={`${show.min}–${show.max} ${t.about.showsAudience}`}
                      >
                        <span
                          className="h-full rounded-full bg-foreground"
                          style={{ width: `${solid}%` }}
                        />
                        <span
                          className="h-full rounded-full bg-foreground/35"
                          style={{ width: `${tail}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <span className="t-small text-muted">{t.about.showsNoData}</span>
                  )}

                  {show.date && note && <p className="t-small text-muted">{note}</p>}
                </div>

                {show.women !== null && (
                  <div className="flex shrink-0 flex-col gap-1.5 sm:w-36">
                    <div className="flex h-1.5 w-full gap-[2px] overflow-hidden rounded-full">
                      <span
                        className="h-full rounded-full bg-foreground-soft"
                        style={{ width: `${show.women}%` }}
                      />
                      <span
                        className="h-full rounded-full bg-surface-3"
                        style={{ width: `${100 - show.women}%` }}
                      />
                    </div>
                    <span className="t-meta text-muted tabular-nums">
                      {show.women}% {t.about.showsWomen} · {100 - show.women}% {t.about.showsMen}
                    </span>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </Section>

      {/* ── Багш нар ─────────────────────────────────────────────────── */}
      {instructors.length > 0 && (
        <Section title={t.home.instructorsTitle}>
          <div className="grid gap-4 sm:grid-cols-3">
            {instructors.map((instructor, index) => (
              <Card key={instructor.id} className="flex flex-col gap-3">
                <Media
                  src={instructor.photo_url}
                  alt={instructor.name}
                  seed={index}
                  ratio="aspect-square"
                />
                <p className="font-medium">{instructor.name}</p>
                <p className="t-small text-muted">{loc(instructor, 'bio', locale)}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* ── Дуудлага ─────────────────────────────────────────────────── */}
      <section className="flex flex-col items-start gap-5 rounded-3xl border border-line bg-surface p-8 sm:p-12">
        <Eyebrow>{t.brand}</Eyebrow>
        <h2 className="max-w-[20ch] t-h2 sm:text-4xl">{t.about.ctaTitle}</h2>
        <p className="max-w-[52ch] text-foreground-soft">{t.about.ctaBody}</p>
        <div className="flex flex-wrap gap-3 pt-1">
          <ButtonLink href={`/${locale}/schedule`}>{t.nav.schedule}</ButtonLink>
          <ButtonLink href={`/${locale}/contact`} variant="secondary">
            {t.nav.contact}
          </ButtonLink>
        </div>
      </section>
    </div>
    </>
  )
}
