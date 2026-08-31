import { notFound } from 'next/navigation'
import { Badge, ButtonLink, Empty, PageHeader, Section } from '@/components/ui'
import { Media } from '@/components/site/media'
import { SessionCard } from '@/components/site/SessionCard'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { formatMnt } from '@/lib/format'
import { getClassTypes, getUpcomingSessions } from '@/lib/data'
import { getUser } from '@/lib/auth/dal'
import { getMyBookedSessionIds } from '@/lib/data'

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const classTypes = await getClassTypes(true)
  const classType = classTypes.find((item) => item.slug === slug)
  if (!classType || !classType.is_active) notFound()

  const [sessions, user] = await Promise.all([getUpcomingSessions(50), getUser()])
  const booked = await getMyBookedSessionIds(user?.id ?? null)
  const mine = sessions.filter((session) => session.class_type_id === classType.id).slice(0, 6)

  return (
    <div className="shell flex flex-col gap-16 pt-12 sm:pt-16">
      <PageHeader title={loc(classType, 'name', locale)} lead={loc(classType, 'desc', locale)} />

      <div className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
        <Media
          src={classType.cover_url}
          alt={loc(classType, 'name', locale)}
          ratio="aspect-[4/3]"
          priority
        />
        <dl className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <dt className="w-28 t-small text-muted">{t.schedule.filterLevel}</dt>
            <dd>
              <Badge tone="accent">{t.level[classType.level]}</Badge>
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <dt className="w-28 t-small text-muted">{t.common.minutes}</dt>
            <dd className="tabular-nums">{classType.duration_min}</dd>
          </div>
          <div className="flex items-center gap-3">
            <dt className="w-28 t-small text-muted">{t.common.price}</dt>
            <dd className="font-medium tabular-nums">{formatMnt(classType.base_price)}</dd>
          </div>
          <ButtonLink href={`/${locale}/schedule`} className="mt-2 self-start">
            {t.nav.schedule}
          </ButtonLink>
        </dl>
      </div>

      <Section title={t.home.upcoming}>
        {mine.length === 0 ? (
          <Empty>{t.schedule.noSessions}</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {mine.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                locale={locale}
                booked={booked.has(session.id)}
                back={`/${locale}/classes/${slug}`}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
