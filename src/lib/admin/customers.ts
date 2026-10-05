import type { CourseMode } from '@/lib/supabase/database.types'

/* ───────────────────────────────────────────────────────────────────────────
   ХЭРЭГЛЭГЧИЙН ХЭСЭГЛЭЛ — ХЭН ЮУ ХУДАЛДАЖ АВСАН БЭ

   ⚠️ ЭНЭ ФАЙЛ ЦЭВЭР: өгөгдлийн сангийн уншилт нь § customers-query.ts.

   Гурван бүлэг ДАВХАЦНА: нэг хүн онлайн анги ч, дэлгүүрээс ч авсан байж
   болно. Тиймээс бүлгүүдийн нийлбэр нь «худалдан авалт хийсэн хүн» -тэй
   тэнцэхгүй — тэр тоог (`buyers`) тусад нь, ДАВХАРДАЛГҮЙ тоолно.

   Хувь бүр БҮРТГЭЛТЭЙ ХЭРЭГЛЭГЧЭЭС (`registered`) бодогдоно. Ажилтан,
   багш, админ тэнд ороогүй тул тэдний (ихэвчлэн туршилтын) худалдан
   авалтыг бүлгүүдээс ч хасна — эс бөгөөс хүртвэр, хуваарь хоёр өөр
   олонлогоос ирж, хувь 100-аас давж болно.
   ─────────────────────────────────────────────────────────────────────── */

export type CustomerSegments = {
  /** `role = customer` профайлын тоо. */
  registered: number
  online: number
  studio: number
  shop: number
  /** Ядаж нэг бүлэгт орсон хүн — давхардалгүй. */
  buyers: number
  /** Хоёр ба түүнээс олон бүлэгт орсон хүн. */
  multi: number
}

export function segmentCustomers({
  registered,
  excluded,
  enrollments,
  courseMode,
  shopBuyers,
}: {
  registered: number
  /** Хэрэглэгч БИШ профайлууд (ажилтан, багш, админ). */
  excluded: ReadonlySet<string>
  /** ТӨЛӨГДСӨН элсэлтүүд (`active`, `completed`). */
  enrollments: readonly { user_id: string; course_id: string }[]
  courseMode: ReadonlyMap<string, CourseMode>
  /** Дэлгүүрийн бараа агуулсан, төлөгдсөн захиалгын эзэд (давтагдаж болно). */
  shopBuyers: readonly string[]
}): CustomerSegments {
  const online = new Set<string>()
  const studio = new Set<string>()

  for (const row of enrollments) {
    if (excluded.has(row.user_id)) continue
    /* Анги устсан бол горимыг мэдэх аргагүй — орлогын тайлантай ижил дүрмээр
       танхим гэж үзнэ (§ revenue-query.ts): устгагдсан ангиудын дийлэнх нь
       танхимынх байсан бөгөөд хүн нь худалдан авалт хийсэн нь үнэн. */
    const group = courseMode.get(row.course_id) === 'online' ? online : studio
    group.add(row.user_id)
  }

  const shop = new Set(shopBuyers.filter((id) => !excluded.has(id)))

  const appearances = new Map<string, number>()
  for (const group of [online, studio, shop]) {
    for (const id of group) appearances.set(id, (appearances.get(id) ?? 0) + 1)
  }

  return {
    registered,
    online: online.size,
    studio: studio.size,
    shop: shop.size,
    buyers: appearances.size,
    multi: [...appearances.values()].filter((count) => count > 1).length,
  }
}
