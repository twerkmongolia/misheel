import 'server-only'

import { cookies } from 'next/headers'
import { z } from 'zod'

/**
 * Сагс нь cookie дотор амьдардаг.
 *
 * Яагаад DB биш вэ: зочин (нэвтрээгүй) хэрэглэгчийн сагсыг RLS-ээр хамгаалах
 * боломжгүй, харин cookie нь өөрөө тухайн хөтчид л хамаарна. Захиалга
 * үүсгэхэд нэвтрэх шаардлагатай бөгөөд үнэ, нөөцийг тэр үед DB-ээс дахин
 * тооцоолдог тул cookie дэх өгөгдөлд итгэх шаардлагагүй.
 */

const COOKIE = 'tm_cart'
const MAX_ITEMS = 30
const MAX_QTY = 20

const cartSchema = z.array(
  z.object({
    variantId: z.string().uuid(),
    qty: z.number().int().min(1).max(MAX_QTY),
  }),
)

export type CartItem = z.infer<typeof cartSchema>[number]

export async function readCart(): Promise<CartItem[]> {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return []

  try {
    const parsed = cartSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data.slice(0, MAX_ITEMS) : []
  } catch {
    return []
  }
}

export async function writeCart(items: CartItem[]): Promise<void> {
  const cookieStore = await cookies()
  const cleaned = items.filter((item) => item.qty > 0).slice(0, MAX_ITEMS)

  if (cleaned.length === 0) {
    cookieStore.delete(COOKIE)
    return
  }

  cookieStore.set(COOKIE, JSON.stringify(cleaned), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function cartCount(): Promise<number> {
  return (await readCart()).reduce((sum, item) => sum + item.qty, 0)
}
