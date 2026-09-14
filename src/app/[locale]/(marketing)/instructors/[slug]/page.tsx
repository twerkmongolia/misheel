import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Badge, Card, Empty, Eyebrow, InstagramIcon, PageHeader, Section } from '@/components/ui'
import { Media } from '@/components/site/media'
import { SessionList } from '@/components/site/SessionList'
import { getDictionary, loc, locList, isLocale } from '@/lib/i18n'
import { pageMetadata } from '@/lib/seo'
import { getInstructors, getMyBookedSessionIds, getUpcomingSessions } from '@/lib/data'
import { getUser } from '@/lib/auth/dal'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}

  const instructor = (await getInstructors(true)).find((row) => row.slug === slug)
  if (!instructor) return {}

  const t = getDictionary(locale)
  return pageMetadata({
    locale,
    title: instructor.name,
    description: loc(instructor, 'bio', locale).slice(0, 155) || t.meta.instructors,
    path: `/instructors/${instructor.slug}`,
    image: instructor.photo_url,
  })
}

export default async function InstructorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const instructors = await getInstructors(true)
  const instructor = instructors.find((item) => item.slug === slug)
  if (!instructor || !instructor.is_active) notFound()

  const [sessions, user] = await Promise.all([getUpcomingSessions(50), getUser()])
  const booked = await getMyBookedSessionIds(user?.id ?? null)
  const mine = sessions.filter((session) => session.instructor_id === instructor.id).slice(0, 6)

  const role = loc(instructor, 'role', locale)
  const bio = loc(instructor, 'bio', locale)
  const background = locList(instructor, 'background', locale)
  const expertise = locList(instructor, 'expertise', locale)
  const languages = locList(instructor, 'languages', locale)

  /* `typeof` -оор шалгах нь нарийн ширийн биш: код нь миграциас өмнө
     нийтлэгдэж болох ба тэр үед PostgREST `years` талбарыг ОГТ буцаахгүй.
     `!== null` нь `undefined` -ийг тоо гэж үзээд «undefined жил» гэж
     хэвлэнэ. */
  const years = typeof instructor.years === 'number' ? instructor.years : null

  return (
    <div className="shell flex flex-col gap-16 pt-12 sm:pt-16">
      <PageHeader eyebrow={t.nav.instructors} title={instructor.name} lead={role || undefined} />

      {/* ── Танилцуулга ──────────────────────────────────────────────────
          Хоёр багана, хоёр өөр үүрэг:

            ЗҮҮН  — хөрөг ба ШАЛГАЖ болох баримтууд (намтар, хэл). Эдгээр нь
                    мөр мөрөөрөө буудаг жагсаалт тул хуудасны зүүн шугамаас
                    эхэлж, дээрээс доош уншигдана.
            БАРУУН — КАРТ: багш өөрөө юу зааж, юугаараа ялгардаг. Карт нь
                    хуудсанаас нэг шат ДЭЭШ өргөгдсөн гадарга (§ globals.css
                    `.card`) бөгөөд энэ хэсгийг «энд гол зүйл байна» гэж
                    тэмдэглэнэ.

          Яагаад намтрыг доор нь бүтэн өргөнөөр тавихаа больсон бэ: хөрөг ба
          намтар хоёр НЭГ асуултад хариулдаг («энэ хэн бэ»), тэднийг хуудсаар
          тусгаарлавал уншигч хоёр удаа буцаж уншина. */}
      <div className="grid gap-8 md:grid-cols-[0.85fr_1fr] md:gap-10 lg:gap-14">
        <div className="flex flex-col gap-10">
          {/* Зураг ОРООГҮЙ багш дээр ч энэ хэсэг байрандаа үлдэнэ — `Media`
              нь өөрийн орлуулагчийг зурна (§ components/site/media.tsx).
              Ингэснээр админаас зураг нэмэх нь ЗАЙ үүсгэхгүй, зүгээр л
              байгаа зайг дүүргэнэ. */}
          <Media
            src={instructor.photo_url}
            alt={instructor.name}
            ratio="aspect-[4/5]"
            sizes="(max-width: 768px) 100vw, 40vw"
            priority
          />

          {/* Намтар нь хайрцаг биш ШУГАМ: дугаар нь эрэмбийг хэлнэ —
              боловсрол эхэлж, өнөөдрийн ажил төгсгөнө. */}
          {background.length > 0 && (
            <div className="flex flex-col gap-5">
              <Eyebrow plain>{t.instructor.background}</Eyebrow>
              <ol className="flex flex-col" data-stagger>
                {background.map((item, index) => (
                  <li
                    key={item}
                    data-rv
                    className="flex items-baseline gap-4 border-t border-line py-3.5 first:border-t-0 first:pt-0"
                  >
                    <span className="font-display text-xs font-bold text-muted tabular-nums">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {languages.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <Eyebrow plain>{t.instructor.languages}</Eyebrow>
              {/* Цэгээр тусгаарлана — таслал нь өгүүлбэр амласан мэт болох
                  ба эдгээр нь өгүүлбэр биш, ЖАГСААЛТ. */}
              <p className="text-sm text-foreground-soft">{languages.join(' · ')}</p>
            </div>
          )}
        </div>

        {/* Карт нь баганынхаа ОРОЙД наалдана — зүүн талын намтар урт байхад
            баруун талд хоосон талбай үүсдэггүй. */}
        <Card className="flex h-fit flex-col gap-8 rounded-[var(--r-xl)] sm:p-9 md:sticky md:top-24">
          {/* Заадаг чиглэл нь ЖАГСААЛТ биш ШОШГО. Уншигч эдгээрийг дараалан
              уншихгүй — «миний хайж байгаа нь энд байна уу» гэж СКАНДАНА. */}
          {expertise.length > 0 && (
            <div className="flex flex-col gap-4">
              <Eyebrow plain>{t.instructor.expertise}</Eyebrow>
              <ul className="flex flex-wrap gap-2">
                {expertise.map((item) => (
                  <li key={item}>
                    <Badge tone="neutral">{item}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bio && (
            <div className="flex flex-col gap-4">
              <Eyebrow plain>{t.instructor.bio}</Eyebrow>
              <p className="leading-relaxed text-foreground-soft">{bio}</p>
            </div>
          )}

          {/* Картын ХӨЛ: жил ба Instagram. Хоёулаа байхгүй бол шугам ч
              гарахгүй — хоосон хуваалт нь картыг дуусаагүй мэт харуулна. */}
          {(years !== null || instructor.instagram) && (
            <div
              /* Жил байхгүй үед `justify-between` нь хаягийг ганцаар нь
                 баруун захад шидэж, зүүн талд тайлбаргүй хоосон зай
                 үлдээнэ. Хоёулаа байж л эсрэг тийш нь тавих утгатай. */
              className={`mt-auto flex flex-wrap items-end gap-4 border-t border-line pt-6 ${
                years !== null ? 'justify-between' : 'justify-start'
              }`}
            >
              {years !== null && (
                <div className="flex flex-col gap-1">
                  <span className="t-label text-muted">{t.instructor.years}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="t-num font-display text-[2.25rem] leading-none font-medium">
                      {years}
                    </span>
                    <span className="t-label text-muted">{t.instructor.yearsUnit}</span>
                  </span>
                </div>
              )}

              {/* Instagram нь ЭНЭ картын цорын ганц ГАДАГШ гарах хаалга —
                  доогуур зураастай текст болж бусад мөрийн дунд төөрөх
                  ёсгүй. Дүрс нь хаана хүрэхийг үгнээс ӨМНӨ хэлж, бөмбөлөг
                  хүрээ нь «энэ дарагдана» гэдгийг хэлнэ.

                  Дүрс нь `.btn` доторх сум биш тул хажуу тийш гулсахгүй
                  (§ globals.css `.btn:hover .ico`) — хаяг нь чиглэл биш
                  ГАЗАР заадаг. */}
              {instructor.instagram && (
                <a
                  href={`https://instagram.com/${instructor.instagram}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-sm font-medium text-foreground-soft transition-colors duration-200 hover:border-line-strong hover:bg-surface-3 hover:text-foreground"
                >
                  <InstagramIcon />
                  @{instructor.instagram}
                </a>
              )}
            </div>
          )}
        </Card>
      </div>

      <Section title={t.home.upcoming}>
        {mine.length === 0 ? (
          <Empty>{t.schedule.noSessions}</Empty>
        ) : (
          /* `hide="instructor"` — багшийн нэр хуудасны гарчиг дээр аль хэдийн
             байгаа тул мөр бүр дээр давтахгүй. */
          <SessionList sessions={mine} locale={locale} booked={booked} hide="instructor" />
        )}
      </Section>
    </div>
  )
}
