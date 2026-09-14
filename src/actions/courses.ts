'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { startPayment } from './orders'
import { getUser } from '@/lib/auth/dal'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'

/**
 * Курст элсэх.
 *
 * Багтаамж, элсэлтийн цонх, давхардлын шалгалт БҮГД `enroll_course`
 * Postgres функц дотор, мөрийг түгжсэн байдалтай явагдана (§ migration).
 * Энд зөвхөн эрх шалгаж, алдааны кодыг хаяг руу буулгана.
 *
 * Яагаад алдааг хаягт (`?error=CODE`) тавьдаг вэ: server action нь
 * redirect-ээр дуусдаг тул төлөв санах ойд үлдэхгүй. Код нь хаягт байвал
 * хуудас сэргээх, буцах товч, хуваалцах бүгд ажиллана — мөн орчуулга нь
 * серверт хийгддэг тул хэлээ сольсон ч мессеж дагана.
 */

const enrollErrorCodes = [
  'COURSE_UNAVAILABLE',
  'ENROLL_NOT_OPEN',
  'ENROLL_CLOSED',
  'COURSE_FULL',
  'ALREADY_ENROLLED',
  'CONTACT_REQUIRED',
] as const

export type EnrollErrorCode = (typeof enrollErrorCodes)[number] | 'UNKNOWN'

function toErrorCode(message: string | undefined): EnrollErrorCode {
  return enrollErrorCodes.find((code) => message?.includes(code)) ?? 'UNKNOWN'
}

function localeFrom(formData: FormData): Locale {
  const raw = String(formData.get('locale') ?? '')
  return isLocale(raw) ? raw : defaultLocale
}

/** Зөвхөн дотоод зам — задгай redirect-ээс сэргийлнэ. */
function backTo(formData: FormData, locale: Locale): string {
  const raw = String(formData.get('back') ?? '')
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : `/${locale}/courses`
}

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  note: z.string().trim().max(500).default(''),
})

export async function enrollCourse(formData: FormData): Promise<void> {
  const locale = localeFrom(formData)
  const back = backTo(formData, locale)
  const courseId = z.string().uuid().safeParse(formData.get('course_id'))

  if (!courseId.success) redirect(`${back}?error=UNKNOWN`)

  // Server action нь UI-гүйгээр шууд POST-оор дуудагдаж болно — эрхээ энд шалгана.
  const user = await getUser()
  if (!user) redirect(`/${locale}/login?next=${encodeURIComponent(back)}`)

  const contact = contactSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    note: formData.get('note') ?? '',
  })

  if (!contact.success) redirect(`${back}?error=CONTACT_REQUIRED`)

  const supabase = await createClient()
  const { data: orderNo, error } = await supabase.rpc('enroll_course', {
    p_course_id: courseId.data,
    p_name: contact.data.name,
    p_phone: contact.data.phone,
    p_note: contact.data.note || null,
  })

  if (error || !orderNo) {
    redirect(`${back}?error=${toErrorCode(error?.message)}`)
  }

  revalidatePath('/', 'layout')

  /* ── Шууд төлбөр рүү ─────────────────────────────────────────────────
     `enroll_course` нь захиалга, захиалгын мөр, `payments` мөрийг
     дэлгүүртэй ЯГ ижил хэлбэрээр үүсгэдэг (§ migration `enroll_course`)
     тул төлөх зам нь ч ижил байх ёстой: сагснаас гарахад Bonum руу
     шилждэгтэй адил, элсмэгц мөн тийш.

     Хоёр өөр «төлбөрөө хийнэ үү» дэлгэц байх нь хэрэглэгчид хоёр өөр
     үнэн үүсгэнэ — нэг нь товч дарж төлдөг, нөгөө нь данс хуулдаг гэж.

     Нэхэмжлэл үүсэхгүй бол захиалгын хуудас руу: элсэлт нь аль хэдийн
     үүссэн тул алдах зүйл алга, тэнд «Онлайнаар төлөх» товч хүлээж
     байна (§ actions/orders.ts `payOrder`). */
  const link = await startPayment(supabase, orderNo, locale)

  redirect(link ?? `/${locale}/order/${orderNo}?new=1`)
}

/**
 * Элсэлт цуцлах.
 *
 * Хэрэглэгч зөвхөн ТӨЛӨӨГҮЙ элсэлтээ цуцална — төлсний дараах буцаалт нь
 * мөнгөний асуудал тул ажилтны шийдвэр. Хязгаарлалт нь SQL дотор.
 */
export async function cancelEnrollment(formData: FormData): Promise<void> {
  const locale = localeFrom(formData)
  const id = z.string().uuid().safeParse(formData.get('enrollment_id'))
  const back = `/${locale}/account/courses`

  if (!id.success) redirect(back)

  const user = await getUser()
  if (!user) redirect(`/${locale}/login?next=${encodeURIComponent(back)}`)

  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_enrollment', { p_enrollment_id: id.data })

  revalidatePath('/', 'layout')
  redirect(error ? `${back}?error=UNKNOWN` : `${back}?ok=cancelled`)
}
