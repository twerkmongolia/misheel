import Link from 'next/link'
import { Alert, Badge, ButtonLink, Section } from '@/components/ui'
import { Media } from '@/components/site/media'
import { getDictionary, loc, type Locale } from '@/lib/i18n'
import { formatMnt, formatDate } from '@/lib/format'
import { getMyEnrollments, getCourseTelegramUrl, type EnrollmentView } from '@/lib/data'
import { cancelEnrollment } from '@/actions/courses'

/* ───────────────────────────────────────────────────────────────────────────
   ЭЛССЭН АНГИ

   Ганц ажил: «би төлбөрөө төлсөн, ОДОО ЯАХ ВЭ» гэсэн асуултад хариулах.
   Онлайн ангид хариу нь Telegram товч, танхимынхад эхлэх өдөр ба хуваарь.

   Гурван бүлэг, ЭНЭ дарааллаар: идэвхтэй → төлбөр хүлээгдэж буй → дууссан.
   Хамгийн дээр нь өнөөдөр хийх зүйл, доор нь түүх.

   ── Яагаад хуудаснаас САЛСАН бэ ──────────────────────────────────────────
   «Миний анги», «Миний хичээлүүд» гэсэн хоёр таб нэг болсон
   (§ account/courses/page.tsx). Ачаалах ба зурах хоёрыг тусад нь гаргасан
   нь хуудсанд ХОЁУЛАА хоосон эсэхийг мэдэх боломж өгнө — эс бөгөөс «юу ч
   алга» гэсэн мэдэгдэл хоёр удаа давхарлан гарна.
   ─────────────────────────────────────────────────────────────────────── */

export type EnrollmentData = {
  rows: EnrollmentView[]
  /** course_id → Telegram холбоос. Зөвхөн идэвхтэй онлайн ангид. */
  links: Map<string, string>
}

export async function loadEnrollments(userId: string): Promise<EnrollmentData> {
  const rows = await getMyEnrollments(userId)

  /* Telegram холбоосуудыг НЭГ дор татна. Мөр бүрд нэг дуудлага хийвэл
     таван ангитай хүнд таван дараалсан асуулга үүснэ — бүгд бие биенээ
     хүлээж. */
  const onlineActive = rows.filter(
    (row) => row.course.mode === 'online' && row.status === 'active',
  )
  const links = new Map<string, string>()
  await Promise.all(
    onlineActive.map(async (row) => {
      const url = await getCourseTelegramUrl(row.course_id, row.status)
      if (url) links.set(row.course_id, url)
    }),
  )

  return { rows, links }
}

/**
 * `part` нь ДАРААЛЛЫН тухай, агуулгын тухай биш.
 *
 * Хуудас нь анги, хичээл хоёрын АМЬД хэсгийг эхлээд, ТҮҮХИЙГ нь дараа нь
 * зурна (§ courses/page.tsx). Нэг бүлгийг бүхэлд нь дараалуулбал «Дууссан
 * ба цуцлагдсан анги» нь «Ирэх хичээлүүд» -ийг доош түлхэж, маргааш очих
 * хичээл нь хоёр жилийн өмнөх түүхийн доор үлдэнэ.
 */
export function EnrollmentSections({
  data,
  locale,
  part,
}: {
  data: EnrollmentData
  locale: Locale
  part: 'live' | 'history'
}) {
  const t = getDictionary(locale)
  const { rows, links } = data

  const active = part === 'live' ? rows.filter((row) => row.status === 'active') : []
  const pending = part === 'live' ? rows.filter((row) => row.status === 'pending_payment') : []
  const closed =
    part === 'history'
      ? rows.filter((row) => row.status === 'completed' || row.status === 'cancelled')
      : []

  return (
    <>
      {active.length > 0 && (
        <Section title={t.courses.sectionActive}>
          <div className="flex flex-col gap-5">
            {active.map((row) => (
              <EnrollmentRow
                key={row.id}
                row={row}
                locale={locale}
                telegramUrl={links.get(row.course_id) ?? null}
              />
            ))}
          </div>
        </Section>
      )}

      {pending.length > 0 && (
        <Section title={t.courses.sectionPending}>
          <div className="flex flex-col gap-5">
            {pending.map((row) => (
              <EnrollmentRow key={row.id} row={row} locale={locale} telegramUrl={null} />
            ))}
          </div>
        </Section>
      )}

      {closed.length > 0 && (
        <Section title={t.courses.sectionClosed}>
          <div className="flex flex-col gap-5">
            {closed.map((row) => (
              <EnrollmentRow key={row.id} row={row} locale={locale} telegramUrl={null} />
            ))}
          </div>
        </Section>
      )}
    </>
  )
}

