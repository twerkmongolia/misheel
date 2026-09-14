import 'server-only'

import type { WebhookResult } from './types'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { getPaymentProvider } from './index'
import { mockInvoices, processedPayments } from './store'

/**
 * Төлбөрийн эцсийн үр дүнг боловсруулах ЦОРЫН ГАНЦ цэг.
 *
 * ── Ажил нь бүхэлдээ өгөгдлийн санд ──────────────────────────────────────
 * Идэмпотент байдал, дүн тулгалт, захиалгын төлөв гурав нь НЭГ транзакц
 * дотор, НЭГ түгжээний дор болох ёстой (§ migration `settle_payment`).
 * Энд TypeScript дээр тус тусад нь хийвэл хоёр webhook зэрэг ирэхэд
 * хоёулаа «pending» гэж уншаад хоёулаа төлөгдсөн гэж бичнэ.
 *
 * Тиймээс энэ функцийн үүрэг ганцхан: дуудаад, үр дүнг нь ЛОГЛОХ.
 *
 * ── Яагаад service-role вэ ───────────────────────────────────────────────
 * Webhook нь нэвтрээгүй хүсэлт — `auth.uid()` хоосон тул RLS нь ямар ч
 * мөрийг харуулахгүй. Гарын үсэг нь аль хэдийн шалгагдсан (§ webhook route)
 * тул энд RLS-ийг тойрох нь зөв: итгэлийн хил нь гарын үсэг дээр байна.
 */
export async function handlePaymentResult(result: WebhookResult): Promise<void> {
  /* Supabase тохируулаагүй үед (шинэ машин, `PAYMENT_PROVIDER=mock`) санах
     ойн mock төлөв дээр ажиллана — хөгжүүлэгч бүтэн урсгалыг өгөгдлийн
     сангүйгээр харна. */
  if (!isSupabaseConfigured()) {
    handleInMemory(result)
    return
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('settle_payment', {
    p_payment_id: result.transactionId,
    // Тогтмол 'bonum' БИШ: mock-оор ажиллаж байхад тэр нэр худал болно.
    p_provider: getPaymentProvider().name,
    p_provider_ref: result.providerRef,
    p_amount: result.amount,
    p_paid: result.status === 'paid',
    p_raw: result.raw as never,
  })

  if (error) {
    /* ХАЯХГҮЙ — дээрх route нь алдааг 500 болгож буцаана. Bonum 200-аас
       өөр хариу авбал webhook-оо ДАХИН илгээнэ, тэр нь яг зөв: түр зуурын
       асуудал (сүлжээ, DB тасарсан) дараагийн оролдлогод засрах ёстой. */
    console.error(`[payments] ${result.transactionId}: settle_payment амжилтгүй — ${error.message}`)
    throw new Error(`settle_payment: ${error.message}`)
  }

  const outcome = String(data)

  /* `amount_mismatch` ба `not_found` нь ДАХИН оролдоод засрахгүй — хүн
     шалгах ёстой. Тиймээс алдаа шидэхгүй (Bonum-д 200 буцаана), гэхдээ
     логт ТОД үлдээнэ. */
  if (outcome === 'amount_mismatch') {
    console.error(
      `[payments] ${result.transactionId}: ДҮН ЗӨРЖ БАЙНА — provider ${result.amount}₮ ` +
        `гэж мэдэгдсэн ч манай мөрийн дүн өөр. Гараар шалгана уу.`,
    )
    return
  }

  if (outcome === 'not_found') {
    console.error(`[payments] ${result.transactionId}: ийм төлбөрийн мөр алга`)
    return
  }

  console.info(
    `[payments] ${result.transactionId} → ${outcome.toUpperCase()} ` +
      `(${result.amount}₮, invoice ${result.providerRef})`,
  )
}

/** Өгөгдлийн сангүй орчны хувилбар — зөвхөн хөгжүүлэлтэд (§ store.ts). */
function handleInMemory(result: WebhookResult): void {
  const already = processedPayments.get(result.transactionId)
  if (already) {
    console.info(`[payments] ${result.transactionId}: аль хэдийн ${already}, алгасав`)
    return
  }

  const invoice = mockInvoices.get(result.providerRef)

  if (invoice && invoice.amount !== result.amount) {
    console.error(
      `[payments] ${result.transactionId}: дүн зөрж байна ` +
        `(хүлээсэн ${invoice.amount}, ирсэн ${result.amount})`,
    )
    return
  }

  processedPayments.set(result.transactionId, result.status)
  if (invoice) {
    invoice.status = result.status
    invoice.completedAt = result.completedAt
  }

  console.info(
    `[payments] ${result.transactionId} → ${result.status.toUpperCase()} ` +
      `(${result.amount}₮, invoice ${result.providerRef}) · санах ойд`,
  )
}
