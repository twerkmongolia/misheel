import type {
  CreateInvoiceInput,
  CreateInvoiceResult,
  PaymentProvider,
  WebhookResult,
} from './types'
import { WebhookVerificationError } from './types'
import { verify } from './checksum'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/supabase/env'

/* ───────────────────────────────────────────────────────────────────────────
   BONUM GATEWAY

   Баримт бичиг: https://psp.bonum.mn/bonum-gateway-apis.html

   Хоёр дуудлага:
     1. GET  /bonum-gateway/ecommerce/auth/create   → accessToken (30 мин)
     2. POST /bonum-gateway/ecommerce/invoices      → invoiceId, followUpLink

   Гурав дахь нь Bonum-аас МАНАЙ зүг ирнэ: `x-checksum-v2` гарын үсэгтэй
   webhook. Түүнийг `checksum.ts` шалгана — mock provider аль хэдийн ижил
   дугтуй, ижил гарын үсэгтэй ажилладаг тул дуудагч кодын нэг ч мөр
   өөрчлөгдөхгүй (§ README.md).
   ─────────────────────────────────────────────────────────────────────── */

/**
 * Суурь хаяг.
 *
 * Анхдагч нь БОДИТ сервер: `PAYMENT_PROVIDER=bonum` гэж бичих нь өөрөө
 * «жинхэнэ төлбөр» гэсэн санаатай шийдвэр. Турших бол тодорхой зааж өгнө:
 * `PAYMENT_API_BASE=https://testapi.bonum.mn`.
 */
const API_BASE = (process.env.PAYMENT_API_BASE ?? 'https://apis.bonum.mn').replace(/\/+$/, '')

/** `Authorization: AppSecret …` — merchant данс нээхэд өгсөн урт түлхүүр. */
const APP_SECRET = process.env.PAYMENT_APP_SECRET ?? ''

/** `X-TERMINAL-ID` — терминалын дугаар. */
const TERMINAL_ID = process.env.PAYMENT_TERMINAL_ID ?? ''

/** Webhook-ийн гарын үсгийн түлхүүр — Bonum-д `MERCHANT_CHECKSUM_KEY`. */
const CHECKSUM_KEY = process.env.PAYMENT_CHECKSUM_KEY ?? ''

/** Сүлжээ унтрахгүй байхын тулд дуудлага бүрд хязгаар. */
const TIMEOUT_MS = 15_000

/**
 * Нэхэмжлэлийн насны анхдагч — 30 минут, секундээр.
 *
 * ⚠️ `expiresIn` нь Bonum-д ЗААВАЛ илгээх талбар. Баримт бичигт сонголт мэт
 * бичсэн ч бодит сервер нь түүнгүй биеийг огт задалж чаддаггүй:
 *   500 · «JSON parse error: Missing required creator property expiresIn»
 *
 * Урьд нь зөвхөн дуудагч нь тодорхой утга өгсөн үед илгээдэг байсан бөгөөд
 * `startPayment` хэзээ ч өгдөггүй — өөрөөр хэлбэл БҮХ нэхэмжлэл чимээгүй
 * унаж, хэрэглэгч төлбөрийн хуудас руу огт хүрдэггүй байв. Тиймээс энэ
 * утга нь одоо АНХДАГЧ, сонголт биш.
 *
 * 30 минут: хүн карт хайж, банкны апп нээж, нэг удаагийн код хүлээж
 * амжина. Үүнээс урт бол нөөц шаардлагагүй удаан барих эрсдэлтэй.
 */
const INVOICE_TTL_SECONDS = 1800

function required(name: string, value: string): string {
  if (!value) {
    throw new Error(
      `${name} тохируулаагүй байна. Bonum-тай ажиллахад ` +
        'PAYMENT_APP_SECRET, PAYMENT_TERMINAL_ID, PAYMENT_CHECKSUM_KEY гурвуулаа хэрэгтэй.',
    )
  }
  return value
}

