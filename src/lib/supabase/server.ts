import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './database.types'
import { supabaseAnonKey, supabaseUrl } from './env'

/**
 * Server Component, Server Action, Route Handler-т ашиглах client.
 *
 * `cookies()` нь Next 16-д async тул энэ функц заавал `await` -тай.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Component дотроос cookie бичих боломжгүй. Session-ийг
          // `proxy.ts` шинэчилдэг тул үүнийг алгасаж болно.
        }
      },
    },
  })
}
