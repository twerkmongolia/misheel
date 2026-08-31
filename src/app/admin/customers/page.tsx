import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Input,
  Panel,
  PageHeader,
  Select,
  Table,
  Td,
  Th,
} from '@/components/admin/ui'
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
  const canEdit = me?.role === 'admin'

  return (
    <>
      <PageHeader
        title="Хэрэглэгчид"
        description="Сүүлд бүртгүүлсэн 200 хүн. Эрх өөрчлөх нь зөвхөн админд нээлттэй."
      />

      {search.ok && <Alert tone="good">Шинэчлэгдлээ.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}
      {!canEdit && <Alert tone="info">Танд эрх өөрчлөх боломж байхгүй — зөвхөн харах горим.</Alert>}

      <Panel
        title="Жагсаалт"
        description={`${profiles?.length ?? 0} хэрэглэгч`}
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
        {!profiles || profiles.length === 0 ? (
          <EmptyState
            icon="search"
            title="Хэрэглэгч олдсонгүй"
            hint={search.q ? `«${search.q}» гэсэн хайлтад тохирох бичлэг алга.` : undefined}
          />
        ) : (
          <Table minWidth={680}>
            <thead>
              <tr>
                <Th>Нэр</Th>
                <Th>Утас</Th>
                <Th>Бүртгүүлсэн</Th>
                <Th align="right">Эрх</Th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <Td className="font-medium">{profile.full_name ?? '—'}</Td>
                  <Td className="text-foreground-soft" label="Утас">{profile.phone ?? '—'}</Td>
                  <Td className="whitespace-nowrap text-foreground-soft" label="Бүртгүүлсэн">
                    {formatDate(profile.created_at, 'mn')}
                  </Td>
                  <Td align="right">
                    {canEdit ? (
                      <form action={setUserRole} className="flex items-center justify-end gap-1.5">
                        <input type="hidden" name="user_id" value={profile.id} />
                        <Select
                          name="role"
                          defaultValue={profile.role}
                          className="h-[30px] w-32 text-xs"
                        >
                          {(Object.keys(roles) as UserRole[]).map((role) => (
                            <option key={role} value={role}>
                              {roles[role]}
                            </option>
                          ))}
                        </Select>
                        <Button type="submit" size="sm">
                          Хадгалах
                        </Button>
                      </form>
                    ) : (
                      <Badge tone={profile.role === 'admin' ? 'info' : 'neutral'}>
                        {roles[profile.role]}
                      </Badge>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  )
}
