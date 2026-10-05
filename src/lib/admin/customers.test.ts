import { describe, expect, it } from 'vitest'
import { segmentCustomers } from './customers'
import type { CourseMode } from '@/lib/supabase/database.types'

/* ───────────────────────────────────────────────────────────────────────────
   ХЭРЭГЛЭГЧИЙН ХЭСЭГЛЭЛ

   Бүлгүүд давхацдаг тул «хэдэн хүн» гэдэг асуулт хоёр янзаар буруудаж
   болно: нэг хүнийг хоёр анги авсных нь төлөө хоёр тоолох, эсвэл гурван
   бүлгийн нийлбэрийг «худалдан авагч» гэж харуулах. Хоёулаа дэлгэц дээр
   итгэл төрүүлэхүйц тоо гаргадаг — тиймээс энд баригдана.
   ─────────────────────────────────────────────────────────────────────── */

const modes = new Map<string, CourseMode>([
  ['online-a', 'online'],
  ['online-b', 'online'],
  ['studio-a', 'studio'],
])

describe('segmentCustomers', () => {
  it('нэг хүн хоёр онлайн анги авсан ч НЭГ л удаа тоологдоно', () => {
    const result = segmentCustomers({
      registered: 10,
      excluded: new Set(),
      enrollments: [
        { user_id: 'u1', course_id: 'online-a' },
        { user_id: 'u1', course_id: 'online-b' },
      ],
      courseMode: modes,
      shopBuyers: [],
    })
    expect(result.online).toBe(1)
    expect(result.buyers).toBe(1)
  })

  it('худалдан авагч нь бүлгүүдийн нийлбэр БИШ — давхардалгүй', () => {
    const result = segmentCustomers({
      registered: 10,
      excluded: new Set(),
      enrollments: [
        { user_id: 'u1', course_id: 'online-a' },
        { user_id: 'u1', course_id: 'studio-a' },
        { user_id: 'u2', course_id: 'studio-a' },
      ],
      courseMode: modes,
      shopBuyers: ['u1', 'u3', 'u3'],
    })
    expect(result).toEqual({ registered: 10, online: 1, studio: 2, shop: 2, buyers: 3, multi: 1 })
  })

  it('ажилтан, багшийн худалдан авалт бүлэгт орохгүй', () => {
    const result = segmentCustomers({
      registered: 5,
      excluded: new Set(['staff']),
      enrollments: [{ user_id: 'staff', course_id: 'online-a' }],
      courseMode: modes,
      shopBuyers: ['staff'],
    })
    expect(result.online).toBe(0)
    expect(result.shop).toBe(0)
    expect(result.buyers).toBe(0)
  })

  it('устсан анги танхимд тооцогдоно — орлогын тайлантай ижил', () => {
    const result = segmentCustomers({
      registered: 5,
      excluded: new Set(),
      enrollments: [{ user_id: 'u1', course_id: 'deleted' }],
      courseMode: modes,
      shopBuyers: [],
    })
    expect(result.studio).toBe(1)
  })
})
