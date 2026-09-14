import { z } from 'zod'

/**
 * Шууд худалдан авалтын «санал» — нэг хувилбар, нэг тоо ширхэг.
 *
 * Сагс байхгүй тул хэрэглэгчийн сонголт нь хаягийн мөрөнд (`?variant=…&qty=…`)
 * амьдардаг. Тэр нь хүн өөрөө засаж болох утга: 20 гэж бичсэнийг 200 болгож
 * чадна. Тиймээс хэлбэрийг ЭНД барьж, дүн, нөөцийг `place_order` функц дотор
 * дахин шалгана — эдгээр утгад итгэх шаардлагагүй.
 *
 * ⚠️ Энэ файл `'use server'` БИШ: тэнд зөвхөн async Server Action export
 * хийхийг зөвшөөрдөг ба хуудас, action хоёулаа энэ цэвэр функцийг дууддаг.
 */

export const MAX_BUY_QTY = 20

const buySchema = z.object({
  variantId: z.string().uuid(),
  qty: z.coerce.number().int().min(1).max(MAX_BUY_QTY),
})

export type BuyIntent = z.infer<typeof buySchema>

export function readBuyIntent(input: {
  variant?: string | string[] | null
  qty?: string | string[] | null
}): BuyIntent | null {
  const one = (value: string | string[] | null | undefined) =>
    Array.isArray(value) ? value[0] : (value ?? undefined)

  const parsed = buySchema.safeParse({
    variantId: one(input.variant),
    qty: one(input.qty) ?? 1,
  })

  return parsed.success ? parsed.data : null
}
