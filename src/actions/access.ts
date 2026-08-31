'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/dal'
import { findAccountByEmail, inviteAccount } from '@/lib/auth/accounts'

/**
 * Удирдлагын эрх олгох, хураах.
 *
 * Хоёр давхаргатай: энд `requireAdmin()`, DB дээр `guard_profile_role` trigger
 * (§ supabase/setup-all.sql). Тиймээс энэ үйлдлийг тойрч шууд POST илгээсэн ч
 * эрх өөрчлөгдөхгүй.
 *
 * Хайлт нь ИМЭЙЛЭЭР явна — `profiles` дотор имэйл байхгүй тул Admin API-аар
 * `auth.users` руу хандана (§ lib/auth/accounts.ts).
 */

const emailSchema = z.email('Имэйл хаяг буруу байна')
const roleSchema = z.enum(['admin', 'staff'])
const uuidSchema = z.uuid()

function back(message: string, ok = false): never {
  redirect(`/admin/access?${ok ? 'ok' : 'error'}=${encodeURIComponent(message)}`)
}

export async function grantAccess(formData: FormData): Promise<void> {
  await requireAdmin()

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const parsedEmail = emailSchema.safeParse(email)
  const parsedRole = roleSchema.safeParse(formData.get('role'))

  if (!parsedEmail.success) back(parsedEmail.error.issues[0]?.message ?? 'Имэйл буруу байна')
  if (!parsedRole.success) back('Эрхээ сонгоно уу')

  const role = parsedRole.data
  const roleLabel = role === 'admin' ? 'Админ' : 'Ажилтан'

  // 1. Энэ имэйлээр бүртгэл байна уу?
  let account = await findAccountByEmail(email)
  let invited = false

  // 2. Үгүй бол урина. Урилга нь `auth.users` мөр үүсгэдэг тул эрхийг нь
  //    дараагийн алхамд шууд тавьж болно — тэр хүн нууц үгээ тавимагц
  //    удирдлагын хэсэгт нэвтэрнэ.
  if (!account) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const result = await inviteAccount(email, `${origin}/mn/reset-password`)

    if ('error' in result) {
      back(
        `${email} гэсэн бүртгэл олдсонгүй. Урилга илгээх ч боломжгүй байна ` +
          `(${result.error}) — тухайн хүн эхлээд сайт дээр бүртгүүлэх шаардлагатай.`,
      )
    }

    account = { id: result.id }
    invited = true
  }

  // 3. Эрхийг нь тавина. Бичилт ЭНГИЙН client-ээр явна — RLS болон
  //    `guard_profile_role` давхар шалгана.
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ role }).eq('id', account.id)
  if (error) back(error.message)

  revalidatePath('/admin/access')
  revalidatePath('/admin/customers')

  back(
    invited
      ? `${email} рүү урилга илгээлээ. Нууц үгээ тавимагц ${roleLabel} эрхээр нэвтэрнэ.`
      : `${email} хаягт ${roleLabel} эрх олголоо.`,
    true,
  )
}

export async function revokeAccess(formData: FormData): Promise<void> {
  const me = await requireAdmin()

  const id = uuidSchema.safeParse(formData.get('user_id'))
  if (!id.success) back('Хэрэглэгч буруу байна')

  // Өөрийгөө хасвал сүүлчийн админ хаалганы гадна үлдэж мэднэ.
  if (id.data === me.id) back('Өөрийнхөө эрхийг хасах боломжгүй')

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ role: 'customer' }).eq('id', id.data)
  if (error) back(error.message)

  revalidatePath('/admin/access')
  revalidatePath('/admin/customers')
  back('Эрхийг хаслаа', true)
}
