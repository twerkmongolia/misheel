import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Empty, PageHeader, Section } from '@/components/ui'
import { Media } from '@/components/site/media'
import { SessionList } from '@/components/site/SessionList'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
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

  return (
    <div className="shell flex flex-col gap-16 pt-12 sm:pt-16">
      <PageHeader title={instructor.name} />

      <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <Media src={instructor.photo_url} alt={instructor.name} ratio="aspect-[4/5]" priority />
        <div className="flex flex-col gap-4">
          <p className="text-lg leading-relaxed text-foreground-soft">{loc(instructor, 'bio', locale)}</p>
          {instructor.instagram && (
            <a
              href={`https://instagram.com/${instructor.instagram}`}
              target="_blank"
              rel="noreferrer noopener"
              className="self-start text-sm text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-foreground"
            >
              @{instructor.instagram}
            </a>
          )}
        </div>
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
