'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/dal'
import { siteOrigin } from '@/lib/site-url'
import { getDictionary } from '@/lib/i18n'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'

type State = { error?: string; message?: string } | undefined

function localeFrom(formData: FormData): Locale {
  const raw = String(formData.get('locale') ?? '')
  return isLocale(raw) ? raw : defaultLocale
}

/** `next` параметрийг зөвхөн дотоод зам байхыг зөвшөөрнө (open redirect-ээс сэргийлнэ). */
function safeNext(value: FormDataEntryValue | null, locale: Locale): string {
  const raw = String(value ?? '')
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : `/${locale}/account`
}

/**
 * ── Мессежүүд нь ТОЛЬ БИЧГЭЭС ─────────────────────────────────────────────
 * Өмнө нь энэ файл дотор монголоор ХАТУУ бичигдсэн байв: `/en` дээр маягт
 * бөглөж байсан хүн «И-мэйл эсвэл нууц үг буруу байна.» гэсэн монгол
 * өгүүлбэр уншдаг байлаа — сайтын үлдсэн хэсэг нь бүхэлдээ англи атлаа.
 *
 * Server Action нь хуудасны хэлийг мэдэхгүй тул маягт нь нуугдмал `locale`
 * талбараар дамжуулдаг (§ AuthForms.tsx). Тэр утга л энд толь бичиг сонгоно.
 */
function messages(locale: Locale): Dictionary['auth']['errors'] {
  return getDictionary(locale).auth.errors
}

/**
 * Supabase-ийн алдааны КОДЫГ хүнд ойлгомжтой өгүүлбэр рүү буулгана.
 *
 * ── Яагаад бүгдийг «нууц үг буруу» гэж болохгүй вэ ───────────────────────
 * Өмнө нь `signInWithPassword` -ийн ЯМАР Ч алдаа «И-мэйл эсвэл нууц үг
 * буруу байна» болж хувирдаг байв. Гурван огт өөр байдал нэг өгүүлбэр рүү
 * унана:
 *
 *   · нууц үг үнэхээр буруу        → дахин бичвэл болно
 *   · и-мэйл баталгаажаагүй        → хэдэн удаа бичсэн ч ХЭЗЭЭ Ч болохгүй,
 *     и-мэйлээ нээх ёстой. Хүн үүнийг мэдэхгүй бол «бүртгэл маань устсан
 *     байна» гэж бодоод дахин бүртгүүлэхийг оролдоно.
 *   · хэт олон оролдлого (429)     → хүлээх ёстой. Дахин дарах нь зөвхөн
 *     хугацааг уртасгана.
 *
 * ⚠️ Хаяг байгаа эсэхийг илчлэхгүй: буруу нууц үг ба байхгүй хаяг ХОЁУЛАА
 * `invalid_credentials` буцаадаг тул тэдгээр нь нэг өгүүлбэр рүү зориуд
 * унана.
 */
function authMessage(
  error: { code?: string; message: string },
  t: Dictionary['auth']['errors'],
): string {
  switch (error.code) {
    case 'email_not_confirmed':
      return t.notConfirmed
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return t.tooMany
    case 'weak_password':
      return t.weakPassword
    case 'same_password':
      return t.samePassword
    case 'invalid_credentials':
      return t.credentials
    /* Supabase хаягийн ХЭЛБЭР, ДОМЭЙНЫГ өөрөө шалгадаг: `example.com` зэрэг
       мэдээжийн хуурамч домэйныг татгалзана. Zod түүнийг мэдэхгүй тул энэ
       нь зөвхөн сервер талаас ирнэ. Хэрэглэгчид хэлэх нь ЗӨВ: энэ бол
       түүний БИЧСЭН зүйлийн тухай, бүртгэл байгаа эсэхийн тухай биш. */
    case 'email_address_invalid':
    case 'validation_failed':
      return t.email
    default:
      /* Танигдаагүй код — жинхэнэ мессеж нь англи, ихэвчлэн техникийн тул
         хэрэглэгчид үзүүлэхгүй. Серверт үлдээвэл бид дараа нь буулгалтад
         нэмж чадна. */
      console.error(`[auth] буулгаагүй алдаа: ${error.code ?? '—'} — ${error.message}`)
      return t.unknown
  }
}

/** Маягтын шалгалт — мессежүүд нь хэлээсээ хамаарна. */
function credentialsSchema(t: Dictionary['auth']['errors']) {
  return z.object({
    email: z.string().email(t.email),
    password: z.string().min(8, t.password),
  })
}

