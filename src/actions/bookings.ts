'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/dal'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'

/**
 * Багтаамжийн шалгалт БҮГД `book_session` Postgres функц дотор явагдана
 * (мөрийг `for update` -ээр түгжинэ). Энд зөвхөн эрхээ шалгаад дуудна.
 */

const bookingErrorCodes = [
  'SESSION_FULL',
  'SESSION_NOT_AVAILABLE',
  'SESSION_STARTED',
  'ALREADY_BOOKED',
  'CANCEL_TOO_LATE',
  'BOOKING_NOT_CANCELLABLE',
] as const

export type BookingErrorCode = (typeof bookingErrorCodes)[number] | 'UNKNOWN'

/** Postgres-ийн `raise exception 'SESSION_FULL'` -ыг таних. */
function toErrorCode(message: string | undefined): BookingErrorCode {
  const found = bookingErrorCodes.find((code) => message?.includes(code))
  return found ?? 'UNKNOWN'
}

function localeFrom(formData: FormData): Locale {
  const raw = String(formData.get('locale') ?? '')
  return isLocale(raw) ? raw : defaultLocale
}

function backTo(formData: FormData, locale: Locale): string {
  const raw = String(formData.get('back') ?? '')
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : `/${locale}/schedule`
}

export async function bookSession(formData: FormData): Promise<void> {
  const locale = localeFrom(formData)
  const back = backTo(formData, locale)
  const sessionId = z.string().uuid().safeParse(formData.get('session_id'))

  if (!sessionId.success) {
    redirect(`${back}?error=UNKNOWN`)
  }

  // Server Action нь UI-гүйгээр шууд POST-оор дуудагдаж болно — эрхээ энд шалгана.
  const user = await getUser()
  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(back)}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('book_session', { p_session_id: sessionId.data })

  if (error) {
    redirect(`${back}?error=${toErrorCode(error.message)}`)
  }

  revalidatePath(`/${locale}/schedule`)
  revalidatePath(`/${locale}/account/bookings`)
  redirect(`${back}?booked=1`)
}

/* ── Хүлээлгийн жагсаалт ───────────────────────────────────────────────────
   Хичээл дүүрэхэд сурагчийн хийж чадах цорын ганц зүйл нь «дараа дахин
   ороод үзэх» байв — тэгээд ихэнх нь буцаж ирдэггүй. Хүснэгт нь эхнээсээ
   схемд байсан ч хаана ч ашиглагдаагүй.

   Энэ нь мэдэгдэл ИЛГЭЭХГҮЙ: суудал гарахад ажилтан хүснэгтээс хараад
   өөрөө холбогдоно (§ admin/schedule). Автомат мэдэгдэл нь и-мэйл/SMS
   үйлчилгээ шаардах тул тусдаа ажил. */

export async function joinWaitlist(formData: FormData): Promise<void> {
  const locale = localeFrom(formData)
  const back = backTo(formData, locale)
  const sessionId = z.string().uuid().safeParse(formData.get('session_id'))

  if (!sessionId.success) redirect(`${back}?error=UNKNOWN`)

  const user = await getUser()
  if (!user) redirect(`/${locale}/login?next=${encodeURIComponent(back)}`)

  const supabase = await createClient()
  /* `unique (session_id, user_id)` тул давхар дарахад алдаа буцаана —
     түүнийг АЛДАА гэж үзэхгүй: хэрэглэгчийн хүсэл аль хэдийн биелсэн. */
  const { error } = await supabase
    .from('waitlist')
    .upsert({ session_id: sessionId.data, user_id: user.id }, { onConflict: 'session_id,user_id' })

  if (error) redirect(`${back}?error=UNKNOWN`)

  revalidatePath(`/${locale}/schedule`)
  redirect(`${back}?waitlisted=1`)
}

export async function leaveWaitlist(formData: FormData): Promise<void> {
  const locale = localeFrom(formData)
  const back = backTo(formData, locale)
  const sessionId = z.string().uuid().safeParse(formData.get('session_id'))

  if (!sessionId.success) redirect(`${back}?error=UNKNOWN`)

  const user = await getUser()
  if (!user) redirect(`/${locale}/login?next=${encodeURIComponent(back)}`)

  const supabase = await createClient()
  await supabase.from('waitlist').delete().eq('session_id', sessionId.data).eq('user_id', user.id)

  revalidatePath(`/${locale}/schedule`)
  redirect(`${back}?left=1`)
}

export async function cancelBooking(formData: FormData): Promise<void> {
  const locale = localeFrom(formData)
  const back = backTo(formData, locale)
  const bookingId = z.string().uuid().safeParse(formData.get('booking_id'))

  if (!bookingId.success) {
    redirect(`${back}?error=UNKNOWN`)
  }

  const user = await getUser()
  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(back)}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_booking', { p_booking_id: bookingId.data })

  if (error) {
    redirect(`${back}?error=${toErrorCode(error.message)}`)
  }

  revalidatePath(`/${locale}/schedule`)
  revalidatePath(`/${locale}/account/bookings`)
  redirect(`${back}?cancelled=1`)
}
