import { describe, expect, it } from 'vitest'
import {
  addDays,
  dayKey,
  dayOfMonth,
  formatDate,
  formatDateTime,
  formatDayShort,
  formatMnt,
  formatTime,
  relativeDay,
  toLocalInput,
  weekStart,
  weekdayLong,
  weekdayShort,
} from './format'

/* ───────────────────────────────────────────────────────────────────────────
   ФОРМАТ

   Энэ файл нь МӨНГӨ ба ЦАГ хоёрыг барина — хоёулаа чимээгүй эвдэрдэг.
   Буруу дүн нь дэлгэц дээр зөв мэт харагдана; нэг цагийн бүсээр гулссан
   хуваарь нь зөвхөн хэрэглэгч хичээлдээ хоцорсны дараа мэдэгддэг.

   ⚠️ Бүх огнооны тест УБ-ын цагаар (UTC+8) шалгагдана. Сервер аль ч бүсэд
   ажиллаж болох тул тест нь орчны цагийн бүсээс ХАМААРАХГҮЙ байх ёстой —
   тиймээс хүлээгдэж буй утгууд нь бүгд гараар тооцоологдсон.
   ─────────────────────────────────────────────────────────────────────── */

describe('formatMnt', () => {
  it('мянгатыг тусгаарлаж, төгрөгийн тэмдэг залгана', () => {
    expect(formatMnt(1_000_000)).toBe('1,000,000₮')
    expect(formatMnt(5000)).toBe('5,000₮')
  })

  it('тэг ба сөрөг дүнг алдалгүй харуулна', () => {
    // Сөрөг дүн нь буцаалтад гарна — «-» тэмдэг алга болвол буцаалт
    // төлбөр мэт харагдана.
    expect(formatMnt(0)).toBe('0₮')
    expect(formatMnt(-2500)).toContain('2,500₮')
    expect(formatMnt(-2500).startsWith('-')).toBe(true)
  })
})

describe('УБ-ын цагийн бүс', () => {
  // 2026-09-03T18:30Z = УБ-ын цагаар 2026-09-04, 02:30 — ӨӨР ӨДӨР.
  // Энэ бол цагийн бүсийн алдаа хамгийн түрүүнд гардаг цэг.
  const lateUtc = '2026-09-03T18:30:00.000Z'

  it('formatTime нь UTC биш УБ-ын цагийг өгнө', () => {
    expect(formatTime(lateUtc)).toBe('02:30')
  })

  it('dayKey нь УБ-ын ДАРААГИЙН өдрийг өгнө', () => {
    expect(dayKey(lateUtc)).toBe('2026-09-04')
  })

  it('formatDate нь хэл бүрд өөр хэлбэртэй', () => {
    expect(formatDate(lateUtc, 'mn')).toBe('2026.09.04')
    expect(formatDate(lateUtc, 'en')).toBe('4 Sep 2026')
  })

  it('formatDateTime нь огноо ба цагийг нэгтгэнэ', () => {
    expect(formatDateTime(lateUtc, 'mn')).toBe('2026.09.04 02:30')
  })

  it('toLocalInput нь `datetime-local` -д УБ-ын цагийг өгнө', () => {
    // ⚠️ `toISOString().slice(0,16)` бол 8 цагаар зөрнө — админы форм
    // нээгдэхэд цаг гулсана. Тиймээс энэ нь зөвхөн хэлбэрийн тест биш.
    expect(toLocalInput(lateUtc)).toBe('2026-09-04T02:30')
    expect(toLocalInput(null)).toBe('')
  })

  it('dayOfMonth ба formatDayShort нь мөн УБ-аар', () => {
    expect(dayOfMonth(lateUtc)).toBe('4')
    expect(formatDayShort(lateUtc, 'en')).toBe('4 Sep')
    expect(formatDayShort(lateUtc, 'mn')).toBe('9-р сарын 4')
  })
})

describe('гарагийн нэр', () => {
  // 2026-09-04 бол Баасан гараг (УБ).
  const friday = '2026-09-03T18:30:00.000Z'

  it('монголоор товч ба бүтэн', () => {
    expect(weekdayShort(friday, 'mn')).toBe('Ба')
    expect(weekdayLong(friday, 'mn')).toBe('Баасан')
  })

  it('англиар', () => {
    expect(weekdayShort(friday, 'en')).toBe('Fri')
  })
})

describe('weekStart', () => {
  it('долоо хоногийн эхлэл нь УБ-ын Даваа 00:00', () => {
    // 2026-09-04 (Баасан) → тэр долоо хоногийн Даваа бол 2026-08-31.
    // УБ-ын 00:00 = UTC-ийн өмнөх өдрийн 16:00.
    const start = weekStart(0, new Date('2026-09-03T18:30:00.000Z'))
    expect(start.toISOString()).toBe('2026-08-30T16:00:00.000Z')
    expect(dayKey(start.toISOString())).toBe('2026-08-31')
  })

  it('offsetWeeks нь долоо хоногоор шилжинэ', () => {
    const from = new Date('2026-09-03T18:30:00.000Z')
    expect(dayKey(weekStart(-1, from).toISOString())).toBe('2026-08-24')
    expect(dayKey(weekStart(1, from).toISOString())).toBe('2026-09-07')
  })

  it('Даваа гараг дээр өөр рүүгээ буцна', () => {
    // Хилийн тохиолдол: тухайн өдөр өөрөө Даваа бол шилжилт 0 байх ёстой.
    const monday = new Date('2026-08-31T05:00:00.000Z') // УБ-аар 13:00, Даваа
    expect(dayKey(weekStart(0, monday).toISOString())).toBe('2026-08-31')
  })
})

describe('addDays', () => {
  it('UTC өдрөөр нэмнэ, эх Date-ыг хөндөхгүй', () => {
    const base = new Date('2026-09-03T18:30:00.000Z')
    const next = addDays(base, 1)
    expect(next.toISOString()).toBe('2026-09-04T18:30:00.000Z')
    expect(base.toISOString()).toBe('2026-09-03T18:30:00.000Z')
  })

  it('сарын хилийг давна', () => {
    expect(addDays(new Date('2026-08-31T00:00:00.000Z'), 1).toISOString()).toBe(
      '2026-09-01T00:00:00.000Z',
    )
  })
})

describe('relativeDay', () => {
  const from = new Date('2026-09-03T04:00:00.000Z') // УБ-аар 12:00, 9-р сарын 3

  it('өнөөдөр ба маргаашийг нэрлэнэ', () => {
    expect(relativeDay('2026-09-03T10:00:00.000Z', from)).toBe('today')
    expect(relativeDay('2026-09-04T02:00:00.000Z', from)).toBe('tomorrow')
  })

  it('гуравдахь өдрөөс цааш нэр өгөхгүй', () => {
    expect(relativeDay('2026-09-05T02:00:00.000Z', from)).toBeNull()
    expect(relativeDay('2026-09-02T02:00:00.000Z', from)).toBeNull()
  })

  it('УБ-ын шөнө дундын дараах цагийг МАРГААШ гэж үзнэ', () => {
    // 2026-09-03T17:00Z = УБ-аар 9-р сарын 4, 01:00. UTC-ээр бодвол
    // «өнөөдөр» гэж хариулах бөгөөд тэр нь буруу.
    expect(relativeDay('2026-09-03T17:00:00.000Z', from)).toBe('tomorrow')
  })
})
