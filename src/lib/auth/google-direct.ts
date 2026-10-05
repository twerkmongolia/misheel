import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'

/**
 * Google-ээр нэвтрэх — МАНАЙ домэйн дээр буцаадаг урсгал.
 *
 * ── Яагаад ─────────────────────────────────────────────────────────────────
 * Supabase-ийн чиглүүлэлтээр (`signInWithOAuth`) Google-ийн хаяг сонгох
 * цонх «to continue to tqbtdvexzyocitacilao.supabase.co» гэдэг байв: Google
 * нь нэвтрэлт БУЦАХ домэйныг нэрлэдэг, тэр нь Supabase-ийнх. Supabase үүнийг
 * зөвхөн төлбөртэй custom domain-оор солино. Танихгүй домэйн нэрлэсэн цонх
 * нь яг фишинг шиг харагддаг (2026-10-05, эзэн солихыг хүсэв).
 *
 * Тиймээс чиглүүлэлтийн ХАГАСЫГ энд хийнэ: Google нь
 * `/auth/google/callback` руу буцаж, цонх нь «twerkmongolia.com» гэж
 * нэрлэнэ. Кодыг сервер-серверээр ID токен болгож солиод Supabase-д
 * `signInWithIdToken`-оор өгнө — Supabase өөрөө гарын үсэг, audience,
 * nonce-ийг ШАЛГАСААР байна. Энэ файл хэн болохыг шийддэггүй, Google-ийн
 * хариуг шийддэг газарт нь хүргэдэг л.
 *
 * ── Хэрэгтэй тохиргоо ─────────────────────────────────────────────────────
 * `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Supabase-ийн Google provider-т
 * байгаа ЯГ ТЭР OAuth client) + Google Cloud Console дээр тэр client-ийн
 * «Authorised redirect URIs»-д:
 *     https://www.twerkmongolia.com/auth/google/callback
 *     http://localhost:3000/auth/google/callback
 *     http://localhost:3002/auth/google/callback
 * Хаягийг ТҮЛХҮҮРЭЭС ӨМНӨ нэм: түлхүүртэй ч хаяггүй бол Google
 * `redirect_uri_mismatch` гэж хэнийг ч оруулахгүй.
 *
 * Түлхүүргүй, эсвэл Google зөвшөөрөхгүй домэйн дээр (Vercel preview)
 * `googleDirect()` үгүй гэж хариулж, хуучин Supabase-ийн чиглүүлэлт
 * өөрчлөлтгүй ажиллана.
 *
 * `GOOGLE_CLIENT_SECRET` -ийг ЗӨВХӨН энэ файл уншина, файл нь `server-only`.
 */

const AUTHORIZE = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN = 'https://oauth2.googleapis.com/token'

export const GOOGLE_CALLBACK_PATH = '/auth/google/callback'
/** Аяллын төлөв. HttpOnly, 10 минут, зөвхөн буцах цэг рүү илгээгдэнэ. */
export const GOOGLE_COOKIE = 'tm-google'
export const GOOGLE_COOKIE_MAX_AGE = 600

const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? ''
const configuredSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? ''

/*
 * 64 тэмдэгтийн hex бол Google-ийн нууц ХЭЗЭЭ Ч биш — Supabase-ийн
 * Management API нууцын оронд буцаадаг SHA-256 юм. Түүнийг тавибал нэвтрэлт
 * бүр солилцоон дээрээ `invalid_client` болж унана. Тиймээс тохируулаагүй
 * гэж үзэж, хуучин урсгал ажилласаар, логт аль утга буруу болохыг хэлнэ.
 * Жинхэнэ нууц `GOCSPX-`-ээр эхэлдэг, зөвхөн Google Cloud Console-оос.
 */
const looksHashed = /^[0-9a-f]{64}$/.test(configuredSecret)
if (looksHashed) {
  console.warn(
    '[auth] GOOGLE_CLIENT_SECRET нь SHA-256 hash, нууц биш — үл тоомсорлов. ' +
      'Google Cloud Console-оос жинхэнэ (GOCSPX-…) нууцыг хуулна уу.',
  )
}
const clientSecret = looksHashed ? '' : configuredSecret

// Хагас тохиргоо чимээгүй хуучин урсгал руу унах тул «юу ч өөрчлөгдсөнгүй»
// мэт харагдана. Эхлэх үед нэг удаа хэлнэ.
if (!looksHashed && Boolean(clientId) !== Boolean(clientSecret)) {
  console.warn('[auth] GOOGLE_CLIENT_ID ба GOOGLE_CLIENT_SECRET хоёулаа хамт тохируулагдах ёстой')
}

