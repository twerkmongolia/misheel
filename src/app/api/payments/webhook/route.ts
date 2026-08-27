import { getPaymentProvider, WebhookVerificationError } from '@/lib/payments'
import { handlePaymentResult } from '@/lib/payments/handle-result'

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

  // Provider-т 200 буцаана — эс бөгөөс дахин дахин илгээнэ.
  return Response.json({ ok: true })
}