export async function login(_state: State, formData: FormData): Promise<State> {
  const locale = localeFrom(formData)
  const t = messages(locale)

  const parsed = credentialsSchema(t).safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error || !data.user) {
    return { error: error ? authMessage(error, t) : t.credentials }
  }

  revalidatePath('/', 'layout')

  const next = formData.get('next')

  /*
   * Удирдлагын эрхтэй хүн нэвтрэхэд шууд хяналтын самбар руу орно —
   * нийтийн сайтын `account` хуудсаар дамжихгүй.
   *
   * `next` байвал түүнийг хүндэтгэнэ: хэрэглэгч тодорхой хуудас руу орох
   * гэж байгаад нэвтрэлт шаардсан тул тэр санааг таслах учиргүй.
   *
   * Эрхийг `getProfile()` -ээр биш, дөнгөж авсан `data.user.id` -ээр уншина.
   * `getProfile` нь хүсэлтийн туршид кэшлэгддэг тул нэвтрэхээс өмнөх
   * (хоосон) утгаа буцааж мэдэнэ.
   */
  if (!next) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profile?.role === 'staff' || profile?.role === 'admin') {
      redirect('/admin')
    }

    /* Сурагчийн эхний асуулт нь «миний хичээл хаана байна» — профайл биш.
       Профайл нь ХОЁРДОГЧ: утсаа сольхын тулд л нээдэг хуудас. */
    redirect(`/${locale}/account/courses`)
  }

  redirect(safeNext(next, locale))
}

export async function signup(_state: State, formData: FormData): Promise<State> {
  const locale = localeFrom(formData)
  const t = messages(locale)

  const parsed = credentialsSchema(t)
    .extend({
      full_name: z.string().trim().min(2, t.name),
      phone: z.string().trim().min(6, t.phone),
    })
    .safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      full_name: formData.get('full_name'),
      phone: formData.get('phone'),
    })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message }
  }

  const supabase = await createClient()

  /* Буцах хаягийг ОРЧНЫ ХУВЬСАГЧААС биш ХҮСЭЛТЭЭС авна (§ lib/site-url.ts):
     тогтмол утга нь localhost, preview, production гурвын аль нэгэнд нь
     үргэлж буруу байдаг. */
  const origin = await siteOrigin()

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name, phone: parsed.data.phone, locale },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(`/${locale}/account/courses`)}`,
    },
  })

  if (error) {
    /* ── Аль хэдийн бүртгэлтэй хаяг ───────────────────────────────────────
       Хүн «Бүртгүүлэх» дараад «Та аль хэдийн бүртгэлтэй» гэсэн хана мөргөх
       нь хамгийн ашиггүй хариу: тэр өөрийнхөө хаягаар өөрийнхөө бүртгэл рүү
       орох гэж байгаа бөгөөд нууц үгээ ЭНЭ МАЯГТ ДЭЭР аль хэдийн бичсэн.
       Нууц үг нь таарч байвал орох эрхтэй — тиймээс нэвтрүүлнэ.

       ⚠️ Нууц үг нь ТААРААГҮЙ үед бид «энэ хаяг бүртгэлтэй» гэж ХЭЛНЭ.
       Энэ бол ухамсартай буулт: и-мэйл баталгаажуулалт асаалттай үед
       Supabase өөрөө хаягийг нуудаг (алдаа биш, хуурамч хэрэглэгч буцаадаг)
       тул энэ мөр зөвхөн баталгаажуулалт УНТРААЛТТАЙ төсөл дээр ажиллана —
       тэнд хаяг байгаа эсэхийг нэвтрэх маягт дээрээс ялгах арга ямар ч
       байсан бий. Хүнийг «нууц үг буруу байна» гэж төөрөгдүүлэхээс
       «та бүртгэлтэй, нэвтэрнэ үү» гэж хэлэх нь дээр. */
    const exists =
      error.code === 'user_already_exists' || /already registered|already exists/i.test(error.message)

    if (exists) {
      const { data: signedIn } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      })

      if (signedIn.session) {
        revalidatePath('/', 'layout')
        redirect(`/${locale}/account/courses`)
      }

      return { error: t.exists }
    }

    return { error: authMessage(error, t) }
  }

  /* Session ирээгүй гэдэг нь Supabase дээр и-мэйл баталгаажуулалт АСААЛТТАЙ
     гэсэн үг (Authentication → Email → Confirm email). Тэр тохиргоо унтарсан
     үед бүртгүүлсэн даруйдаа нэвтэрнэ — энэ мөр огт ажиллахгүй. */
  if (!data.session) {
    return { message: 'checkEmail' }
  }

  revalidatePath('/', 'layout')
  redirect(`/${locale}/account/courses`)
}

export async function requestPasswordReset(_state: State, formData: FormData): Promise<State> {
  const locale = localeFrom(formData)
  const t = messages(locale)
  const email = z.string().email().safeParse(formData.get('email'))

  if (!email.success) {
    return { error: t.email }
  }

  const supabase = await createClient()
  const origin = await siteOrigin()

  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(`/${locale}/reset-password`)}`,
  })

  /* ── Аль алдааг ХЭЛЭХ вэ ──────────────────────────────────────────────────
     Анхдагчаар БҮХ алдаа «илгээлээ» рүү уначихдаг байв — хаяг бүртгэлтэй
     эсэхийг илчлэхгүйн тулд. Тэр бодол зөв ч, хэт өргөн хэрэглэгдсэн:

       · хязгаар (429) — Supabase цагт хэдхэн захидал л илгээнэ. Хүрсэн
         үед «илгээлээ» гэж хэлэх нь ХУДАЛ: хүн хоосон хайрцгаа шинэчилсээр
         хэвээр үлдэнэ.
       · хаяг буруу — `example.com` зэрэг домэйныг Supabase өөрөө
         татгалздаг (`email_address_invalid`). Хүн үсгийн алдаа гаргасан ч
         «илгээлээ» гэж уншаад ХЭЗЭЭ Ч ирэхгүй захидал хүлээнэ.

     Хоёулаа ХҮНИЙ БИЧСЭН зүйлийн тухай бөгөөд бүртгэл байгаа эсэхийг
     илчлэхгүй — тиймээс хэлэх нь зөв. Үлдсэн бүх алдаа (хаяг олдсонгүй
     г.м.) нь өмнөх шигээ ижил «илгээлээ» рүү унана. */
  if (error) {
    if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
      return { error: t.tooMany }
    }
    if (error.code === 'email_address_invalid' || error.code === 'validation_failed') {
      return { error: t.email }
    }
  }

  if (error) {
    console.error(`[auth] сэргээх и-мэйл илгээгдсэнгүй: ${error.code ?? '—'} — ${error.message}`)
  }

  // Тухайн и-мэйл бүртгэлтэй эсэхийг илчлэхгүйн тулд үргэлж ижил хариу.
  return { message: 'resetSent' }
}

