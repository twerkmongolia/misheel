import Link from 'next/link'
import { Button } from '@/components/ui'
import { bookSession } from '@/actions/bookings'
import { getDictionary, loc, type Locale } from '@/lib/i18n'
import { formatMnt, formatTime } from '@/lib/format'
import type { SessionView } from '@/lib/data'

/**
 * Хуваарийн нэгж — МӨР.
 *
 * ── Өмнөх хувилбар яагаад задарсан бэ ──────────────────────────────────
 * Мөр нь 1400px багананы БҮТЭН өргөнийг эзэлдэг байв. Зүүн захад цаг,
 * баруун захад үнэ — хооронд нь 800px хоосон зай. Тэр зай нь нэг мөрийг
 * хоёр тусдаа зүйл болгон таслаад, аль үнэ аль хичээлийнх вэ гэдгийг нүд
 * дагаж чадахгүй болгодог. Хүснэгт өргөн байх тусам уншигдахаа больдог.
 *
 * Шийдэл нь мөрийг ЗАСАХ биш, ӨРГӨНИЙГ нь хязгаарлах явдал байв —
 * § `SessionList` дотор өдрийн зангуу зүүн талын багана руу гарч,
 * мөрүүд нь нарийссан баганад үлдэнэ. Энд зөвхөн дотоод эрэмбэ:
 *
 *   1. Хэдэн цагт?   → serif тоо, зүүн зангуу
 *   2. Юу?           → хичээлийн нэр + мета
 *   3. Хэдэн төгрөг? → үнэ, доор нь суудал
 *   4. Орох уу?      → ТОВЧ
 *
 * ── Сүүлийн багана дандаа ТОВЧНЫ ХЭЛБЭРТЭЙ ─────────────────────────────
 * Орж болно → жинхэнэ товч. Болохгүй → товчны хэлбэртэй, тасархай
 * хүрээтэй, дарагддаггүй тэмдэг («Дүүрсэн», «Цуцлагдсан»). Аль хэдийн
 * орсон → дүүрсэн тэмдэг («✓ Бүртгүүлсэн»).
 *
 * Өмнө нь энд жижиг үг ганцаараа хөвж байсан — уншигч түүнийг олж
 * хардаггүй байлаа. Хэлбэрийг барьж, зөвхөн зурлагыг тасалснаар
 * «энд юу болох ёстойг» байрлал өөрөө хэлнэ.
 */
