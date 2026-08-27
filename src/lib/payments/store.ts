import type { PaymentStatus } from './types'

/**
 * Mock provider-ийн түр санах ой.
 *
 * ⚠️ ЗӨВХӨН хөгжүүлэлтэд. Supabase холбогдмогц энэ файл устаж, нэхэмжлэлийн
 * төлөв `payments` хүснэгтэд хадгалагдана.
 *
 * `globalThis` дээр хадгалсан шалтгаан: `next dev` -ийн hot reload үед
 * модуль дахин ачаалагддаг тул энгийн `const map = new Map()` цэвэрлэгддэг.
 */
export interface MockInvoice {
  invoiceId: string
  paymentId: string
  amount: number
  currency: string
  description: string
  targetType: string
  targetId: string
  callbackUrl: string
  returnUrl: string
  status: PaymentStatus
  createdAt: string
  expiresAt: string
  completedAt?: string
}

const KEY = Symbol.for('twerk.mockInvoices')

type GlobalWithStore = typeof globalThis & {
  [KEY]?: Map<string, MockInvoice>
}

const g = globalThis as GlobalWithStore

export const mockInvoices: Map<string, MockInvoice> = (g[KEY] ??= new Map())

export function getInvoice(invoiceId: string): MockInvoice | undefined {
  const invoice = mockInvoices.get(invoiceId)
  if (!invoice) return undefined

  if (invoice.status === 'pending' && Date.parse(invoice.expiresAt) < Date.now()) {
    invoice.status = 'expired'
  }
  return invoice
}

/**
 * Боловсруулагдсан төлбөрүүд (`transactionId` -ээр).
 *
 * Supabase холбогдоход үүнийг `payments.transactionId` дээрх unique index
 * болон мөрийн `status` багана орлоно. Одоохондоо санах ойд байлгаж
 * idempotency-г нэхэмжлэлийн бичлэгээс ХАМААРАЛГҮЙ болгож байна —
 * webhook нь нэхэмжлэлээ мэдэхгүй сервер рүү ч ирж болно (deploy, олон instance).
 */
const PROCESSED_KEY = Symbol.for('twerk.processedPayments')

type GlobalWithProcessed = typeof globalThis & {
  [PROCESSED_KEY]?: Map<string, PaymentStatus>
}

export const processedPayments: Map<string, PaymentStatus> = ((
  globalThis as GlobalWithProcessed
)[PROCESSED_KEY] ??= new Map())
