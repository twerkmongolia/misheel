'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { readCart, writeCart } from '@/lib/cart'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'

const variantId = z.string().uuid()
const qty = z.coerce.number().int().min(0).max(20)

function localeFrom(formData: FormData): Locale {
  const raw = String(formData.get('locale') ?? '')
  return isLocale(raw) ? raw : defaultLocale
}

/**
 * Сагс cookie дотор байдаг тул энд зөвхөн id + тоо ширхэг хадгална.
 * Үнэ, нөөцийг захиалга үүсгэх үед DB-ээс дахин уншиж шалгана.
 */
export async function addToCart(formData: FormData): Promise<void> {
  const locale = localeFrom(formData)
  const id = variantId.safeParse(formData.get('variant_id'))
  const amount = qty.safeParse(formData.get('qty') ?? 1)

  if (!id.success || !amount.success || amount.data < 1) {
    redirect(`/${locale}/shop?error=VARIANT_UNAVAILABLE`)
  }

  const cart = await readCart()
  const existing = cart.find((item) => item.variantId === id.data)

  if (existing) {
    existing.qty = Math.min(20, existing.qty + amount.data)
  } else {
    cart.push({ variantId: id.data, qty: amount.data })
  }

  await writeCart(cart)
  revalidatePath('/', 'layout')
  redirect(`/${locale}/cart`)
}

export async function setCartQty(formData: FormData): Promise<void> {
  const locale = localeFrom(formData)
  const id = variantId.safeParse(formData.get('variant_id'))
  const amount = qty.safeParse(formData.get('qty'))

  if (id.success && amount.success) {
    const cart = await readCart()
    const next =
      amount.data === 0
        ? cart.filter((item) => item.variantId !== id.data)
        : cart.map((item) => (item.variantId === id.data ? { ...item, qty: amount.data } : item))

    await writeCart(next)
  }

  revalidatePath('/', 'layout')
  redirect(`/${locale}/cart`)
}

export async function removeFromCart(formData: FormData): Promise<void> {
  const locale = localeFrom(formData)
  const id = variantId.safeParse(formData.get('variant_id'))

  if (id.success) {
    const cart = await readCart()
    await writeCart(cart.filter((item) => item.variantId !== id.data))
  }

  revalidatePath('/', 'layout')
  redirect(`/${locale}/cart`)
}
