import { Alert, Button, EmptyState, Input, Panel, PageHeader } from '@/components/admin/ui'
import { CustomerTable, type CustomerRow } from '@/components/admin/CustomerTable'
import { createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth/dal'
import { listAccountEmails } from '@/lib/auth/accounts'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; error?: string; open?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  /* `listAccountEmails()` нь service-role-оор явна — RLS энд хамгаалахгүй тул
     эрхийг ЭНЭ хуудас өөрөө шалгана. Зөвхөн layout-д найдах нь хангалтгүй:
     layout нь client талын шилжилтэд дахин ажилладаггүй, тиймээс эрх нь
     хасагдсан ажилтан хуудсыг бүрэн дахин ачаалах хүртэл бүх хүний и-мэйлийг
     уншсаар байна (§ lib/auth/accounts.ts — «дуудагч заавал шалгана»). */
  await requireStaff()
  const supabase = await createClient()

  /* PostgREST-ийн шүүлтүүрт `%`, таслал, хаалт нь тусгай утгатай. Цэвэрлэхгүй
     бол таслалтай нэр «олдсонгүй» гэж буцаад, нэмэлт OR нөхцөл шургуулах зай
     үлдэнэ (§ admin/orders/page.tsx ижил хээг аль хэдийн цэвэрлэдэг). */
  const term = search.q?.replace(/[%,()]/g, '').trim()

  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
  if (term) {
    query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%`)
  }

  // Имэйл нь `auth.users` дотор байдаг тул Admin API-аар авна.
  const [{ data: profiles }, emails] = await Promise.all([query, listAccountEmails()])

  const customers: CustomerRow[] = (profiles ?? []).map((profile) => ({
    id: profile.id,
    name: profile.full_name,
    phone: profile.phone,
    email: emails.get(profile.id) ?? null,
    role: profile.role,
    created_at: profile.created_at,
  }))

  return (
    <>
      <PageHeader
        title="Хэрэглэгчид"
        description="Мөр дээр дарж имэйл зэрэг дэлгэрэнгүйг нь харна. Эрх олгох, хасахыг «Админ» хуудаснаас хийнэ. Сүүлд бүртгүүлсэн 200 хүн."
      />

      {search.ok && <Alert tone="good">Шинэчлэгдлээ.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      <Panel
        title="Жагсаалт"
        description={`${customers.length} хэрэглэгч`}
        actions={
          <form className="flex items-center gap-1.5">
            <Input
              name="q"
              type="search"
              defaultValue={search.q ?? ''}
              placeholder="Нэр эсвэл утас"
              className="h-8 w-52 text-xs"
            />
            <Button type="submit" size="sm">
              Хайх
            </Button>
          </form>
        }
        flush
      >
        {customers.length === 0 ? (
          <EmptyState
            icon="search"
            title="Хэрэглэгч олдсонгүй"
            hint={search.q ? `«${search.q}» гэсэн хайлтад тохирох бичлэг алга.` : undefined}
          />
        ) : (
          <CustomerTable customers={customers} />
        )}
      </Panel>
    </>
  )
}
