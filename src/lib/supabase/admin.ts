import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { supabaseUrl } from './env'

/**
 * RLS-ийг тойрдог service-role client.
 *
 * ⚠️ ЗӨВХӨН cron, webhook зэрэг хэрэглэгчийн session байхгүй газарт.
 * Хуудас, Server Action дотор ХЭЗЭЭ Ч бүү ашигла — тэнд `server.ts` -ийг
 * хэрэглэвэл RLS хамгаална.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY алга байна')

  return createSupabaseClient<Database>(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