const statusKey = {
  pending_payment: 'statusPending',
  active: 'statusActive',
  completed: 'statusCompleted',
  cancelled: 'statusCancelled',
} as const

function EnrollmentRow({
  row,
  locale,
  telegramUrl,
}: {
  row: EnrollmentView
  locale: Locale
  telegramUrl: string | null
}) {
  const t = getDictionary(locale)
  const { course } = row
  const online = course.mode === 'online'
  const dead = row.status === 'cancelled'

  return (
    /* Цуцлагдсан мөр БҮДГЭРНЭ, алга болохгүй. «Би бүртгүүлсэн байсан юм,
       хаашаа алга болов?» гэсэн эргэлзээ нь хамгийн хурдан итгэл
       алдагдуулдаг — түүх нь харагдаж байх ёстой. */
    <article
      className={`flex flex-col gap-5 border-b border-line pb-6 last:border-b-0 sm:flex-row sm:items-start sm:gap-6 ${
        dead ? 'opacity-55' : ''
      }`}
    >
      <div className="w-full shrink-0 sm:w-40">
        <Media
          src={course.cover_url}
          alt={loc(course, 'name', locale)}
          ratio="aspect-[4/3]"
          sizes="160px"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone={online ? 'accent' : 'neutral'}>
            {online ? t.courses.onlineBadge : t.courses.studioBadge}
          </Badge>
          <span className="t-meta text-muted">{t.courses[statusKey[row.status]]}</span>
        </div>

        <Link
          href={`/${locale}/courses/${course.slug}`}
          className="t-h3 lnk w-fit hover:text-foreground"
        >
          {loc(course, 'name', locale)}
        </Link>

        <p className="t-meta text-faint">
          {[
            course.starts_on
              ? `${t.courses.startsOn} · ${formatDate(`${course.starts_on}T00:00:00+08:00`, locale)}`
              : null,
            loc(course, 'schedule', locale) || null,
            row.price_paid > 0 ? formatMnt(row.price_paid) : t.courses.free,
          ]
            .filter(Boolean)
            .join('  ·  ')}
        </p>

        <Actions row={row} locale={locale} telegramUrl={telegramUrl} />
      </div>
    </article>
  )
}

/** Мөр бүрийн ЯГ ОДООГИЙН дараагийн алхам — нэг л зүйл. */
function Actions({
  row,
  locale,
  telegramUrl,
}: {
  row: EnrollmentView
  locale: Locale
  telegramUrl: string | null
}) {
  const t = getDictionary(locale)
  const online = row.course.mode === 'online'

  if (row.status === 'active' && online) {
    return telegramUrl ? (
      <div className="mt-1 flex flex-col gap-2">
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-solid btn-sm w-fit"
        >
          <TelegramIcon />
          {t.courses.openTelegram}
        </a>
        <span className="t-meta text-muted">{t.courses.telegramHint}</span>
      </div>
    ) : (
      <Alert tone="warn">{t.courses.telegramMissing}</Alert>
    )
  }

  if (row.status === 'pending_payment') {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <ButtonLink href={`/${locale}/account/orders`} variant="secondary" className="btn-sm">
          {t.courses.viewOrder}
        </ButtonLink>
        {/* Цуцлах нь ТАСАРХАЙ хүрээтэй — санамсаргүй дарахаас хэлбэрээрээ
            сэргийлнэ (§ globals.css `.btn-risk`). */}
        <form action={cancelEnrollment}>
          <input type="hidden" name="enrollment_id" value={row.id} />
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" className="btn btn-risk btn-sm">
            {t.courses.cancelEnrollment}
          </button>
        </form>
      </div>
    )
  }

  return null
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d="M21.7 3.4 2.9 10.7c-1.1.4-1.1 1.1-.2 1.4l4.7 1.5 1.8 5.5c.2.6.4.8 1 .8.5 0 .7-.2 1-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.2-.5-1.8-1.3-1.5ZM7.9 13.2l10.2-6.4c.5-.3.9-.1.6.2l-8.7 7.9-.3 3.6-1.8-5.3Z" />
    </svg>
  )
}