export function SessionRow({
  session,
  locale,
  booked = false,
  back,
  hide,
}: {
  session: SessionView
  locale: Locale
  booked?: boolean
  back?: string
  /**
   * Хуудасны гарчигтай ДАВХАРДСАН талбарыг хасна.
   *
   * Хичээлийн хуудсанд мөр бүр «Twerk үндэс» гэж бичигдвэл жагсаалт бүхэлдээ
   * нэг үг давтсан багана болдог. Тэнд хичээлийн нэрийг хасаад БАГШИЙН нэрийг
   * гарчиг болгоно — мөрүүд хоорондоо юугаараа ялгаатай, тэрийгээ л хэлэх нь
   * жагсаалтын үүрэг.
   */
  hide?: 'classType' | 'instructor'
}) {
  const t = getDictionary(locale)
  const cancelled = session.status === 'cancelled'
  const full = session.seatsLeft === 0
  const past = new Date(session.starts_at) <= new Date()
  const bookable = !cancelled && !past && !full && !booked

  /* Цөөхөн суудалтай хичээл нь ЯАРАЛТАЙ — үүнийг үг өөрөө хэлнэ
     («Сүүлийн 2 суудал»), жин нь давхар онцолно. Дүүрсэн, өнгөрсөн,
     цуцлагдсан хичээлд «0 суудал үлдсэн» гэж бичих нь мэдээлэл биш чимээ. */
  const scarce = bookable && session.seatsLeft <= 3
  const seats = !bookable
    ? null
    : scarce
      ? `${t.schedule.seatsLast} ${session.seatsLeft} ${t.common.seats}`
      : `${session.seatsLeft} ${t.schedule.seatsLeft}`

  const className = session.classType ? loc(session.classType, 'name', locale) : '—'
  const instructorName = session.instructor?.name ?? null
  const title = hide === 'classType' ? (instructorName ?? className) : className

  const meta = [
    hide ? null : instructorName,
    session.location?.name ?? null,
    session.classType ? t.level[session.classType.level] : null,
  ].filter(Boolean)

  return (
    <li className="group relative border-b border-line last:border-b-0">
      {/* Hover нь ДЭВСГЭР БИШ ЗУРААС. Дэвсгэр нь мөрийг өнгөт хавтан болгож,
          хуудасны бусад хэсгээс тасалж авдаг; зураас нь зөвхөн «гар энд
          байна» гэж заагаад орхино. Систем бүхэлдээ шугамаар баригдсан. */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[2px] origin-top scale-y-0 bg-foreground transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100"
      />

      <div
        className={`flex flex-col gap-4 py-5 pl-4 sm:py-6 md:grid md:grid-cols-[5rem_minmax(0,1fr)_auto_auto] md:items-center md:gap-x-7 md:gap-y-0 ${
          bookable ? '' : 'opacity-55'
        }`}
      >
        {/* ── 1 · Цаг ────────────────────────────────────────────────── */}
        <div className="flex items-baseline gap-2.5 md:block">
          <p className="t-num text-[1.75rem] md:text-[1.875rem]">
            {formatTime(session.starts_at)}
          </p>
          <p className="t-meta text-muted md:mt-1.5">
            <span aria-hidden className="text-faint">→ </span>
            {formatTime(session.ends_at)}
          </p>
        </div>

        {/* ── 2 · Хичээл ─────────────────────────────────────────────
            Холбоос нь бүтэн мөрөнд тархана — гар хаана ч буусан ажиллана. */}
        <div className="min-w-0">
          <Link
            href={`/${locale}/schedule/${session.id}`}
            className="t-h3 decoration-line-strong underline-offset-4 before:absolute before:inset-0 before:content-[''] group-hover:underline"
          >
            {title}
          </Link>
          {meta.length > 0 && <p className="t-small mt-1 text-muted">{meta.join(' · ')}</p>}
        </div>

        {/* ── 3+4 · Үнэ, суудал, үйлдэл ──────────────────────────────
            Утсан дээр нэг мөр: зүүнд тоо, баруунд товч. Ширээн дээр
            `md:contents` -ээр сав нь уусаж, хоёр тусдаа багана болно —
            ижилхэн разметка хоёр өөр зохиомж болж хувирна. */}
        <div className="flex items-center justify-between gap-4 md:contents">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 md:flex-col md:items-end md:gap-1">
            <span className="t-small font-semibold tabular-nums">{formatMnt(session.price)}</span>
            {seats && (
              <>
                <span aria-hidden className="text-faint md:hidden">
                  ·
                </span>
                <span
                  className={`t-meta whitespace-nowrap tabular-nums ${
                    scarce ? 'font-semibold text-foreground' : 'text-muted'
                  }`}
                >
                  {seats}
                </span>
              </>
            )}
          </div>

          <div className="flex shrink-0 justify-end">
            {bookable ? (
              /* Форм нь мөрийн холбоосын ДЭЭР байх ёстой — эс тэгвэл товч
                 дарахад дэлгэрэнгүй хуудас руу үсэрнэ. */
              <form action={bookSession} className="relative z-10">
                <input type="hidden" name="session_id" value={session.id} />
                <input type="hidden" name="locale" value={locale} />
                {back && <input type="hidden" name="back" value={back} />}
                <Button type="submit" variant="secondary" className="btn-sm">
                  {t.schedule.book}
                </Button>
              </form>
            ) : (
              <span className={`btn btn-sm ${booked ? 'btn-done' : 'btn-state'}`}>
                {booked ? (
                  <>
                    <span aria-hidden>✓</span> {t.schedule.booked}
                  </>
                ) : cancelled ? (
                  t.schedule.cancelled
                ) : full ? (
                  t.common.full
                ) : (
                  t.booking.past
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