export async function updatePassword(_state: State, formData: FormData): Promise<State> {
  const locale = localeFrom(formData)
  const t = messages(locale)
  const password = z.string().min(8, t.password).safeParse(formData.get('password'))

  if (!password.success) {
    return { error: password.error.issues[0]?.message }
  }

  /* ── Session-ийг ЭНД шалгана ──────────────────────────────────────────────
     Өмнө нь шууд `updateUser` дуудаж, session байхгүй үед Supabase-ийн
     «Auth session missing!» гэсэн АНГЛИ техникийн мөр маягтан дээр гарч
     ирдэг байв. Тэр байдал нь ховор биш: сэргээх холбоос хугацаа нь
     дуусмагц, эсвэл хүн `/reset-password` хаягийг шууд бичиж орвол яг
     ингэнэ. Хэрэглэгч юу хийхээ мэдэхийн тулд «шинэ холбоос ав» гэдгийг
     сонсох ёстой (§ (auth)/reset-password/page.tsx дээр мөн адил). */
  const user = await getUser()
  if (!user) return { error: t.sessionMissing }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: password.data })

  if (error) return { error: authMessage(error, t) }

  revalidatePath('/', 'layout')
  redirect(`/${locale}/account`)
}

export async function updateProfile(_state: State, formData: FormData): Promise<State> {
  const locale = localeFrom(formData)
  const t = messages(locale)

  const user = await getUser()
  if (!user) return { error: t.sessionMissing }

  const parsed = z
    .object({
      full_name: z.string().trim().min(2, t.name),
      phone: z.string().trim().min(6, t.phone),
    })
    .safeParse({
      full_name: formData.get('full_name'),
      phone: formData.get('phone'),
    })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update(parsed.data).eq('id', user.id)

  /* Postgres-ийн мессеж нь англи бөгөөд техникийн (`new row violates row-level
     security policy…`) — хэрэглэгчид хэлэх зүйл алга. Жинхэнэ шалтгаан нь
     серверийн лог дээр л хэрэгтэй. */
  if (error) {
    console.error(`[auth] профайл хадгалагдсангүй: ${error.code} — ${error.message}`)
    return { error: t.saveFailed }
  }

  revalidatePath('/', 'layout')
  return { message: 'updated' }
}

export async function logout(formData: FormData): Promise<void> {
  const locale = localeFrom(formData)
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect(`/${locale}`)
}
