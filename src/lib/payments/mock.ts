import type {
  CreateInvoiceInput,
  CreateInvoiceResult,
  PaymentProvider,
  WebhookResult,
} from './types'
import { WebhookVerificationError } from './types'
import { sign, verify } from './checksum'
import { getInvoice, mockInvoices } from './store'

/**
 * Bonum Gateway-ийн зан төлөвийг дуурайсан хуурамч provider.
 *
 * Бодит Bonum-тай ижил байлгасан зүйлс:
 *   • webhook-ийн дугтуй  { type, status, message, body: {...} }
 *   • `x-checksum-v2` header дэх HMAC-SHA256 гарын үсэг
 *   • манай `paymentId` → тэдний `transactionId`
 *   • хэрэглэгчийг гадаад хуудас руу шилжүүлдэг `followUpLink` загвар
 *
 * Ялгаа нь зөвхөн нэг зүйл: followUpLink нь Bonum-ийн хуудас руу биш,
 * манай `/mock-pay/[invoiceId]` хуудас руу заана.
 */

const CHECKSUM_KEY = process.env.PAYMENT_CHECKSUM_KEY ?? 'twerk-dev-checksum-key'
const TERMINAL_ID = process.env.PAYMENT_TERMINAL_ID ?? 'MOCK_TERMINAL'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

export const mockProvider: PaymentProvider = {
  name: 'mock',

  async createInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResult> {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new Error(`Буруу дүн: ${input.amount}. Төгрөг бүхэл тоо байх ёстой.`)
    }

    const invoiceId = randomId('mockinv')
    const expiresIn = input.expiresIn ?? 15 * 60

    mockInvoices.set(invoiceId, {
      invoiceId,
      paymentId: input.paymentId,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      targetType: input.targetType,
      targetId: input.targetId,
      callbackUrl: input.callbackUrl,
      returnUrl: input.returnUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    })

    return {
      providerRef: invoiceId,
      redirectUrl: `${SITE_URL}/mock-pay/${invoiceId}`,
      qr: `MOCKQR|${invoiceId}|${input.amount}`,
      deeplinks: [
        { name: 'Khan bank', link: `khanbank://q?qPay_QRcode=MOCKQR-${invoiceId}` },
        { name: 'Golomt bank', link: `golomtbank://q?qPay_QRcode=MOCKQR-${invoiceId}` },
        { name: 'State bank', link: `statebank://q?qPay_QRcode=MOCKQR-${invoiceId}` },
      ],
    }
  },

  verifyWebhook(rawBody: string, headers: Headers): WebhookResult {
    if (!verify(rawBody, CHECKSUM_KEY, headers.get('x-checksum-v2'))) {
      throw new WebhookVerificationError('x-checksum-v2 таарахгүй байна')
    }

    let payload: MockWebhookPayload
    try {
      payload = JSON.parse(rawBody) as MockWebhookPayload
    } catch {
      throw new WebhookVerificationError('Webhook-ийн body нь JSON биш байна')
    }

    if (payload.type !== 'PAYMENT') {
      throw new WebhookVerificationError(`Дэмжигдээгүй webhook төрөл: ${payload.type}`)
    }

    return {
      transactionId: payload.body.transactionId,
      providerRef: payload.body.invoiceId,
      status: payload.status === 'SUCCESS' ? 'paid' : 'failed',
      amount: payload.body.amount,
      currency: payload.body.currency,
      completedAt: payload.body.completedAt,
      raw: payload,
    }
  },
}

interface MockWebhookPayload {
  type: string
  status: 'SUCCESS' | 'FAILED'
  message: string
  body: {
    amount: number
    currency: string
    completedAt: string
    terminalId: string
    invoiceId: string
    paymentVendor: string
    initType: string
    status: string
    respCode: string
    transactionId: string
  }
}

/**
 * Bonum-ийн серверийг дуурайж, манай webhook руу гарын үсэгтэй POST илгээнэ.
 * Бодит амьдрал дээр үүнийг Bonum хийнэ — энд `/mock-pay` хуудасны товч дуудна.
 */
export async function deliverMockWebhook(
  invoiceId: string,
  outcome: 'SUCCESS' | 'FAILED',
  vendor = 'QPAY',
): Promise<{ ok: boolean; status: number; body: string }> {
  const invoice = getInvoice(invoiceId)
  if (!invoice) throw new Error(`Нэхэмжлэл олдсонгүй: ${invoiceId}`)

  const completedAt = new Date().toISOString()

  const payload: MockWebhookPayload = {
    type: 'PAYMENT',
    status: outcome,
    message: '',
    body: {
      amount: invoice.amount,
      currency: invoice.currency,
      completedAt,
      terminalId: TERMINAL_ID,
      invoiceId: invoice.invoiceId,
      paymentVendor: vendor,
      initType: 'WEB',
      status: outcome === 'SUCCESS' ? 'PAID' : 'DECLINED',
      respCode: outcome === 'SUCCESS' ? '000' : '116',
      transactionId: invoice.paymentId,
    },
  }

  // Bonum-тай яг адилхан: indentation-гүй JSON, түүн дээрээ гарын үсэг.
  const rawBody = JSON.stringify(payload)

  const res = await fetch(invoice.callbackUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-checksum-v2': sign(rawBody, CHECKSUM_KEY),
    },
    body: rawBody,
  })

  invoice.status = outcome === 'SUCCESS' ? 'paid' : 'failed'
  invoice.completedAt = completedAt

  return { ok: res.ok, status: res.status, body: await res.text() }
}