/**
 * Энэ домэйн шууд урсгал ашиглаж болох уу.
 *
 * Хоёр түлхүүр байх ЁСТОЙ, домэйн нь Google-ийн жагсаалтад байх ЁСТОЙ:
 * жинхэнэ сайт эсвэл хөгжүүлэлтийн localhost. Vercel preview өөрийн хаягтай
 * бөгөөд тэр нь client-ийн жагсаалтад алга — Google-ийн
 * `redirect_uri_mismatch` хуудсанд гацахын оронд Supabase-ийн урсгал руу.
 */
export function googleDirect(origin: string): boolean {
  if (!clientId || !clientSecret) return false
  const production = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '')
  if (production && origin === production) return true
  // Production-д хэн ч `localhost` толгой илгээдэггүй — илгээвэл хүн биш.
  return process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin)
}

/** Google руу явж буцах хооронд хадгалагдах зүйл. */
export type GooglePending = {
  state: string
  /** Түүхий nonce. Google нь түүний SHA-256-г авна; Supabase энийг авч харьцуулна. */
  nonce: string
  /** PKCE: солилцоог эхлүүлсэн тал нь мөн гэдгийг баталгаажуулна. */
  verifier: string
  /** Солилцоонд ЯГ ижлээр дахин илгээх ёстой (Google шаарддаг). */
  redirectUri: string
  locale: Locale
  next: string
}

const token = (bytes: number) => randomBytes(bytes).toString('base64url')
const sha256 = (value: string) => createHash('sha256').update(value).digest()

/** Хөтчийг илгээх хаяг, мөн явахаас өмнө тавих cookie. */
export function startGoogle(
  origin: string,
  locale: Locale,
  next: string,
): { url: string; cookie: string } {
  const pending: GooglePending = {
    state: token(24),
    nonce: token(24),
    verifier: token(48),
    redirectUri: `${origin}${GOOGLE_CALLBACK_PATH}`,
    locale,
    next,
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: pending.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: pending.state,
    // Hex — Supabase түүхий nonce-ийг яг ийм хэлбэрт хувиргаж харьцуулдаг.
    nonce: sha256(pending.nonce).toString('hex'),
    code_challenge: sha256(pending.verifier).toString('base64url'),
    code_challenge_method: 'S256',
    // Хуучин урсгалтай ижил: Google ҮРГЭЛЖ хаяг сонгуулна (§ auth/google/route.ts).
    prompt: 'select_account',
  })

  return {
    url: `${AUTHORIZE}?${params}`,
    cookie: Buffer.from(JSON.stringify(pending)).toString('base64url'),
  }
}

/** Cookie-г буцааж уншина — бидний бичээгүй юу ч байвал null. */
export function readGooglePending(cookie: string | undefined): GooglePending | null {
  if (!cookie) return null
  try {
    const value = JSON.parse(Buffer.from(cookie, 'base64url').toString('utf8')) as GooglePending
    const parts = [value.state, value.nonce, value.verifier, value.redirectUri]
    if (!parts.every((part) => typeof part === 'string' && part.length > 0)) return null
    return {
      ...value,
      locale: isLocale(value.locale) ? value.locale : defaultLocale,
      next: typeof value.next === 'string' ? value.next : '',
    }
  } catch {
    return null
  }
}

/**
 * Google-ийн нэг удаагийн кодыг ID токеноор солино.
 *
 * Сервер-сервер, нууц ба PKCE verifier-тай — хөтөч аль алиныг нь хэзээ ч
 * харахгүй. Ямар ч татгалзалд null: дуудагч хүнийг нэвтрэх хуудас руу
 * буцаана.
 */
export async function exchangeGoogleCode(code: string, pending: GooglePending): Promise<string | null> {
  const response = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: pending.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: pending.verifier,
    }),
    cache: 'no-store',
    // Гацсан токены сервер хүнийг хоосон хуудсанд гацаахгүй.
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null)

  if (!response) return null
  if (!response.ok) {
    // Зөвхөн алдааны НЭР (`invalid_grant`, `redirect_uri_mismatch`) —
    // код, verifier, нууцыг хэзээ ч логлохгүй.
    const body = (await response.json().catch(() => ({}))) as { error?: unknown }
    console.error('[auth] Google токен солилцоо татгалзлаа', response.status, body.error)
    return null
  }

  const body = (await response.json()) as { id_token?: unknown }
  return typeof body.id_token === 'string' ? body.id_token : null
}
