import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Field,
  FormActions,
  Input,
  Panel,
  PageHeader,
  Select,
  Sub,
  Table,
  Td,
  Th,
} from '@/components/admin/ui'
import { grantAccess, revokeAccess } from '@/actions/access'
import { formatDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/dal'
import { listAccountEmails } from '@/lib/auth/accounts'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { UserRole } from '@/lib/supabase/database.types'

const roles: Record<UserRole, string> = {
  customer: 'Хэрэглэгч',
  instructor: 'Багш',
  staff: 'Ажилтан',
  admin: 'Админ',
}

export default async function AdminAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  // Зөвхөн админ. Ажилтан энэ хаяг руу шууд ороход /admin руу буцна.
  const me = await requireAdmin()

  const supabase = await createClient()
  const [{ data: staff }, emails] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'staff'])
      .order('created_at', { ascending: false }),
    listAccountEmails(),
  ])

  return (
    <>
      <PageHeader
        title="Админ"
        description="Имэйл хаягаар нь удирдлагын эрх олгоно. Бүртгэлгүй хүнд урилга илгээгдэнэ."
      />

      {search.ok && <Alert tone="good">{search.ok}</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      <Panel
        title="Эрх олгох"
        description="Имэйл нь тухайн хүний сайтад бүртгүүлсэн хаягтай яг таарах ёстой."
      >
        <form action={grantAccess} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
            <Field label="Имэйл хаяг" hint="жишээ: bat@gmail.com">
              <Input
                type="email"
                name="email"
                required
                autoComplete="off"
                placeholder="hereglegch@gmail.com"
              />
            </Field>
            <Field label="Эрх" hint="Админ нь эрх олгож чадна">
              <Select name="role" defaultValue="admin">
                <option value="admin">Админ</option>
                <option value="staff">Ажилтан</option>
              </Select>
            </Field>
          </div>

          <FormActions>
            <Button type="submit" variant="primary">
              Эрх олгох
            </Button>
          </FormActions>
        </form>
      </Panel>

      <Panel
        title="Эрхтэй хүмүүс"
        description={`${staff?.length ?? 0} хүн удирдлагад нэвтэрнэ`}
        flush
      >
        {!staff || staff.length === 0 ? (
          <EmptyState icon="users" title="Эрхтэй хүн алга" />
        ) : (
          <Table minWidth={680}>
            <thead>
              <tr>
                <Th>Хүн</Th>
                <Th>Имэйл</Th>
                <Th>Нэмэгдсэн</Th>
                <Th align="right">Эрх</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {staff.map((profile) => {
                const isMe = profile.id === me.id
                return (
                  <tr key={profile.id}>
                    <Td className="font-medium">
                      {profile.full_name ?? '—'}
                      {isMe && <Sub>Та</Sub>}
                    </Td>
                    <Td className="text-foreground-soft" label="Имэйл">
                      {emails.get(profile.id) ?? '—'}
                    </Td>
                    <Td className="whitespace-nowrap text-foreground-soft" label="Нэмэгдсэн">
                      {formatDate(profile.created_at, 'mn')}
                    </Td>
                    <Td align="right" label="Эрх">
                      <Badge tone={profile.role === 'admin' ? 'info' : 'neutral'}>
                        {roles[profile.role]}
                      </Badge>
                    </Td>
                    <Td align="right">
                      {/* Өөрийгөө хасвал сүүлчийн админ хаалганы гадна үлдэж мэднэ */}
                      {!isMe && (
                        <form action={revokeAccess} className="flex justify-end">
                          <input type="hidden" name="user_id" value={profile.id} />
                          <Button type="submit" variant="danger" size="sm">
                            Эрх хасах
                          </Button>
                        </form>
                      )}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  )
}
