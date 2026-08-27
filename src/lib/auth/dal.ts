import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { Profile } from '@/lib/supabase/database.types'
import type { Locale } from '@/lib/i18n/config'

/**
 * Өгөгдөл хандах давхарга (DAL).
 *
 * Хуудас болон Server Action БҮРИЙН эхэнд эрхээ энд шалгана. Server Action нь
 * UI-гүйгээр шууд POST хүсэлтээр дуудагдаж болдог тул товч нуусан нь хамгаалалт
 * болохгүй. `proxy.ts` дахь шалгалт бол зөвхөн хурдан урьдчилсан шүүлт.
 */

export const getUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null

  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
})

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return data ?? null
})

export async function requireUser(locale: Locale, next?: string): Promise<User> {
  const user = await getUser()
  if (!user) {
    const target = next ? `?next=${encodeURIComponent(next)}` : ''
    redirect(`/${locale}/login${target}`)
  }
  return user
}

export async function isStaff(): Promise<boolean> {
  const profile = await getProfile()
  return profile?.role === 'staff' || profile?.role === 'admin'
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile()
  return profile?.role === 'admin'
}

/** Удирдлагын хуудсуудад. Эрхгүй бол нүүр рүү буцаана. */
export async function requireStaff(): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) redirect('/mn/login?next=/admin')
  if (profile.role !== 'staff' && profile.role !== 'admin') redirect('/mn')
  return profile
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireStaff()
  if (profile.role !== 'admin') redirect('/admin')
  return profile
}
