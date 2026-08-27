import { isSupabaseConfigured } from '@/lib/supabase/env'
import { demoEnabled } from '@/lib/demo-data'

/**
 * Хөгжүүлэлтийн төлөвийг ил харуулна.
 *
 * Демо өгөгдөл нь бодит агуулга мэт харагдаж болзошгүй тул үргэлж
 * тэмдэглэгээтэй байх ёстой — эс бөгөөс хэн нэгэн үүнийг жинхэнэ
 * хуваарь гэж андуурна.
 */
export function SetupNotice() {
  if (demoEnabled()) {
    return (
      <div className="border-b border-accent/25 bg-accent-soft px-5 py-3 text-center text-sm text-accent">
        Демо өгөгдөл харагдаж байна — хуваарь, бараа зэрэг нь зохиомол.{' '}
        <code className="font-mono text-xs">.env.local</code> доторх{' '}
        <code className="font-mono text-xs">DEMO_DATA=1</code> -ыг устгавал бодит өгөгдөл рүү шилжинэ.
      </div>
    )
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="border-b border-warn/25 bg-warn-soft px-5 py-3 text-center text-sm text-warn">
        Supabase тохируулаагүй байна — өгөгдөл харагдахгүй.{' '}
        <code className="font-mono text-xs">.env.local</code> дотор түлхүүрүүдээ нэмнэ үү.
      </div>
    )
  }

  return null
}
