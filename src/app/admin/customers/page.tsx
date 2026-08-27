import { Alert, Badge, Empty, Select, TableWrap, Td, Th } from '@/components/ui'
import { setUserRole } from '@/actions/admin'
import { formatDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/dal'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { UserRole } from '@/lib/supabase/database.types'

const roles: Record<UserRole, string> = {
  customer: 'Хэрэглэгч',
  instructor: 'Багш',
  staff: 'Ажилтан',
  admin: 'Админ',
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; error?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  const me = await getProfile()
  const supabase = await createClient()

  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
  if (search.q) {
    query = query.or(`full_name.ilike.%${search.q}%,phone.ilike.%${search.q}%`)
  }

  const { data: profiles } = await query

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Хэрэглэгчид</h1>

      {search.ok && <Alert tone="good">Шинэчлэгдлээ.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}
      {me?.role !== 'admin' && (
        <Alert tone="neutral">Эрх өөрчлөх боломж зөвхөн админд нээлттэй.</Alert>
      )}

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={search.q ?? ''}
          placeholder="Нэр эсвэл утсаар хайх"
          className="w-full max-w-sm rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-surface-2">
          Хайх
        </button>
      </form>

      {!profiles || profiles.length === 0 ? (
        <Empty>Хэрэглэгч олдсонгүй.</Empty>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Нэр</Th>
              <Th>Утас</Th>
              <Th>Бүртгүүлсэн</Th>
              <Th>Эрх</Th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <Td>{profile.full_name ?? '—'}</Td>
                <Td className="tabular-nums">{profile.phone ?? '—'}</Td>
                <Td className="tabular-nums">{formatDate(profile.created_at, 'mn')}</Td>
                <Td>
                  {me?.role === 'admin' ? (
                    <form action={setUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="user_id" value={profile.id} />
                      <Select name="role" defaultValue={profile.role} className="w-36 py-1.5 text-xs">
                        {(Object.keys(roles) as UserRole[]).map((role) => (
                          <option key={role} value={role}>
                            {roles[role]}
                          </option>
                        ))}
                      </Select>
                      <button type="submit" className="text-sm text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-foreground">
                        Хадгалах
                      </button>
                    </form>
                  ) : (
                    <Badge tone={profile.role === 'admin' ? 'accent' : 'neutral'}>
                      {roles[profile.role]}
                    </Badge>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  )
}