/* ── Токен ─────────────────────────────────────────────────────────────────
   `accessToken` нь 1800 секунд (30 мин) амьдардаг. Нэхэмжлэл бүрд шинээр
   авбал хэрэглэгч бүрийн төлбөр ХОЁР сүлжээний дуудлага хүлээнэ.

   ⚠️ Бүр дор нь: Bonum нь шинэ токен гуйхыг ХЯЗГААРЛАДАГ —
       429 · ERROR_USE_EXISTING_TOKEN · «Use previous token»
   Өөрөөр хэлбэл токен бол «хүссэн үедээ авч болох» зүйл БИШ, нэг мөчид нэг
   л ширхэг байдаг НӨӨЦ. Тиймээс түүнийг хаана хадгалах нь тохь тухын биш
   зөв ажиллагааны асуудал.

   Хоёр давхар кэш:
     1. Процессын санах ой — хамгийн хурдан, ижил instance дээр дахин дуудахад.
     2. Өгөгдлийн сан — БҮХ instance хуваалцана (§ migration `payment_tokens`).

   Хоёр дахь нь Vercel дээр зайлшгүй: хүсэлт бүр өөр instance дээр буух
   боломжтой бөгөөд instance бүр өөрийн гэсэн хоосон санах ойтой босно.
   Зөвхөн санах ойн кэштэй үед тэд ээлжлэн токен гуйж, 429 идэж, нэхэмжлэл
   үүсгэж чадахгүй байв.

   Хугацаа дуусахаас 60 секундын өмнө хүчингүй болгоно: сүлжээний саатал
   дундуур токен хөгширвөл нэхэмжлэл шалтгаангүй унана. */
const EARLY_EXPIRY_MS = 60_000

let cached: { token: string; expiresAt: number } | null = null

/** Хуваалцсан кэш дэх мөр — хугацаа нь хүчинтэй бол л буцаана. */
async function tokenFromStore(): Promise<{ token: string; expiresAt: number } | null> {
  if (!isSupabaseConfigured()) return null

  const { data } = await createAdminClient()
    .from('payment_tokens')
    .select('access_token, expires_at')
    .eq('provider', 'bonum')
    .maybeSingle()

  if (!data) return null

  const expiresAt = new Date(data.expires_at).getTime() - EARLY_EXPIRY_MS
  return expiresAt > Date.now() ? { token: data.access_token, expiresAt } : null
}

async function saveToken(token: string, lifetimeSeconds: number): Promise<void> {
  if (!isSupabaseConfigured()) return

  await createAdminClient()
    .from('payment_tokens')
    .upsert({
      provider: 'bonum',
      access_token: token,
      expires_at: new Date(Date.now() + lifetimeSeconds * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
}

async function accessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now()) return cached.token

  const shared = await tokenFromStore()
  if (shared) {
    cached = shared
    return shared.token
  }

  const response = await fetch(`${API_BASE}/bonum-gateway/ecommerce/auth/create`, {
    method: 'GET',
    headers: {
      Authorization: `AppSecret ${required('PAYMENT_APP_SECRET', APP_SECRET)}`,
      'X-TERMINAL-ID': required('PAYMENT_TERMINAL_ID', TERMINAL_ID),
    },
    // Токен нь хэзээ ч кэшлэгдэх ёсгүй — Next-ийн fetch кэшийг хаана.
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!response.ok) {
    /* 429 = «чи аль хэдийн токентой». Энэ нь ихэвчлэн ӨӨР instance дөнгөж
       сая токен авсан гэсэн үг: тэр нь хуваалцсан кэш рүү бичих гэж явж
       байгаа. Нэг удаа дахин уншина — олдвол асуудал байхгүй. */
    if (response.status === 429) {
      const again = await tokenFromStore()
      if (again) {
        cached = again
        return again.token
      }
    }
    throw new Error(`Bonum auth амжилтгүй (${response.status}): ${await safeText(response)}`)
  }

  const data = (await response.json()) as { accessToken?: string; expiresIn?: number }
  if (!data.accessToken) {
    throw new Error('Bonum auth хариунд accessToken алга')
  }

  const lifetime = typeof data.expiresIn === 'number' ? data.expiresIn : 1800
  cached = { token: data.accessToken, expiresAt: Date.now() + lifetime * 1000 - EARLY_EXPIRY_MS }
  await saveToken(data.accessToken, lifetime)
  return cached.token
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 300)
  } catch {
    return '(бие уншигдсангүй)'
  }
}

