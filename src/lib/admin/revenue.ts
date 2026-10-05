import { addDays, dayKey } from '@/lib/format'

/* ───────────────────────────────────────────────────────────────────────────
   ОРЛОГО — ХЭМЖЭЭС БА УГСРАЛТ

   ⚠️ ЭНЭ ФАЙЛ ЦЭВЭР БАЙХ ЁСТОЙ. Өгөгдлийн сан, `next/headers`, `server-only`
   гурвын аль нь ч энд ОРОХГҮЙ. Шалтгаан нь хийсвэр биш: `STREAMS` ба
   `STREAM_LABEL` хоёрыг график (client бүрэлдэхүүн) утгаар нь импортолдог.
   Нэг л серверийн импорт нэмэгдмэгц тэр нь браузерын багц руу чирэгдэж,
   хуудас бүхэлдээ унана:

     You're importing a module that depends on "next/headers" …

   Өгөгдлийн сангаас уншдаг хэсэг нь § revenue-query.ts дотор.
   ─────────────────────────────────────────────────────────────────────── */

export const STREAMS = ['online', 'studio', 'session', 'shop'] as const
export type Stream = (typeof STREAMS)[number]

export const STREAM_LABEL: Record<Stream, string> = {
  online: 'Онлайн анги',
  studio: 'Танхим анги',
  session: 'Ганц хичээл',
  shop: 'Дэлгүүр',
}

export type DayRevenue = { day: string } & Record<Stream, number>

/* ───────────────────────────────────────────────────────────────────────────
   ХУГАЦААНЫ ЦОНХ

   Сонголт бүр ХЭДЭН ХОНОГ гэдгээс гадна НЭГ БАГАНА ХЭДЭН ХОНОГИЙГ хамрахыг
   тодорхойлно. Энэ хоёр дахийг салгах боломжгүй: жилийг өдрөөр зурвал 365
   багана болж, тус бүр нь нэг пикселээс нарийн — өгөгдөл байгаа ч уншигдахгүй.

   Тиймээс урт цонх бүр бүлэглэгдэнэ: улирал долоо хоногоор, жил сараар.
   ─────────────────────────────────────────────────────────────────────── */

/* ⚠️ Тийн ялгалыг НЭМЭЛТЭЭР залгаж болохгүй.
   `${label}оос` гэвэл «7 хоногоос» зөв гарах ч «1 жилоос», «3 сароос» гэж
   эвдэрнэ — монгол хэлний эгшгийн зохицол дагавар бүрийг өөрчилдөг.
   Тиймээс хэлбэр бүрийг ИЛ бичив. */
export const RANGES = [
  { key: '7', label: '7 хоног', of: '7 хоногийн', from: '7 хоногоос', in: '7 хоногт', span: 7, group: 'day' },
  { key: '30', label: '30 хоног', of: '30 хоногийн', from: '30 хоногоос', in: '30 хоногт', span: 30, group: 'day' },
  { key: '90', label: '3 сар', of: '3 сарын', from: '3 сараас', in: '3 сард', span: 90, group: 'week' },
  { key: '180', label: '6 сар', of: '6 сарын', from: '6 сараас', in: '6 сард', span: 180, group: 'week' },
  { key: '365', label: '1 жил', of: '1 жилийн', from: '1 жилээс', in: '1 жилд', span: 365, group: 'month' },
] as const satisfies readonly {
  key: string
  label: string
  /** «…ийн нийт» */
  of: string
  /** «өмнөх …» */
  from: string
  /** «сүүлийн …» */
  in: string
  span: number
  group: 'day' | 'week' | 'month'
}[]

export type Range = (typeof RANGES)[number]

/** Хаягнаас ирсэн утгыг цонх болгоно. Танихгүй бол 30 хоног. */
export function toRange(value: string | undefined): Range {
  return RANGES.find((row) => row.key === value) ?? RANGES[1]
}

/** График дээрх НЭГ багана. */
export type Bucket = { key: string; label: string } & Record<Stream, number>

