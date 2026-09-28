import { NextResponse } from 'next/server'
import { getPaymentProvider, WebhookVerificationError } from '@/lib/payments'
import { handlePaymentResult } from '@/lib/payments/handle-result'
import { defaultLocale, isLocale } from '@/lib/i18n/config'

/**
 * Төлбөрийн provider-ийн webhook.
 *
 * Энэ route нь нээлттэй — нэвтрэлт шалгахгүй. Аюулгүй байдал нь бүхэлдээ
 * `x-checksum-v2` гарын үсэг дээр тогтоно. `proxy.ts` нэмэгдэхэд matcher-аас
 * `/api/` -г хасахаа мартаж болохгүй.
 */
export async function POST(req: Request): Promise<Response> {
  // ⚠️ req.json() ХЭРЭГЛЭХГҮЙ — HMAC нь түүхий текст дээр тооцогддог.
  const rawBody = await req.text()

  let result
  try {
    result = getPaymentProvider().verifyWebhook(rawBody, req.headers)
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      console.warn(`[webhook] шалгалт амжилтгүй: ${error.message}`)
      return Response.json({ ok: false, error: error.message }, { status: 401 })
    }
    throw error
  }

  await handlePaymentResult(result)

  /* Provider-т 200 буцаана.
     ⚠️ Bonum мэдэгдлээ ГАНЦ удаа илгээдэг (§ bonum.ts `verifyWebhook`) тул
     200-аас өөр хариу нь дахин оролдлого биш, АЛДАГДСАН төлбөр гэсэн үг. */
  return Response.json({ ok: true })
}

/**
 * Хөтчийг захиалгын хуудас руу буцаана.
 *
 * Bonum руу нэхэмжлэлийн `callback` талбараар ЭНЭ хаяг явдаг. Тэр талбар
 * webhook-ийг хүлээж авдаг нь батлагдсан ч Bonum хэрэглэгчийг ч мөн энэ хаяг
 * руу буцааж магадгүй — баримт бичиг нь түүнийг «URL to redirect after
 * payment» гэж нэрлэсэн. Тэгвэл төлбөрөө хийсэн хүн `{"ok":true}` гэсэн JSON
 * хараад үлдэх байлаа. Тиймээс GET нь захиалгаа олоод буцаана.
 *
 * Open redirect байхгүй: хаягийг энд өөрсдөө угсарна — гаднаас ирэх зөвхөн
 * захиалгын дугаар ба хэл, хоёулаа шалгагдана.
 */
export async function GET(req: Request): Promise<Response> {
  const { searchParams, origin } = new URL(req.url)

  const rawLocale = searchParams.get('locale') ?? ''
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale

  /* Дугаар нь `ORD-2026-0001` хэлбэртэй. Бусад бүхнийг хаяна: буруу утга
     ирвэл нүүр хуудас нь 404-өөс дээр. */
  const orderNo = searchParams.get('order') ?? ''
  const safe = /^[A-Za-z0-9-]{1,32}$/.test(orderNo) ? orderNo : null

  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || origin

  return NextResponse.redirect(
    safe ? `${site}/${locale}/order/${safe}` : `${site}/${locale}`,
    // 303 — POST-ын дараа ирсэн ч хөтөч GET-ээр дагана.
    303,
  )
}
