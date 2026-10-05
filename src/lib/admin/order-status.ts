import type { Tone } from '@/components/admin/ui'
import type { OrderStatus } from '@/lib/supabase/database.types'

/**
 * Захиалгын төлвийн нэр, өнгө — «Захиалга» ба «Худалдан авагч» хоёр хуудас
 * ХОЁУЛАА уншина. Нэг хуудсанд «Бэлтгэж байна», нөгөөд нь «Бэлтгэгдэж буй»
 * гэж зөрвөл ажилтан хоёр өөр төлөв гэж бодно.
 */
export const orderStatusLabels: Record<OrderStatus, string> = {
  /* Админд зөвхөн нэхэмжлэх нь ДУУССАН мөр л энэ төлөвтэйгөөр гардаг —
     явцад буй нь нуугддаг (§ payment-outcome.ts). Тиймээс «хүлээж байна»
     биш, «амжилтгүй». */
  pending_payment: 'Төлбөр амжилтгүй',
  paid: 'Төлбөр баталгаажсан',
  preparing: 'Бэлтгэж байна',
  shipped: 'Илгээсэн',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
  refunded: 'Буцаагдсан',
}

/** Төлөв бүр өөрийн өнгөтэй — хүснэгтийг гүйлгэж хараад л ялгагдана. */
export const orderStatusTones: Record<OrderStatus, Tone> = {
  pending_payment: 'danger',
  paid: 'good',
  preparing: 'info',
  shipped: 'info',
  delivered: 'good',
  cancelled: 'danger',
  refunded: 'neutral',
}

/** Мөнгө ОРСОН төлвүүд — орлого, «авсан» дүнд зөвхөн эдгээр тоологдоно. */
export const PAID_ORDER_STATUSES: OrderStatus[] = ['paid', 'preparing', 'shipped', 'delivered']