export type InstructorRevenue = {
  id: string
  name: string
  /** Танхимын КУРСээс — хүн бүтэн хөтөлбөрт элсэж төлсөн мөнгө. */
  studio: number
  /** Хуваариас захиалсан ГАНЦ хичээлээс. */
  session: number
  total: number
}

export type RevenueReport = {
  range: Range
  /** График дээр зурагдах баганууд — цонхны дагуу бүлэглэгдсэн. */
  buckets: Bucket[]
  /** Өдрийн нарийвчлалтай эх өгөгдөл — дундаж, оргил өдөр тооцоход. */
  days: DayRevenue[]
  instructors: InstructorRevenue[]
  totals: Record<Stream, number>
  all: number
  /** Яг ижил урттай ӨМНӨХ цонхны нийлбэр — өсөлт бодоход. */
  previous: Record<Stream, number> & { all: number }
  /**
   * Өмнөх цонхны баганууд — `buckets` -тай ИЖИЛ түлхүүр, ижил тоотой
   * (§ `alignPrevious`). График дээр «энэ үе» -ийн дэргэд хоёр дахь шугам.
   */
  previousBuckets: Bucket[]
}

export function emptyDay(day: string): DayRevenue {
  return { day, online: 0, studio: 0, session: 0, shop: 0 }
}

/** Сүүлийн `span` хоногийн УБ-ын өдрүүд, хуучнаас шинэ рүү. */
export function dayRange(span: number): string[] {
  const today = new Date()
  return Array.from({ length: span }, (_, index) =>
    dayKey(addDays(today, index - (span - 1)).toISOString()),
  )
}

export type Named = { id: string; name: string }

function sumStreams(rows: { [K in Stream]: number }[]): Record<Stream, number> {
  return {
    online: rows.reduce((sum, row) => sum + row.online, 0),
    studio: rows.reduce((sum, row) => sum + row.studio, 0),
    session: rows.reduce((sum, row) => sum + row.session, 0),
    shop: rows.reduce((sum, row) => sum + row.shop, 0),
  }
}

/* ───────────────────────────────────────────────────────────────────────────
   ӨДРҮҮДИЙГ БАГАНА БОЛГОХ

   Долоо хоногийн бүлэг нь ДАВАА гаригаас эхэлнэ — студийн ажлын долоо хоног
   тэгж явдаг тул «энэ долоо хоног» гэдэг нь ажилтны хэлдэгтэй таарна.
   Календарын бүлэг биш «сүүлийн 7 хоног» гэж тоовол бүлэг бүр өөр гариг
   дээр эхэлж, харьцуулалт утгагүй болно.
   ─────────────────────────────────────────────────────────────────────── */
export function bucketize(days: DayRevenue[], group: 'day' | 'week' | 'month'): Bucket[] {
  if (group === 'day') {
    return days.map((day) => ({ key: day.day, label: dayLabel(day.day), ...pick(day) }))
  }

  const groups = new Map<string, DayRevenue[]>()
  for (const day of days) {
    const key = group === 'month' ? day.day.slice(0, 7) : mondayOf(day.day)
    groups.set(key, [...(groups.get(key) ?? []), day])
  }

  return [...groups.entries()].map(([key, rows]) => ({
    key,
    label: group === 'month' ? monthLabel(key) : dayLabel(key),
    ...sumStreams(rows),
  }))
}

function pick(day: DayRevenue): Record<Stream, number> {
  return { online: day.online, studio: day.studio, session: day.session, shop: day.shop }
}

/** `2026-09-28` → тухайн долоо хоногийн Даваа. */
function mondayOf(day: string): string {
  const date = new Date(`${day}T00:00:00Z`)
  // getUTCDay: 0 = Ням. Даваа руу ухрах алхам.
  const back = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - back)
  return date.toISOString().slice(0, 10)
}

