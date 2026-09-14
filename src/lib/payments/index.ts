import type { PaymentProvider } from './types'
import { mockProvider } from './mock'
import { bonumProvider } from './bonum'

export * from './types'

/**
 * Идэвхтэй provider-ыг сонгоно.
 *
 * `mock` нь анхдагч — тохиргоогүй орчинд (шинэ хөгжүүлэгчийн машин, CI)
 * төлбөр нь жинхэнэ мөнгө хөдөлгөхгүйгээр эхнээс нь дуустал ажиллана.
 * Жинхэнэ төлбөр рүү шилжих нь ЗОРИУДЫН нэг мөр: `PAYMENT_PROVIDER=bonum`.
 */
export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? 'mock'

  switch (name) {
    case 'mock':
      return mockProvider

    case 'bonum':
      return bonumProvider

    default:
      throw new Error(`Танигдаагүй PAYMENT_PROVIDER: ${name}`)
  }
}
