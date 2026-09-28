import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { dayKey } from '@/lib/format'
import type { BookingStatus, OrderStatus } from '@/lib/supabase/database.types'
import { assemble, dayRange, emptyDay, type Range, type RevenueReport } from './revenue'

/* ───────────────────────────────────────────────────────────────────────────
   ОРЛОГО — НЭГ ЭХ СУРВАЛЖ, ДАВХАР ТООЛОЛТГҮЙ

   Энэ файлын бүх нарийн ширийн зүйл нэг л асуултаас гарна: «нэг төгрөг
   хоёр удаа тоологдохгүй гэдгийг юу баталж байна вэ?»

   Урхи нь `enroll_course()` дотор байна — тэр нь анги зарахдаа `orders`
   мөр, `order_items` мөр, `payments` мөр, `course_enrollments` мөр ДӨРВИЙГ
   зэрэг үүсгэдэг (§ migration `paid_seats`). Тиймээс `orders.total` ба
   `course_enrollments.price_paid` хоёрыг нэмбэл курсын мөнгө ХОЁР ДАХИН
   гарна. Самбар дээрх «7 хоногийн орлого» нь `orders` -ыг л уншдаг учир
   зөв боловч тэр нь ЗӨВХӨН нийлбэр — задаргаа өгдөггүй.

   Задаргааны цорын ганц зөв түлхүүр нь `order_items.course_id`:

     course_id ≠ null → анги (`courses.mode` нь онлайн/танхимыг хэлнэ)
     course_id = null → дэлгүүрийн бараа

   Ганц хичээл (`bookings`) нь захиалга ОГТ үүсгэдэггүй (§ `book_session`)
   тул тусдаа урсгал — түүнийг `orders` -оос хайх нь дэмий.
   ─────────────────────────────────────────────────────────────────────── */

/* Захиалга ОРЛОГО болох төлөв. `pending_payment` энд байхгүй: төлбөр
   онлайн тул хүн төлсөн эсвэл төлөөгүй, дунд төлөв гэж үгүй. */
const EARNED_ORDER: OrderStatus[] = ['paid', 'preparing', 'shipped', 'delivered']

/* Ганц хичээлийн орлого. `pending` нь «суудал барьсан, мөнгө ирээгүй» —
   түүнийг орлогод тооцвол ирээгүй мөнгө тайланд гарна. */
const EARNED_BOOKING: BookingStatus[] = ['confirmed', 'attended']

type OrderItem = { order_id: string; course_id: string | null; unit_price: number; qty: number }
type SessionRow = { id: string; instructor_id: string | null }
type CourseRow = { id: string; mode: string; instructor_id: string | null }

export async function loadRevenue(range: Range): Promise<RevenueReport> {
  const supabase = await createClient()

  /* Цонхны ХОЁР ДАХИН уртыг татна: эхний хагас нь «өмнөх үе», хоёр дахь нь
     одоогийнх. Өсөлтийн хувийг өөр асуулгаар авч болох ч тэр нь ижил
     хүснэгтүүдийг хоёр дахин уншина — огнооны хязгаарыг сунгах нь хямд. */
  const allDays = dayRange(range.span * 2)
  const sinceIso = new Date(`${allDays[0]}T00:00:00+08:00`).toISOString()

  /* Захиалгыг эхлээд татна — `order_items` нь тэдний id-гаар шүүгдэнэ.
     Хоёр шатыг нэгтгэх боломжтой ч тэгвэл RLS-тэй холболтод найдах
     болно; энэ нь тодорхой бөгөөд хязгаарлагдмал. */
  const [{ data: orders }, { data: bookings }, { data: instructors }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, created_at, status')
      .in('status', EARNED_ORDER)
      .gte('created_at', sinceIso),
    supabase
      .from('bookings')
      .select('session_id, price_paid, created_at, status')
      .in('status', EARNED_BOOKING)
      .gte('created_at', sinceIso),
    supabase.from('instructors').select('id, name'),
  ])

  const orderDay = new Map((orders ?? []).map((row) => [row.id, dayKey(row.created_at)]))

  const [{ data: items }, { data: sessions }] = await Promise.all([
    orderDay.size
      ? supabase
          .from('order_items')
          .select('order_id, course_id, unit_price, qty')
          .in('order_id', [...orderDay.keys()])
      : Promise.resolve({ data: [] as OrderItem[] }),
    bookings?.length
      ? supabase
          .from('class_sessions')
          .select('id, instructor_id')
          .in('id', [...new Set(bookings.map((row) => row.session_id))])
      : Promise.resolve({ data: [] as SessionRow[] }),
  ])

  /* Ангийн мэдээллийг зөвхөн ХЭРЭГТЭЙ нь татна: борлуулагдсан анги нь
     каталогийн жижиг хэсэг байж болно. */
  const courseIds = [...new Set((items ?? []).flatMap((row) => (row.course_id ? [row.course_id] : [])))]
  const { data: courses } = courseIds.length
    ? await supabase.from('courses').select('id, mode, instructor_id').in('id', courseIds)
    : { data: [] as CourseRow[] }

  const courseById = new Map((courses ?? []).map((row) => [row.id, row]))
  const sessionById = new Map((sessions ?? []).map((row) => [row.id, row]))

  const byDay = new Map(allDays.map((day) => [day, emptyDay(day)]))
  const perInstructor = new Map<string, { studio: number; session: number }>()

  /* Багш нарын задаргаа нь ЗӨВХӨН одоогийн цонхноос цуглана — бөгж нь
     баганын графиктай ижил хугацааг харуулах ёстой. */
  const current = new Set(allDays.slice(range.span))

  const credit = (id: string | null, key: 'studio' | 'session', amount: number, day: string) => {
    if (!current.has(day)) return
    // Багшгүй анги/хичээл ч орлого авчирдаг — түүнийг «Багш тодорхойгүй» болгоно.
    const bucket = perInstructor.get(id ?? '') ?? { studio: 0, session: 0 }
    bucket[key] += amount
    perInstructor.set(id ?? '', bucket)
  }

  for (const item of items ?? []) {
    const day = byDay.get(orderDay.get(item.order_id) ?? '')
    if (!day) continue

    const amount = item.unit_price * item.qty
    if (!item.course_id) {
      day.shop += amount
      continue
    }

    const course = courseById.get(item.course_id)
    /* Анги устсан бол горимыг нь мэдэх аргагүй. Мөнгө нь орсон хэвээр тул
       хаяхгүй — дэлгүүрт ч хамаарахгүй учир танхим гэж үзнэ (устгагдсан
       ангиудын дийлэнх нь танхимынх байсан). */
    if (course?.mode === 'online') {
      day.online += amount
    } else {
      day.studio += amount
      credit(course?.instructor_id ?? null, 'studio', amount, day.day)
    }
  }

  for (const booking of bookings ?? []) {
    const day = byDay.get(dayKey(booking.created_at))
    if (!day) continue
    day.session += booking.price_paid
    credit(
      sessionById.get(booking.session_id)?.instructor_id ?? null,
      'session',
      booking.price_paid,
      day.day,
    )
  }

  const rows = [...byDay.values()]
  return assemble(
    range,
    rows.slice(range.span),
    rows.slice(0, range.span),
    perInstructor,
    instructors ?? [],
  )
}
