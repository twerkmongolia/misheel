import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { EARNED_ORDER } from './revenue-query'
import { segmentCustomers, type CustomerSegments } from './customers'

/* ───────────────────────────────────────────────────────────────────────────
   ХЭРЭГЛЭГЧИЙН ХЭСЭГЛЭЛ — УНШИЛТ

   ⚠️ Supabase нэг хүсэлтэд ихдээ 1000 мөр буцаана (PostgREST `max-rows`) —
   АЛДАА ӨГӨХГҮЙ, зүгээр л таслана. Бүх хугацааны элсэлт, захиалгыг
   уншдаг тул энэ хязгаарт хүрэх нь цаг хугацааны асуудал: тэр өдөр график
   чимээгүйхэн «өсөхөө больж», хэн ч анзаарахгүй. Тиймээс хуудаслаж
   (`fetchAll`) дуустал уншина.

   Дэлгүүрийн худалдан авагч = КУРСгүй мөр (`course_id IS NULL`) агуулсан
   төлөгдсөн захиалгын эзэн. `enroll_course()` анги зарахдаа ч `orders` мөр
   үүсгэдэг тул захиалгын эзэн бүгд дэлгүүрийн үйлчлүүлэгч биш
   (§ revenue-query.ts ижил урхи).
   ─────────────────────────────────────────────────────────────────────── */

const PAGE = 1000

async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) return rows
  }
}

export async function loadCustomerSegments(): Promise<CustomerSegments> {
  const supabase = await createClient()

  const [{ count: registered }, { data: others }, enrollments, { data: courses }, orders, shopItems] =
    await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      // Хэрэглэгч БИШ профайлууд цөөхөн (ажилтан, багш) — нэг хүсэлтэд багтана.
      supabase.from('profiles').select('id').neq('role', 'customer'),
      fetchAll((from, to) =>
        supabase
          .from('course_enrollments')
          .select('user_id, course_id')
          // Төлөгдсөн элсэлт л — `pending_payment` нь төлөөгүй, барьцаа.
          .in('status', ['active', 'completed'])
          .order('id')
          .range(from, to),
      ),
      supabase.from('courses').select('id, mode'),
      fetchAll((from, to) =>
        supabase.from('orders').select('id, user_id').in('status', EARNED_ORDER).order('id').range(from, to),
      ),
      fetchAll((from, to) =>
        supabase.from('order_items').select('order_id').is('course_id', null).order('id').range(from, to),
      ),
    ])

  const shopOrders = new Set(shopItems.map((row) => row.order_id))

  return segmentCustomers({
    registered: registered ?? 0,
    excluded: new Set((others ?? []).map((row) => row.id)),
    enrollments,
    courseMode: new Map((courses ?? []).map((row) => [row.id, row.mode])),
    shopBuyers: orders.filter((row) => shopOrders.has(row.id)).map((row) => row.user_id),
  })
}
