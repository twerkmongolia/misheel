'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/dal'
import { readCart, writeCart } from '@/lib/cart'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'

const orderErrorCodes = [
  'CART_EMPTY',
  'OUT_OF_STOCK',
  'VARIANT_UNAVAILABLE',
  'SHIPPING_REQUIRED',
] as const

function toErrorCode(message: string | undefined): string {
  return orderErrorCodes.find((code) => message?.includes(code)) ?? 'UNKNOWN'
}

function localeFrom(formData: FormData): Locale {
  const raw = String(formData.get('locale') ?? '')
  return isLocale(raw) ? raw : defaultLocale
}

const shippingSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(6),
  district: z.string().trim().max(120).default(''),
  khoroo: z.string().trim().max(120).default(''),
  address: z.string().trim().max(400).default(''),
  note: z.string().trim().max(1000).default(''),
})

/**
 * Захиалга үүсгэх.
 *
 * Дүн, нөөц, хямдралыг энд ТООЦООЛОХГҮЙ — бүгд `place_order` функц дотор,
 * нэг транзакцаар, мөрийг түгжсэн байдалтай хийгдэнэ. Cookie дэх сагс нь
 * зөвхөн «юу авах гэж байна» гэсэн санал.
 */
export async function placeOrder(formData: FormData): Promise<void> {
  const locale = localeFrom(formData)
  const checkout = `/${locale}/checkout`

  const user = await getUser()
  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(checkout)}`)
  }

  const cart = await readCart()
  if (cart.length === 0) {
    redirect(`${checkout}?error=CART_EMPTY`)
  }

  const parsed = shippingSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    district: formData.get('district') ?? '',
    khoroo: formData.get('khoroo') ?? '',
    address: formData.get('address') ?? '',
    note: formData.get('note') ?? '',
  })

  if (!parsed.success) {
    redirect(`${checkout}?error=SHIPPING_REQUIRED`)
  }

  const supabase = await createClient()
  const { data: orderNo, error } = await supabase.rpc('place_order', {
    p_items: cart.map((item) => ({ variant_id: item.variantId, qty: item.qty })),
    p_name: parsed.data.name,
    p_phone: parsed.data.phone,
    p_district: parsed.data.district,
    p_khoroo: parsed.data.khoroo,
    p_address: parsed.data.address,
    p_note: parsed.data.note || null,
  })

  if (error || !orderNo) {
    redirect(`${checkout}?error=${toErrorCode(error?.message)}`)
  }

  await writeCart([])
  revalidatePath('/', 'layout')
  redirect(`/${locale}/order/${orderNo}`)
}

export async function cancelOrder(formData: FormData): Promise<void> {
  const locale = localeFrom(formData)
  const orderId = z.string().uuid().safeParse(formData.get('order_id'))
  const orderNo = String(formData.get('order_no') ?? '')

  if (!orderId.success) {
    redirect(`/${locale}/account/orders`)
  }

  const user = await getUser()
  if (!user) {
    redirect(`/${locale}/login`)
  }

  const supabase = await createClient()
  await supabase.rpc('cancel_order', { p_order_id: orderId.data })

  revalidatePath('/', 'layout')
  redirect(orderNo ? `/${locale}/order/${orderNo}` : `/${locale}/account/orders`)
}
