'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/dal'
import { getVariantsWithProduct } from '@/lib/data'
import { readBuyIntent } from '@/lib/buy'
import { getPaymentProvider } from '@/lib/payments'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'

const orderErrorCodes = [
  'CART_EMPTY',
  'INVALID_QTY',
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
 * Захиалга үүсгэх — САГСГҮЙ.
 *
 * ── Яагаад сагс байхгүй вэ ────────────────────────────────────────────────
 * Студийн дэлгүүр нь хэдхэн төрлийн бараатай (цамц, лосон) бөгөөд хүн
 * нэгийг нь л авдаг. Сагс нь тэр урсгалд гурван нэмэлт алхам (нэмэх →
 * сагс харах → баталгаажуулах) хийж, cookie дотор хуучирсан мөр хадгалж,
 * «Сонгосон бараа боломжгүй болсон» гэсэн ойлгомжгүй хана босгож байв.
 *
 * Одоо: бараан дээрээс «Худалдаж авах» → хүргэлтийн мэдээлэл → Bonum.
 *
 * Дүн, нөөц, хүргэлтийн хураамжийг энд ТООЦООЛОХГҮЙ — бүгд `place_order`
 * функц дотор, нэг транзакцаар, мөрийг түгжсэн байдалтай хийгдэнэ. Формоос
 * ирсэн `variant`, `qty` хоёр нь зөвхөн «юу авах гэж байна» гэсэн санал.
 */
export async function placeOrder(formData: FormData): Promise<void> {
  const locale = localeFrom(formData)
  const intent = readBuyIntent({
    variant: String(formData.get('variant') ?? ''),
    qty: String(formData.get('qty') ?? '1'),
  })

  if (!intent) {
    redirect(`/${locale}/shop?error=VARIANT_UNAVAILABLE`)
  }

  const checkout = `/${locale}/checkout?variant=${intent.variantId}&qty=${intent.qty}`

  const user = await getUser()
  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(checkout)}`)
  }

  /* Бараа хараахан идэвхтэй эсэхийг ЭНД шалгана. `place_order` ч бас
     шалгадаг ч түүний алдаа нь ерөнхий: хүн аль бараа нь болохгүй байгааг
     мэдэхгүй. Энд шалгаснаар дэлгүүр рүү тодорхой мессежтэй буцаана. */
  const [row] = await getVariantsWithProduct([intent.variantId])
  if (!row || !row.variant.is_active || !row.product.is_active) {
    redirect(`/${locale}/shop?error=VARIANT_UNAVAILABLE`)
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
    redirect(`${checkout}&error=SHIPPING_REQUIRED`)
  }

  const supabase = await createClient()
  const { data: orderNo, error } = await supabase.rpc('place_order', {
    p_items: [{ variant_id: intent.variantId, qty: intent.qty }],
    p_name: parsed.data.name,
    p_phone: parsed.data.phone,
    p_district: parsed.data.district,
    p_khoroo: parsed.data.khoroo,
    p_address: parsed.data.address,
    p_note: parsed.data.note || null,
  })

  if (error || !orderNo) {
    redirect(`${checkout}&error=${toErrorCode(error?.message)}`)
  }

  revalidatePath('/', 'layout')

  /* ── Төлбөрийн нэхэмжлэл ──────────────────────────────────────────────
     `place_order` нь захиалга, мөрүүд, нөөцийн хасалт, `payments` мөрийг
     аль хэдийн үүсгэсэн (§ migration `place_order`). Үлдсэн ажил нь тэр
     төлбөрийг gateway дээр нэхэмжлэл болгох.

     Нэхэмжлэл үүсгэж ЧАДААГҮЙ ч захиалга ҮЛДЭНЭ: нөөц нь аль хэдийн
     хасагдсан, хэрэглэгчийн хаяг бичигдсэн. Тиймээс алдааг захиалгын
     хуудсан дээр хэлээд, «Дахин төлөх» боломжийг үлдээнэ — захиалгыг
     нь чимээгүй устгах нь хамаагүй муу. */
  const payment = await startPayment(supabase, orderNo, locale)

  redirect(payment ?? `/${locale}/order/${orderNo}`)
}

/**
 * Захиалгын хүлээгдэж буй төлбөрийг gateway руу гаргана.
 *
 * Буцаах утга нь хэрэглэгчийг ЯВУУЛАХ хаяг (Bonum-ийн `followUpLink`), эсвэл
 * `null` — тэр үед захиалгын хуудас руу орж, «Төлөх» товчоор дахин оролдоно.
 *
 * ⚠️ Дүнг ЗАХИАЛГААС уншина, формоос БИШ: хэрэглэгчийн илгээсэн тоо ширхэг
 * нь ердөө санал бөгөөд `place_order` түүнийг дахин тооцоолсон. `payments.amount`
 * нь серверийн цорын ганц үнэн.
 */
export async function startPayment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderNo: string,
  locale: Locale,
): Promise<string | null> {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ?? ''

  const { data: order } = await supabase
    .from('orders')
    .select('id, total, order_no')
    .eq('order_no', orderNo)
    .maybeSingle()

  if (!order) return null

  const { data: payment } = await supabase
    .from('payments')
    .select('id, amount')
    .eq('target_type', 'order')
    .eq('target_id', order.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (!payment) return null

  try {
    const invoice = await getPaymentProvider().createInvoice({
      amount: payment.amount,
      currency: 'MNT',
      targetType: 'order',
      targetId: order.id,
      paymentId: payment.id,
      description: `Twerk Mongolia · ${order.order_no}`,
      // Webhook-ийн хаяг нэхэмжлэлд ОРДОГГҮЙ — merchant тохиргоонд
      // бүртгэгдсэн байдаг (§ lib/payments/README.md).
      callbackUrl: `${site}/api/payments/webhook`,
      returnUrl: `${site}/${locale}/order/${order.order_no}`,
    })

    /* Provider талын дугаарыг хадгална: webhook давхардсан, эсвэл гараар
       тулгах шаардлага гарвал хоёр талыг холбох цорын ганц утга. */
    await supabase
      .from('payments')
      .update({ provider: getPaymentProvider().name, provider_ref: invoice.providerRef })
      .eq('id', payment.id)

    return invoice.redirectUrl
  } catch (cause) {
    console.error(`[payments] ${order.order_no}: нэхэмжлэл үүсгэсэнгүй —`, cause)
    return null
  }
}

/**
 * Хүлээгдэж буй захиалгыг ДАХИН төлөх.
 *
 * Нэхэмжлэл нь хугацаатай (Bonum-д анхдагчаар хэдэн минут) бөгөөд хүн
 * төлбөрийн хуудсыг хааж, дараа нь эргэж ирж болно. Тиймээс хуучин
 * нэхэмжлэлийг сэргээхийг оролдохгүй — ШИНЭ нэхэмжлэл үүсгэнэ. Захиалгын
 * `payments` мөр нь ижил хэвээр тул `transactionId` өөрчлөгдөхгүй: хоцорсон
 * webhook ирсэн ч зөв мөр рүү таарна.
 */
export async function payOrder(formData: FormData): Promise<void> {
  const locale = localeFrom(formData)
  const orderNo = String(formData.get('order_no') ?? '')
  const orderPage = `/${locale}/order/${orderNo}`

  const user = await getUser()
  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(orderPage)}`)
  }

  /* Хэрэглэгчийн client — RLS нь өөрийнх нь захиалгыг л харуулна
     (§ migration `orders_read`). Энд service-role хэрэглэх ямар ч
     шалтгаангүй. */
  const supabase = await createClient()
  const link = await startPayment(supabase, orderNo, locale)

  redirect(link ?? `${orderPage}?error=PAY_FAILED`)
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
