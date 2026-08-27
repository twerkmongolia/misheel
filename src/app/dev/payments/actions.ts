'use server'

import { redirect } from 'next/navigation'
import { getPaymentProvider } from '@/lib/payments'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * Жинхэнэ checkout-ын оронд туршилтад ашиглах нэхэмжлэл үүсгэгч.
 *
 * Шат 4/5-д энэ логик `src/actions/bookings.ts` болон `src/actions/orders.ts`
 * руу нүүнэ. Гол ялгаа нь ганцхан: `amount` -ыг формоос биш, DB-ээс
 * (сагсны нийлбэр эсвэл class_sessions.price) тооцоолж авна.
 */
export async function startMockPayment(formData: FormData): Promise<void> {
  const amount = Number(formData.get('amount'))
  const targetType = formData.get('targetType') === 'booking' ? 'booking' : 'order'

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Дүн нь 0-ээс их бүхэл тоо байх ёстой')
  }

  // Бодит системд эдгээр нь DB дэх мөрүүдийн id байна.
  const paymentId = crypto.randomUUID()
  const targetId = crypto.randomUUID()

  const invoice = await getPaymentProvider().createInvoice({
    amount,
    currency: 'MNT',
    targetType,
    targetId,
    paymentId,
    description:
      targetType === 'booking' ? 'Хичээлийн бүртгэл (тест)' : 'Дэлгүүрийн захиалга (тест)',
    callbackUrl: `${SITE_URL}/api/payments/webhook`,
    returnUrl: `${SITE_URL}/dev/payments`,
  })

  redirect(invoice.redirectUrl)
}
