import type { PaymentProvider } from './types'
import { mockProvider } from './mock'

export * from './types'

/**
 * Идэвхтэй provider-ыг сонгоно.
 *
 * Bonum merchant данс нээгдмэгц:
 *   1. `src/lib/payments/bonum.ts` -д `PaymentProvider` -ыг хэрэгжүүлнэ
 *      (createInvoice → POST /bonum-gateway/ecommerce/invoices,
 *       verifyWebhook → x-checksum-v2 шалгалт — `checksum.ts` -ийг дахин ашиглана)
 *   2. Доорх switch-д нэг мөр нэмнэ
 *   3. `.env` -д PAYMENT_PROVIDER=bonum болгоно
 *
 * Дуудагч кодын нэг ч мөр өөрчлөгдөхгүй.
 */
export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? 'mock'

  switch (name) {
    case 'mock':
      return mockProvider

    case 'bonum':
      throw new Error(
        'Bonum provider хараахан бичигдээгүй байна. ' +
          'PAYMENT_PROVIDER=mock болгох эсвэл src/lib/payments/bonum.ts -ыг нэмнэ үү.',
      )

    default:
      throw new Error(`Танигдаагүй PAYMENT_PROVIDER: ${name}`)
  }
}