/**
 * `2026-09-28` → `9-р сар 28`.
 *
 * Он нь богино цонхонд илүүц — бүх өдөр нэг онд байна. Харин ЖИЛИЙН
 * харагдацад «10-р сар 4» гэдэг нь аль оных болох нь тодорхойгүй болно,
 * тиймээс тэнд `withYear` шаардана.
 */
export function dayLabel(day: string, withYear = false): string {
  const [year, month, date] = day.split('-')
  if (!month || !date) return '—'
  const short = `${Number(month)}-р сар ${Number(date)}`
  return withYear ? `${year} · ${short}` : short
}

/**
 * Тэнхлэгийн богино шошго: өдөр/долоо хоног `9/28`, сар `9-р сар`.
 *
 * `dayLabel` -ийн «9-р сар 28» нь уншилтын мөрөнд зөв ч тэнхлэг дээр 6-7
 * удаа давтагдахад «-р сар» нь шошго бүрийн хагасыг эзэлж, тоонууд
 * хоорондоо мөргөлдөнө. Тэнхлэгт зөвхөн ТООНЫ хэлбэр л хэрэгтэй.
 */
export function axisLabel(key: string): string {
  const [, month, date] = key.split('-')
  if (!month) return '—'
  return date ? `${Number(month)}/${Number(date)}` : `${Number(month)}-р сар`
}

/**
 * Өмнөх цонхыг одоогийн цонхны БАГАНУУД руу буулгана.
 *
 * Хоёр цонх ижил урттай (span) тул өмнөхийн i дэх өдөр нь одоогийн i дэх
 * өдрийн «хос». Өмнөх өдөр бүрд ХОСЫН огноог өгөөд ердийн `bucketize` -аар
 * бүлэглэнэ — ингэснээр долоо хоног, сарын хил ч ЯГ одоогийнхтой таарна.
 *
 * ⚠️ Өмнөхийг өөрийн огноогоор бүлэглэж индексээр нь тааруулах нь ЭВДЭРНЭ:
 * 90 хоногийн цонх нэг үед 13, нөгөө үед 14 долоо хоногт хуваагдана (Даваа
 * гариг аль өдөр таарахаас хамаарна) — шугам нэг баганаар гулсаж, сүүлийн
 * цэг нь хоосон үлдэнэ.
 */
export function alignPrevious(
  days: DayRevenue[],
  before: DayRevenue[],
  group: 'day' | 'week' | 'month',
): Bucket[] {
  const shifted = days.map((day, index) => ({ ...(before[index] ?? emptyDay(day.day)), day: day.day }))
  return bucketize(shifted, group)
}

/** `2026-09` → `2026 · 9-р сар`. */
function monthLabel(key: string): string {
  const [year, month] = key.split('-')
  return year && month ? `${year} · ${Number(month)}-р сар` : '—'
}

export function assemble(
  range: Range,
  days: DayRevenue[],
  before: DayRevenue[],
  perInstructor: Map<string, { studio: number; session: number }>,
  named: Named[],
): RevenueReport {
  const nameById = new Map(named.map((row) => [row.id, row.name]))

  const instructors: InstructorRevenue[] = [...perInstructor.entries()]
    .map(([id, sums]) => ({
      id: id || 'unknown',
      name: nameById.get(id) ?? 'Багш тодорхойгүй',
      studio: sums.studio,
      session: sums.session,
      total: sums.studio + sums.session,
    }))
    .filter((row) => row.total > 0)
    /* Их орлоготой нь дээр. Цагаан толгойн дараалал нь энд утгагүй —
       асуулт нь «хэн хамгийн их авчирсан бэ» гэдэг. */
    .sort((a, b) => b.total - a.total)

  const totals = sumStreams(days)
  const prev = sumStreams(before)

  return {
    range,
    buckets: bucketize(days, range.group),
    days,
    instructors,
    totals,
    all: totals.online + totals.studio + totals.session + totals.shop,
    previous: { ...prev, all: prev.online + prev.studio + prev.session + prev.shop },
    previousBuckets: alignPrevious(days, before, range.group),
  }
}
