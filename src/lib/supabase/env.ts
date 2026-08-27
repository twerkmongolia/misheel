/** Supabase-ийн орчны хувьсагчид — байхгүй бол ойлгомжтой алдаа өгнө. */

export function supabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new SupabaseNotConfiguredError('NEXT_PUBLIC_SUPABASE_URL')
  return url
}

export function supabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new SupabaseNotConfiguredError('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return key
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export class SupabaseNotConfiguredError extends Error {
  constructor(missing: string) {
    super(
      `Supabase тохируулаагүй байна: ${missing} алга. ` +
        '.env.local файлдаа Supabase проектийн түлхүүрүүдээ нэмнэ үү (README-г үзнэ үү).',
    )
    this.name = 'SupabaseNotConfiguredError'
  }
}
