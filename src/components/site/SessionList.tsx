import { SessionRow } from './SessionRow'
import { dayKey, formatDayShort, relativeDay, weekdayLong } from '@/lib/format'
import { getDictionary, type Locale } from '@/lib/i18n'
import type { SessionView } from '@/lib/data'

/**
 * Ойрын хичээлүүд — ӨДРИЙН РЕЛЬС + МӨРҮҮД.
 *
 * ── Юуг засав ──────────────────────────────────────────────────────────
 * Өмнөх хувилбарт өдрийн гарчиг мөрүүдийн ДЭЭР хэвтээ сууж, мөрүүд нь
 * 1400px багананы бүтэн өргөнийг эзэлдэг байв. Үр дүнд нь мөр бүрийн
 * дунд 800px хоосон зай үүсч, зүүн захын хичээл баруун захын үнэтэйгээ
 * харааны холбоогоо алддаг байлаа. Мөрийг хэчнээн засаад ч өргөн нь
 * өөрөө асуудал байсан.
 *
 * Одоо өдөр нь ЗҮҮН БАГАНА руу гарлаа. Энэ нь хоёр зүйлийг зэрэг хийнэ:
 *
 *   1. Илүүдэл өргөнийг ЗАРЦУУЛНА — хоосон зай мөрийн ДОТОР үлдэхээ
 *      больж, зохиомжийн бүтэц болж хувирна.
 *   2. Өдөр нь бүлгийнхээ ХАЖУУД зогсоно. Гүйлгэх үед наалдаж үлддэг тул
 *      «би одоо аль өдрийг харж байна вэ» гэдэг асуулт огт үүсэхгүй.
 *
 * Энэ бол цаг захиалгын самбар, тэмдэглэлийн дэвтрийн уншигдсан хэлбэр:
 * зүүнд огноо, баруунд тухайн өдрийн жагсаалт.
 *
 * ── Нарийн дэлгэц ──────────────────────────────────────────────────────
 * Хоёр багана багтахгүй тул рельс нь бүлгийнхээ ДЭЭР хэвтээ болж эргэнэ.
 * Тэнд өргөн хомс учир хоосон зайны асуудал байхгүй.
 */
export function SessionList({
  sessions,
  locale,
  booked,
  back,
  hide,
}: {
  sessions: SessionView[]
  locale: Locale
  booked?: Set<string>
  back?: string
  hide?: 'classType' | 'instructor'
}) {
  const t = getDictionary(locale)

  const days = new Map<string, SessionView[]>()
  for (const session of sessions) {
    const key = dayKey(session.starts_at)
    days.set(key, [...(days.get(key) ?? []), session])
  }

  return (
    <div className="flex flex-col gap-10 lg:gap-14">
      {[...days.entries()].map(([key, daySessions]) => {
        const first = daySessions[0]!
        const near = relativeDay(first.starts_at)

        return (
          <section
            key={key}
            id={`day-${key}`}
            className="scroll-mt-32 lg:grid lg:grid-cols-[9rem_minmax(0,52rem)] lg:items-start lg:gap-x-12"
          >
            {/* ── Өдрийн зангуу ────────────────────────────────────────
                Утсан дээр хэвтээ мөр, дэлгэц дээр босоо баганы толгой. */}
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 lg:sticky lg:top-28 lg:mb-0 lg:block">
              {near && <span className="tag tag-fill lg:mb-3">{t.common[near]}</span>}
              <h3 className="t-label text-foreground">{weekdayLong(first.starts_at, locale)}</h3>
              <span className="t-meta text-muted tabular-nums lg:mt-1 lg:block">
                {formatDayShort(first.starts_at, locale)}
              </span>
            </div>

            {/* Бүлгийн дээд шугам тод, мөр хоорондынх нимгэн — эрэмбэ нь
                шугамын ЖИНД. Хоёулаа ижил байвал бүлэг мэдэгдэхээ болино. */}
            <ul className="border-t border-line-strong">
              {daySessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  locale={locale}
                  booked={booked?.has(session.id) ?? false}
                  back={back}
                  hide={hide}
                />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
