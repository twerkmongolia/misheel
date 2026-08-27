import type { WebhookResult } from './types'
import { mockInvoices, processedPayments } from './store'

/**
 * Төлбөрийн эцсийн үр дүнг боловсруулах цорын ганц цэг.
 *
 * Supabase холбогдмогц энэ функц дотор дараах зүйлс болно (транзакц дотор):
 *
 *   1. `payments` -оос `id = result.transactionId` -ыг FOR UPDATE -ээр авна.
 *   2. Хэрэв аль хэдийн `paid`/`failed` бол ЮУ Ч ХИЙХГҮЙ буцна  ← idempotency.
 *      (Bonum webhook-оо давтан илгээж болно.)
 *   3. `result.amount` нь тухайн захиалгын дүнтэй тохирч байгаа эсэхийг шалгана.
 *   4. Амжилттай бол:
 *        • target_type='order'   → orders.status = 'paid', нөөц хасах
 *                                  (stock_qty = stock_qty - qty WHERE stock_qty >= qty)
 *        • target_type='booking' → bookings.status = 'confirmed'
 *   5. `payments` мөрийг шинэчилж, түүхий payload-ыг `raw` баганад хадгална.
 *   6. Баталгаажуулах и-мэйл илгээнэ.
 *
 * Одоохондоо mock санах ойн төлвийг шинэчилж, консолд бичнэ.
 */
export async function handlePaymentResult(result: WebhookResult): Promise<void> {
  // 1. Idempotency — DB дээр `payments.transactionId` unique index энэ үүргийг гүйцэтгэнэ.
  const already = processedPayments.get(result.transactionId)
  if (already) {
    console.info(`[payments] ${result.transactionId}: аль хэдийн ${already}, алгасав`)
    return
  }

  const invoice = mockInvoices.get(result.providerRef)

  // 2. Дүнгийн шалгалт — provider-ээс ирсэн дүнд сохроор итгэхгүй.
  if (invoice && invoice.amount !== result.amount) {
    console.error(
      `[payments] ${result.transactionId}: дүн зөрж байна ` +
        `(хүлээсэн ${invoice.amount}, ирсэн ${result.amount})`,
    )
    return
  }

  // 3. Төлөв тэмдэглэх.
  processedPayments.set(result.transactionId, result.status)
  if (invoice) {
    invoice.status = result.status
    invoice.completedAt = result.completedAt
  }

  console.info(
    `[payments] ${result.transactionId} → ${result.status.toUpperCase()} ` +
      `(${result.amount}₮, invoice ${result.providerRef})`,
  )

  // TODO(Шат 5): Supabase транзакц — дээрх 1-6 алхам.
}
