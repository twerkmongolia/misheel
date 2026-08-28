'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/dal'
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

const credentials = z.object({
  email: z.string().email('И-мэйл хаяг буруу байна'),
  password: z.string().min(8, 'Нууц үг дор хаяж 8 тэмдэгт байх ёстой'),
})

export async function login(_state: State, formData: FormData): Promise<State> {
  const locale = localeFrom(formData)
  const parsed = credentials.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error || !data.user) {
    return { error: 'И-мэйл эсвэл нууц үг буруу байна.' }
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
  }

  redirect(safeNext(next, locale))
}

const signupSchema = credentials.extend({
  full_name: z.string().trim().min(2, 'Нэрээ бүтнээр нь бичнэ үү'),
  phone: z.string().trim().min(6, 'Утасны дугаараа бичнэ үү'),
})

export async function signup(_state: State, formData: FormData): Promise<State> {
  const locale = localeFrom(formData)
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name, phone: parsed.data.phone, locale },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback?next=/${locale}/account`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // И-мэйл баталгаажуулалт асаалттай бол session шууд үүсэхгүй.
  if (!data.session) {
    return { message: 'checkEmail' }
  }

  revalidatePath('/', 'layout')
  redirect(`/${locale}/account`)
}

export async function requestPasswordReset(_state: State, formData: FormData): Promise<State> {
  const locale = localeFrom(formData)
  const email = z.string().email().safeParse(formData.get('email'))

  if (!email.success) {
    return { error: 'И-мэйл хаяг буруу байна' }
  }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback?next=/${locale}/reset-password`,
  })

  // Тухайн и-мэйл бүртгэлтэй эсэхийг илчлэхгүйн тулд үргэлж ижил хариу.
  return { message: 'resetSent' }
}

export async function updatePassword(_state: State, formData: FormData): Promise<State> {
  const locale = localeFrom(formData)
  const password = z.string().min(8, 'Нууц үг дор хаяж 8 тэмдэгт').safeParse(formData.get('password'))

  if (!password.success) {
    return { error: password.error.issues[0]?.message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: password.data })

  if (error) return { error: error.message }

  redirect(`/${locale}/account`)
}

const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Нэрээ бүтнээр нь бичнэ үү'),
  phone: z.string().trim().min(6, 'Утасны дугаараа бичнэ үү'),
})

export async function updateProfile(_state: State, formData: FormData): Promise<State> {
  const user = await getUser()
  if (!user) return { error: 'Нэвтэрнэ үү' }

  const parsed = profileSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update(parsed.data).eq('id', user.id)

  if (error) return { error: error.message }

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
