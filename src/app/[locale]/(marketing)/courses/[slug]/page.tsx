import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Alert, Badge, ButtonLink, Eyebrow, Field, Input, Textarea } from '@/components/ui'
import { Media } from '@/components/site/media'
import { getDictionary, loc, isLocale, type Locale } from '@/lib/i18n'
import { formatMnt, formatDate, formatDateTime } from '@/lib/format'
import { getCourseBySlug, getMyEnrollment, getCourseAccess, type CourseView } from '@/lib/data'
import { getUser, getProfile } from '@/lib/auth/dal'
import { enrollCourse } from '@/actions/courses'
import type { CourseEnrollment } from '@/lib/supabase/database.types'
import type { EnrollErrorCode } from '@/actions/courses'

/* ───────────────────────────────────────────────────────────────────────────
   КУРСЫН ДЭЛГЭРЭНГҮЙ

   Хуудсын гол ажил нь тайлбар БИШ, ШИЙДВЭР. Тиймээс баруун талын самбар нь
   гүйлгэхэд дагаж наалддаг бөгөөд хэрэглэгчийн ЯГ ОДООГИЙН нөхцөлд тохирсон
   ганц зүйлийг харуулна — долоон боломжийг зэрэг биш.

   Долоон төлөв бий (§ `EnrollPanel`). Тус бүр нь ЯАГААД гэдгийг хэлж, дараа
   нь ЮУ ХИЙХИЙГ санал болгоно: хаалттай бол холбоо барих, нэвтрээгүй бол
   нэвтрэх, төлбөр хүлээж буй бол захиалга руу, идэвхтэй бол Telegram руу.
   «Боломжгүй» гэсэн мухар мессеж хаана ч байхгүй.
   ─────────────────────────────────────────────────────────────────────── */

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ locale, slug }, search] = await Promise.all([params, searchParams])
  if (!isLocale(locale)) notFound()

  const course = await getCourseBySlug(slug)
  if (!course) notFound()

  // Идэвхгүй ангийг ажилтан урьдчилж харж болно; бусдад байхгүйтэй адил.
  const [user, profile] = await Promise.all([getUser(), getProfile()])
  const staff = profile?.role === 'staff' || profile?.role === 'admin'
  if (!course.is_active && !staff) notFound()

  const t = getDictionary(locale)
  const enrollment = await getMyEnrollment(course.id, user?.id ?? null)

  /* Telegram холбоосыг зөвхөн ХЭРЭГТЭЙ үед л асууна. Идэвхгүй элсэлттэй
     хүнд RLS нь хоосон буцаах ч дэмий нэг дуудлага л болно. */
  const access =
    course.mode === 'online' && enrollment?.status === 'active'
      ? await getCourseAccess(course.id)
      : null

  const errorCode = (search.error ?? '') as EnrollErrorCode
  const errorMessage = errorCode in t.courses.errors
    ? t.courses.errors[errorCode as keyof typeof t.courses.errors]
    : null

  const online = course.mode === 'online'

  return (
    <div className="shell flex flex-col gap-10 pt-10 sm:pt-14">
      {/* Буцах холбоос нь ГОРИМОО авч явна. Навбар дээр «Танхимын анги»,
          «Онлайн анги» гэсэн хоёр цэг байдаг тул дэлгэрэнгүй хуудсанд
          аль нь ч доогуур зураасгүй — буцах зам нь өөрөө хаанаас ирснийг
          хэлэх ёстой. */}
      <Link
        href={`/${locale}/courses?mode=${course.mode}`}
        className="lnk t-meta w-fit text-muted hover:text-foreground"
      >
        ← {course.mode === 'online' ? t.nav.onlineCourses : t.nav.studioCourses}
      </Link>

      {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}

      {!course.is_active && staff && (
        <Alert tone="warn">{t.courses.closedInactive}</Alert>
      )}

      <div className="grid items-start gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14">
        {/* ── Зүүн: ЮУ вэ ────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-col gap-8">
          <Media
            src={course.cover_url}
            alt={loc(course, 'name', locale)}
            ratio="aspect-[16/9]"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
          />

          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge tone={online ? 'accent' : 'neutral'}>
                {online ? t.courses.onlineBadge : t.courses.studioBadge}
              </Badge>
              <Badge tone="warn">{t.level[course.level]}</Badge>
            </div>

            <h1 className="t-h1">{loc(course, 'name', locale)}</h1>

            {loc(course, 'summary', locale) && (
              <p className="t-lead max-w-[52ch] text-foreground-soft">
                {loc(course, 'summary', locale)}
              </p>
            )}
          </header>

          <Facts course={course} locale={locale} />

          {loc(course, 'desc', locale) && (
            <section className="flex flex-col gap-4 border-t border-line pt-8">
              <Eyebrow>{t.courses.about}</Eyebrow>
              {/* `whitespace-pre-line` — админаас мөр таслаж бичсэн текст
                  тэр хэвээрээ уншигдана. Markdown танихгүй тул тэр нь
                  ажилтны хувьд хамгийн урьдчилж таамаглагдах зан төлөв. */}
              <p className="t-body max-w-[68ch] whitespace-pre-line text-foreground-soft">
                {loc(course, 'desc', locale)}
              </p>
            </section>
          )}
        </div>

        {/* ── Баруун: ЯАХ вэ ─────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-28">
          <EnrollPanel
            course={course}
            locale={locale}
            signedIn={Boolean(user)}
            enrollment={enrollment}
            telegramUrl={access?.telegram_url ?? null}
            defaultName={profile?.full_name ?? ''}
            defaultPhone={profile?.phone ?? ''}
          />
        </aside>
      </div>
    </div>
  )
}

/**
 * Баримтын жагсаалт — «энэ анги надад тохирох уу» гэсэн асуултын хариу.
 *
 * Хоосон талбар МӨР үүсгэхгүй. Оруулаагүй мэдээллийн оронд «—» гаргах нь
 * жагсаалтыг дүүрэн харагдуулах ч уншигчид юу ч өгөхгүй.
 */
function Facts({ course, locale }: { course: CourseView; locale: Locale }) {
  const t = getDictionary(locale)

  const rows: { label: string; value: string }[] = []

  if (course.lesson_count > 0) {
    rows.push({ label: t.courses.lessons, value: String(course.lesson_count) })
  }
  if (course.starts_on) {
    rows.push({
      label: t.courses.startsOn,
      value: formatDate(`${course.starts_on}T00:00:00+08:00`, locale),
    })
  }
  if (loc(course, 'schedule', locale)) {
    rows.push({ label: t.courses.schedule, value: loc(course, 'schedule', locale) })
  }
  if (course.instructor) {
    rows.push({ label: t.courses.instructor, value: course.instructor.name })
  }
  if (course.location) {
    rows.push({ label: t.courses.location, value: course.location.name })
  }

  if (rows.length === 0) return null

  return (
    <dl className="grid gap-x-8 gap-y-5 border-t border-line pt-8 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-1.5">
          <dt className="t-label text-faint">{row.label}</dt>
          <dd className="t-small font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/* ── Элсэлтийн самбар ─────────────────────────────────────────────────────
   Долоон төлөв, ЯГ НЭГИЙГ нь харуулна. Дараалал нь чухал: хамгийн хувийн
   баримтаас (би элссэн үү?) хамгийн ерөнхий рүү (энэ анги нээлттэй юу?)
   бууна — «дүүрсэн» гэж хэлээд дараа нь «үнэндээ та элссэн байна» гэж
   залруулах нь хэрэглэгчийн итгэлийг хоёр удаа алдагдуулна. */
function EnrollPanel({
  course,
  locale,
  signedIn,
  enrollment,
  telegramUrl,
  defaultName,
  defaultPhone,
}: {
  course: CourseView
  locale: Locale
  signedIn: boolean
  enrollment: CourseEnrollment | null
  telegramUrl: string | null
  defaultName: string
  defaultPhone: string
}) {
  const t = getDictionary(locale)
  const back = `/${locale}/courses/${course.slug}`
  const online = course.mode === 'online'

  // ── 1. Идэвхтэй элсэлт ─────────────────────────────────────────────────
  if (enrollment?.status === 'active' || enrollment?.status === 'completed') {
    return (
      <Shell course={course} locale={locale}>
        <p className="t-small font-medium">{t.courses.alreadyActive}</p>

        {online ? (
          telegramUrl ? (
            <>
              {/* Гол үйлдэл. Онлайн ангид элссэн хүний ЦОРЫН ГАНЦ асуулт нь
                  «хичээлээ хаанаас үзэх вэ» — тиймээс энэ товч самбарын
                  хамгийн том, хамгийн тод элемент. */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-solid w-full"
              >
                <TelegramIcon />
                {t.courses.openTelegram}
              </a>
              <p className="t-meta text-muted">{t.courses.telegramHint}</p>
            </>
          ) : (
            <Alert tone="warn">{t.courses.telegramMissing}</Alert>
          )
        ) : (
          <ButtonLink href={`/${locale}/account/courses`} variant="secondary" className="w-full">
            {t.courses.goToCourse}
          </ButtonLink>
        )}
      </Shell>
    )
  }

  // ── 2. Төлбөр хүлээгдэж буй элсэлт ─────────────────────────────────────
  if (enrollment?.status === 'pending_payment') {
    return (
      <Shell course={course} locale={locale}>
        <p className="t-small font-medium">{t.courses.alreadyPending}</p>
        <p className="t-meta text-muted">{t.courses.alreadyPendingHint}</p>
        <ButtonLink href={`/${locale}/account/orders`} variant="secondary" className="w-full">
          {t.courses.viewOrder}
        </ButtonLink>
      </Shell>
    )
  }

  // ── 3. Элсэлт хаалттай ─────────────────────────────────────────────────
  if (course.closedReason !== null) {
    const reason = {
      inactive: t.courses.closedInactive,
      not_open: t.courses.closedNotOpen,
      closed: t.courses.closedClosed,
      started: t.courses.closedStarted,
      full: t.courses.closedFull,
    }[course.closedReason]

    return (
      <Shell course={course} locale={locale}>
        <p className="t-small font-medium">{reason}</p>

        {/* Хаалттай ч ХЭЗЭЭ нээгдэхийг мэдэж байвал хэлнэ — хүлээх нь
            мэдэхгүй хүлээхээс хамаагүй хялбар. */}
        {course.closedReason === 'not_open' && course.enroll_opens_at && (
          <p className="t-meta text-muted">
            {t.courses.opensAt} · {formatDateTime(course.enroll_opens_at, locale)}
          </p>
        )}

        <p className="t-meta text-muted">{t.courses.closedHint}</p>
        <ButtonLink href={`/${locale}/contact`} variant="secondary" className="w-full">
          {t.nav.contact}
        </ButtonLink>
      </Shell>
    )
  }

  // ── 4. Нэвтрээгүй ──────────────────────────────────────────────────────
  if (!signedIn) {
    return (
      <Shell course={course} locale={locale}>
        <p className="t-small font-medium">{t.courses.loginToEnroll}</p>
        <p className="t-meta text-muted">{t.courses.loginHint}</p>
        {/* `next` нь буцаж ЯГ энэ хуудас руу авчирна — нэвтэрсний дараа
            нүүр хуудсанд хаягдвал хүн ангиа дахин хайх ёстой болно. */}
        <ButtonLink
          href={`/${locale}/login?next=${encodeURIComponent(back)}`}
          className="w-full"
        >
          {t.nav.login}
        </ButtonLink>
      </Shell>
    )
  }

  // ── 5. Элсэх боломжтой ─────────────────────────────────────────────────
  return (
    <Shell course={course} locale={locale}>
      <form action={enrollCourse} className="flex flex-col gap-4">
        <input type="hidden" name="course_id" value={course.id} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="back" value={back} />

        <p className="t-label text-faint">{t.courses.formTitle}</p>

        {/* Талбарууд профайлаас УРЬДЧИЛАН дүүрсэн: ихэнх хүн зүгээр л нэг
            товч дарна. Далдалж нуухгүй — ажилтан утсаар залгах тул хүн
            дугаараа шалгах боломжтой байх ёстой. */}
        <Field label={t.courses.name}>
          <Input name="name" defaultValue={defaultName} required minLength={2} maxLength={120} />
        </Field>

        <Field label={t.courses.phone}>
          <Input
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={defaultPhone}
            required
            minLength={6}
            maxLength={40}
          />
        </Field>

        <Field label={t.courses.note}>
          <Textarea name="note" rows={2} maxLength={500} placeholder={t.courses.notePlaceholder} />
        </Field>

        <button type="submit" className="btn btn-solid w-full">
          {course.price === 0 ? t.courses.enrollFree : t.courses.submit}
        </button>

        <p className="t-meta text-muted">{t.courses.formHint}</p>
      </form>
    </Shell>
  )
}

/** Самбарын хайрцаг — үнэ, суудал нь БҮХ төлөвт нэг байрандаа үлдэнэ. */
function Shell({
  course,
  locale,
  children,
}: {
  course: CourseView
  locale: Locale
  children: React.ReactNode
}) {
  const t = getDictionary(locale)

  return (
    <div className="flex flex-col gap-5 border border-line bg-surface p-6">
      <div className="flex items-baseline justify-between gap-4 border-b border-line pb-5">
        <span className="t-label text-faint">{t.courses.price}</span>
        <span className="t-h3 tabular-nums">
          {course.price === 0 ? t.courses.free : formatMnt(course.price)}
        </span>
      </div>

      {/* Суудлын үлдэгдэл нь ЗӨВХӨН цөөрсөн үед л мэдээлэл. «12-оос 12
          үлдсэн» гэдэг нь зүгээр л дуу чимээ. */}
      {course.seatsLeft !== null && course.seatsLeft > 0 && course.seatsLeft <= 3 && (
        <p className="t-meta font-medium">
          {t.courses.lastSeats} · {course.seatsLeft} {t.courses.seatsLeft}
        </p>
      )}

      {children}
    </div>
  )
}

function TelegramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-[18px] w-[18px] shrink-0"
      aria-hidden="true"
    >
      <path d="M21.7 3.4 2.9 10.7c-1.1.4-1.1 1.1-.2 1.4l4.7 1.5 1.8 5.5c.2.6.4.8 1 .8.5 0 .7-.2 1-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.2-.5-1.8-1.3-1.5ZM7.9 13.2l10.2-6.4c.5-.3.9-.1.6.2l-8.7 7.9-.3 3.6-1.8-5.3Z" />
    </svg>
  )
}