export const bonumProvider: PaymentProvider = {
  name: 'bonum',

  async createInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResult> {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new Error(`Буруу дүн: ${input.amount}. Төгрөг бүхэл тоо байх ёстой.`)
    }

    /* ⚠️ `callback` нь WEBHOOK биш: Bonum-ийн баримтад «URL to redirect after
       payment» гэсэн буюу ХЭРЭГЛЭГЧИЙГ буцаах хаяг. Webhook хүлээн авах
       хаягийг нэхэмжлэл бүрд биш merchant тохиргоон дээр нэг удаа бүртгүүлнэ
       (§ README.md). Тиймээс `input.callbackUrl` энд ЗОРИУД хэрэглэгдэхгүй —
       харин тэр утга нь бидний хүлээж буй хаяг мөн эсэхийг Bonum-ийн
       тохиргоотой тулгаж шалгах ёстой. */
    const body = {
      amount: input.amount,
      callback: input.returnUrl,
      transactionId: input.paymentId,
      expiresIn: input.expiresIn ?? INVOICE_TTL_SECONDS,
      ...(input.items?.length
        ? {
            items: input.items.map((item) => ({
              title: item.name,
              amount: item.price,
              count: item.qty,
            })),
          }
        : {}),
    }

    const response = await fetch(`${API_BASE}/bonum-gateway/ecommerce/invoices`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await accessToken()}`,
        'Accept-Language': 'mn',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) {
      /* 401 нь токен хөгширсөн гэсэн үг байж болно — кэшээ хаяад дараагийн
         оролдлого шинээр авна. Энд автоматаар дахин оролдохгүй: төлбөрийн
         дуудлагыг чимээгүй давтах нь давхар нэхэмжлэл үүсгэх эрсдэлтэй. */
      if (response.status === 401) cached = null
      throw new Error(`Bonum нэхэмжлэл үүсгэсэнгүй (${response.status}): ${await safeText(response)}`)
    }

    const data = (await response.json()) as { invoiceId?: string; followUpLink?: string }
    if (!data.invoiceId || !data.followUpLink) {
      throw new Error('Bonum хариунд invoiceId эсвэл followUpLink алга')
    }

    return { providerRef: data.invoiceId, redirectUrl: data.followUpLink }
  },

  verifyWebhook(rawBody: string, headers: Headers): WebhookResult {
    if (!verify(rawBody, required('PAYMENT_CHECKSUM_KEY', CHECKSUM_KEY), headers.get('x-checksum-v2'))) {
      throw new WebhookVerificationError('x-checksum-v2 таарахгүй байна')
    }

    let payload: BonumWebhook
    try {
      payload = JSON.parse(rawBody) as BonumWebhook
    } catch {
      throw new WebhookVerificationError('Webhook-ийн body нь JSON биш байна')
    }

    const inner = payload.body
    if (!inner?.transactionId || !inner.invoiceId) {
      throw new WebhookVerificationError('Webhook-д transactionId эсвэл invoiceId алга')
    }

    /* Төлөв ХОЁР давхарт бичигдэнэ: дугтуй дээр SUCCESS/FAILED, дотор нь
       PAID/EXPIRED. Хоёулангаас нь шаардана — аль нэг нь л «болсон» гэж
       хэлж байвал тэр бол алдаа, төлбөр биш. */
    const paid = payload.status === 'SUCCESS' && inner.status === 'PAID'

    return {
      transactionId: inner.transactionId,
      providerRef: inner.invoiceId,
      status: paid ? 'paid' : 'failed',
      // Дүн нь мөрөөр ирж болзошгүй — тоо болгоно, `handle-result` тулгана.
      amount: Number(inner.amount),
      currency: inner.currency ?? 'MNT',
      completedAt: inner.completedAt ?? new Date().toISOString(),
      raw: payload,
    }
  },
}

type BonumWebhook = {
  type?: string
  status?: string
  message?: string
  body?: {
    invoiceId?: string
    transactionId?: string
    amount?: number | string
    currency?: string
    completedAt?: string
    terminalId?: string
    paymentVendor?: string
    status?: string
  }
}
