/**
 * Төлбөрийн provider-ийн нэгдсэн интерфейс.
 *
 * Талбаруудын нэрийг Bonum Gateway-ийн API-тай зориудаар нийцүүлсэн
 * (https://psp.bonum.mn/bonum-gateway-apis.html) — ингэснээр mock-оос
 * бодит холболт руу шилжихэд энэ файл огт өөрчлөгдөхгүй.
 */

export type PaymentTargetType = 'order' | 'booking'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired'

export interface CreateInvoiceInput {
  /** Дүн — ЗӨВХӨН серверт тооцоолсон утга. Client-ээс ирсэн дүнг хэзээ ч дамжуулахгүй. */
  amount: number
  currency: 'MNT'
  targetType: PaymentTargetType
  /** Захиалга эсвэл хичээлийн бүртгэлийн id */
  targetId: string
  /** Манай `payments.id`. Bonum руу `transactionId` нэрээр очно — idempotency түлхүүр. */
  paymentId: string
  description: string
  /** Provider webhook илгээх URL (нийтэд нээлттэй байх ёстой) */
  callbackUrl: string
  /** Төлбөр дуусмагц хэрэглэгчийг буцаах URL */
  returnUrl: string
  /** Нэхэмжлэлийн хүчинтэй хугацаа, секундээр */
  expiresIn?: number
  items?: { name: string; price: number; qty: number }[]
}

export interface CreateInvoiceResult {
  /** Provider талын id — Bonum-д `invoiceId` */
  providerRef: string
  /** Хэрэглэгчийг шилжүүлэх хаяг — Bonum-д `followUpLink` */
  redirectUrl: string
  /** QPay QR (заавал биш) */
  qr?: string
  deeplinks?: { name: string; link: string }[]
}

export interface WebhookResult {
  /** Манай `payments.id` */
  transactionId: string
  /** Provider талын id */
  providerRef: string
  status: 'paid' | 'failed'
  amount: number
  currency: string
  completedAt: string
  /** Аудитад хадгалах түүхий payload */
  raw: unknown
}

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebhookVerificationError'
  }
}

export interface PaymentProvider {
  readonly name: string

  createInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResult>

  /**
   * Webhook-ийн гарын үсгийг шалгаад хэвийн хэлбэрт хөрвүүлнэ.
   *
   * ⚠️ `rawBody` нь ЗААВАЛ `await req.text()` -ээс ирсэн түүхий текст байна.
   * HMAC нь түүхий байт дээр тооцогддог тул `JSON.stringify(await req.json())`
   * хийвэл гарын үсэг таарахгүй.
   */
  verifyWebhook(rawBody: string, headers: Headers): WebhookResult
}
