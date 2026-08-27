import { Alert, Badge, Button, Empty, Select, TableWrap, Td, Th } from '@/components/ui'
import { markAttendance } from '@/actions/admin'
import { formatDate, formatTime } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { getSessionsBetween, indexBy } from '@/lib/data'
import { addDays, weekStart } from '@/lib/format'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { BookingStatus } from '@/lib/supabase/database.types'

const tones: Record<BookingStatus, 'neutral' | 'good' | 'warn' | 'danger'> = {
  pending: 'warn',
  confirmed: 'good',
  cancelled: 'danger',
  attended: 'neutral',
  no_show: 'danger',
}

const labels: Record<BookingStatus, string> = {
  pending: 'Хүлээгдэж буй',
  confirmed: 'Баталгаажсан',
  cancelled: 'Цуцлагдсан',
  attended: 'Ирсэн',
  no_show: 'Ирээгүй',
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  // Сонгох боломжтой хичээлүүд: өнгөрсөн долоо хоногоос ирэх долоо хоног хүртэл.
  const sessions = await getSessionsBetween(weekStart(-1), addDays(weekStart(1), 7))
  const selectedId = search.session ?? sessions.find((s) => s.status === 'scheduled')?.id ?? ''
  const selected = sessions.find((session) => session.id === selectedId) ?? null

  const supabase = await createClient()
  const { data: bookings } = selectedId
    ? await supabase.from('bookings').select('*').eq('session_id', selectedId).order('created_at')
    : { data: [] }

  const userIds = [...new Set((bookings ?? []).map((booking) => booking.user_id))]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('*').in('id', userIds)
    : { data: [] }
  const byUser = indexBy(profiles ?? [], 'id')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Ирц бүртгэл</h1>

      <form className="flex flex-wrap items-end gap-3 card p-5">
        <label className="flex min-w-[18rem] flex-1 flex-col gap-1.5 text-sm">
          <span className="text-muted">Хичээл сонгох</span>
          <Select name="session" defaultValue={selectedId}>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {formatDate(session.starts_at, 'mn')} {formatTime(session.starts_at)} ·{' '}
                {session.classType?.name_mn ?? '—'} ({session.booked_count}/{session.capacity})
              </option>
            ))}
          </Select>
        </label>
        <Button type="submit" variant="secondary">
          Харах
        </Button>
      </form>

      {!selected ? (
        <Empty>Хичээл сонгоно уу.</Empty>
      ) : !bookings || bookings.length === 0 ? (
        <Empty>Энэ хичээлд бүртгүүлсэн хүн алга.</Empty>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Нэр</Th>
              <Th>Утас</Th>
              <Th>Төлөв</Th>
              <Th>Ирц</Th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const profile = byUser.get(booking.user_id)
              return (
                <tr key={booking.id}>
                  <Td>{profile?.full_name ?? '—'}</Td>
                  <Td className="tabular-nums">{profile?.phone ?? '—'}</Td>
                  <Td>
                    <Badge tone={tones[booking.status]}>{labels[booking.status]}</Badge>
                  </Td>
                  <Td>
                    {booking.status !== 'cancelled' && (
                      <div className="flex gap-2">
                        {(['attended', 'no_show'] as const).map((status) => (
                          <form key={status} action={markAttendance}>
                            <input type="hidden" name="booking_id" value={booking.id} />
                            <input type="hidden" name="session_id" value={selectedId} />
                            <input type="hidden" name="status" value={status} />
                            <button
                              type="submit"
                              className={`rounded-lg border px-2.5 py-1 text-xs ${
                                booking.status === status
                                  ? 'border-accent bg-accent-soft text-accent'
                                  : 'border-line hover:bg-surface-2'
                              }`}
                            >
                              {labels[status]}
                            </button>
                          </form>
                        ))}
                      </div>
                    )}
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </TableWrap>
      )}
    </div>
  )
}
