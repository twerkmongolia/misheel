import { Alert, Button, EmptyState, Input, Panel, PageHeader } from '@/components/admin/ui'
import { CustomerTable, type CustomerRow } from '@/components/admin/CustomerTable'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/dal'
import { listAccountEmails } from '@/lib/auth/accounts'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; error?: string; open?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  const me = await getProfile()
  const supabase = await createClient()

  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
  if (search.q) {
    query = query.or(`full_name.ilike.%${search.q}%,phone.ilike.%${search.q}%`)
  }

  // Имэйл нь `auth.users` дотор байдаг тул Admin API-аар авна. Энэ хуудсанд
  // зөвхөн ажилтан хүрнэ (§ admin/layout.tsx `requireStaff`).
  const [{ data: profiles }, emails] = await Promise.all([query, listAccountEmails()])

  const canEdit = me?.role === 'admin'
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
        description="Мөр дээр дарж имэйл, утас зэрэг дэлгэрэнгүйг нь харна. Сүүлд бүртгүүлсэн 200 хүн."
      />

      {search.ok && <Alert tone="good">Шинэчлэгдлээ.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}
      {!canEdit && <Alert tone="info">Танд эрх өөрчлөх боломж байхгүй — зөвхөн харах горим.</Alert>}

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
          <CustomerTable customers={customers} canEdit={canEdit} openId={search.open} />
        )}
      </Panel>
    </>
  )
}
