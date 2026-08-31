import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Бүртгэлийн имэйл рүү хандах давхарга.
 *
 * Имэйл нь `auth.users` дотор байдаг бөгөөд PostgREST-ээр гардаггүй — `profiles`
 * хүснэгтэд ч хуулбарлаагүй. Тиймээс энд Admin API ашиглана.
 *
 * ⚠️ Энэ модуль RLS-ийг ТОЙРНО. Дуудахаасаа ӨМНӨ `requireAdmin()` -ээр эрхийг
 * шалгасан байх ёстой — хамгаалалт нь энд биш, дуудагч талд.
 */

const PAGE_SIZE = 200
const MAX_PAGES = 25

/** Бүртгэлүүдийг хуудаслан гүйж, `id → имэйл` буулгалт үүсгэнэ. */
export async function listAccountEmails(): Promise<Map<string, string>> {
  const admin = createAdminClient()
  const emails = new Map<string, string>()

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
    if (error || !data.users.length) break

    for (const user of data.users) {
      if (user.email) emails.set(user.id, user.email.toLowerCase())
    }

    if (data.users.length < PAGE_SIZE) break
  }

  return emails
}

/** Имэйлээр бүртгэл хайна. Олдоогүй бол `null`. */
export async function findAccountByEmail(email: string): Promise<{ id: string } | null> {
  const target = email.trim().toLowerCase()
  const emails = await listAccountEmails()

  for (const [id, value] of emails) {
    if (value === target) return { id }
  }
  return null
}

/**
 * Шинэ бүртгэл үүсгэж, урилгын холбоос имэйлээр илгээнэ.
 *
 * Урьсан хүн холбоосоор орж нууц үгээ тавимагц нэвтэрнэ. Supabase дээр имэйл
 * илгээх тохиргоо хийгээгүй бол энэ алдаа буцаах тул дуудагч тал нь «эхлээд
 * бүртгүүлэх ёстой» гэж хэлэх боломжтой.
 */
export async function inviteAccount(
  email: string,
  redirectTo: string,
): Promise<{ id: string } | { error: string }> {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo })

  if (error || !data.user) return { error: error?.message ?? 'Урилга илгээгдсэнгүй' }
  return { id: data.user.id }
}
