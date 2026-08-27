import { Alert, Empty, TableWrap, Td, Th } from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { indexBy } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export default async function AdminAuditPage() {
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  const supabase = await createClient()
  const { data: entries } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const actorIds = [...new Set((entries ?? []).map((entry) => entry.actor_id).filter(Boolean))] as string[]
  const { data: profiles } = actorIds.length
    ? await supabase.from('profiles').select('*').in('id', actorIds)
    : { data: [] }
  const byActor = indexBy(profiles ?? [], 'id')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Үйлдлийн түүх</h1>

      {!entries || entries.length === 0 ? (
        <Empty>Түүх алга.</Empty>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Хэзээ</Th>
              <Th>Хэн</Th>
              <Th>Юу</Th>
              <Th>Дэлгэрэнгүй</Th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <Td className="tabular-nums whitespace-nowrap">
                  {formatDateTime(entry.created_at, 'mn')}
                </Td>
                <Td>{entry.actor_id ? (byActor.get(entry.actor_id)?.full_name ?? '—') : 'систем'}</Td>
                <Td className="font-mono text-xs">{entry.action}</Td>
                <Td className="font-mono text-xs break-all text-muted">
                  {entry.diff ? JSON.stringify(entry.diff) : '—'}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  )
}
