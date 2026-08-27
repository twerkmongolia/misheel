'use server'

import { redirect } from 'next/navigation'
import { deliverMockWebhook } from '@/lib/payments/mock'
import { getInvoice } from '@/lib/payments/store'

/**
 * Bonum-ийн төлбөрийн хуудасны «Төлөх» товчийг дуурайна.
 * Бодит амьдрал дээр энэ алхмыг Bonum өөрөө хийж, webhook-оо илгээнэ.
 */
export async function completeMockPayment(formData: FormData): Promise<void> {
  const invoiceId = String(formData.get('invoiceId') ?? '')
  const outcome = formData.get('outcome') === 'SUCCESS' ? 'SUCCESS' : 'FAILED'
  const vendor = String(formData.get('vendor') ?? 'QPAY')

  const invoice = getInvoice(invoiceId)
  if (!invoice) throw new Error(`Нэхэмжлэл олдсонгүй: ${invoiceId}`)

  const delivery = await deliverMockWebhook(invoiceId, outcome, vendor)
  if (!delivery.ok) {
    throw new Error(`Webhook амжилтгүй (${delivery.status}): ${delivery.body}`)
  }

  const url = new URL(invoice.returnUrl)
  url.searchParams.set('payment', invoice.paymentId)
  url.searchParams.set('status', outcome === 'SUCCESS' ? 'paid' : 'failed')

  redirect(url.toString())
}
