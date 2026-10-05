import { describe, expect, it } from 'vitest'
import { alignPrevious, axisLabel, emptyDay, type DayRevenue } from './revenue'

/* ───────────────────────────────────────────────────────────────────────────
   ОРЛОГО — ӨМНӨХ ҮЕИЙН ШУГАМ

   Графикийн хоёр дахь шугам нь «энэ үе» -тэй БАГАНА БҮРЭЭР харьцуулагдана.
   Багана нэгээр гулсвал график ямар ч алдаа өгөхгүй — зүгээр л буруу өдрийг
   буруу өдөртэй харьцуулна. Тиймээс энд л баригдана.
   ─────────────────────────────────────────────────────────────────────── */

/** `start` -аас эхлэн `span` өдөр, i дэх өдрийн дэлгүүрийн орлого = `amount(i)`. */
function days(start: string, span: number, amount: (index: number) => number): DayRevenue[] {
  const first = new Date(`${start}T00:00:00Z`)
  return Array.from({ length: span }, (_, index) => {
    const date = new Date(first)
    date.setUTCDate(first.getUTCDate() + index)
    return { ...emptyDay(date.toISOString().slice(0, 10)), shop: amount(index) }
  })
}

describe('axisLabel', () => {
  it('өдөр, долоо хоногийг сар/өдөр гэж товчилно', () => {
    expect(axisLabel('2026-09-28')).toBe('9/28')
    expect(axisLabel('2026-10-05')).toBe('10/5')
  })

  it('сарыг нэрээр нь', () => {
    expect(axisLabel('2026-09')).toBe('9-р сар')
  })
})

describe('alignPrevious', () => {
  it('өдрөөр: өмнөх үеийн i дэх өдөр одоогийн i дэх баганад очно', () => {
    const now = days('2026-09-29', 7, () => 0)
    const before = days('2026-09-22', 7, (index) => (index + 1) * 100)

    const aligned = alignPrevious(now, before, 'day')
    expect(aligned.map((bucket) => bucket.key)).toEqual(now.map((day) => day.day))
    expect(aligned.map((bucket) => bucket.shop)).toEqual([100, 200, 300, 400, 500, 600, 700])
  })

  it('долоо хоногоор: багана тоо, түлхүүр нь одоогийнхтой ЯГ ижил', () => {
    // 90 хоногийн хоёр цонх Даваа гаригт өөр өөр байрлалтай таардаг —
    // өөрийн огноогоор бүлэглэвэл баганын тоо зөрнө.
    const now = days('2026-07-08', 90, () => 1)
    const before = days('2026-04-09', 90, () => 1)

    const aligned = alignPrevious(now, before, 'week')
    const own = alignPrevious(now, now, 'week')
    expect(aligned.map((bucket) => bucket.key)).toEqual(own.map((bucket) => bucket.key))
    // Нийлбэр алдагдахгүй — өдөр бүр яг нэг баганад орно.
    expect(aligned.reduce((sum, bucket) => sum + bucket.shop, 0)).toBe(90)
  })

  it('өмнөх үе богино бол дутуу өдрийг тэгээр нөхнө', () => {
    const now = days('2026-09-29', 3, () => 0)
    const before = days('2026-09-26', 2, () => 50)

    expect(alignPrevious(now, before, 'day').map((bucket) => bucket.shop)).toEqual([50, 50, 0])
  })
})
