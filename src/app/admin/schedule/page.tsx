import { Alert, Badge, Button, Card, Empty, Field, Input, Section, Select, TableWrap, Td, Th } from '@/components/ui'
import { cancelSession, createSessions } from '@/actions/admin'
import { formatDate, formatTime, weekStart, addDays } from '@/lib/format'
import { getClassTypes, getInstructors, getLocations, getSessionsBetween } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string; ok?: string; error?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  const offset = Math.max(-8, Math.min(12, Number(search.w ?? 0) || 0))
  const from = weekStart(offset)
  const to = addDays(from, 7)

  const [sessions, classTypes, instructors, locations] = await Promise.all([
    getSessionsBetween(from, to),
    getClassTypes(true),
    getInstructors(true),
    getLocations(),
  ])

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Хуваарь</h1>

      {search.ok && <Alert tone="good">Хадгалагдлаа.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      <Card>
        <form action={createSessions} className="flex flex-col gap-4">
          <h2 className="font-semibold">Хичээл нэмэх</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Хичээлийн төрөл">
              <Select name="class_type_id" required>
                {classTypes.map((classType) => (
                  <option key={classType.id} value={classType.id}>
                    {classType.name_mn}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Багш">
              <Select name="instructor_id" defaultValue="">
                <option value="">—</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Байршил">
              <Select name="location_id" defaultValue="">
                <option value="">—</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Эхлэх (УБ цагаар)">
              <Input type="datetime-local" name="starts_at" required />
            </Field>

            <Field label="Үргэлжлэх (мин)">
              <Input type="number" name="duration_min" defaultValue={60} min={15} max={300} required />
            </Field>

            <Field label="Багтаамж">
              <Input type="number" name="capacity" defaultValue={16} min={1} max={200} required />
            </Field>

            <Field label="Үнэ (₮)">
              <Input type="number" name="price" defaultValue={35000} min={0} step={1000} required />
            </Field>

            <Field label="Хэдэн долоо хоног давтах" hint="1 = ганц удаа">
              <Input type="number" name="weeks" defaultValue={1} min={1} max={52} required />
            </Field>

            <Field label="Тэмдэглэл">
              <Input name="note" />
            </Field>
          </div>

          <Button type="submit" className="self-start">
            Нэмэх
          </Button>
        </form>
      </Card>

      <Section
        title={`${formatDate(from.toISOString(), 'mn')} – ${formatDate(addDays(from, 6).toISOString(), 'mn')}`}
        action={
          <div className="flex gap-2 text-sm">
            <a href={`/admin/schedule?w=${offset - 1}`} className="rounded-lg px-3 py-1.5 hover:bg-surface-2">
              ← Өмнөх
            </a>
            <a href={`/admin/schedule?w=${offset + 1}`} className="rounded-lg px-3 py-1.5 hover:bg-surface-2">
              Дараах →
            </a>
          </div>
        }
      >
        {sessions.length === 0 ? (
          <Empty>Энэ долоо хоногт хичээл алга.</Empty>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Огноо</Th>
                <Th>Цаг</Th>
                <Th>Хичээл</Th>
                <Th>Багш</Th>
                <Th>Суудал</Th>
                <Th>Төлөв</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <Td className="tabular-nums">{formatDate(session.starts_at, 'mn')}</Td>
                  <Td className="tabular-nums">
                    {formatTime(session.starts_at)}–{formatTime(session.ends_at)}
                  </Td>
                  <Td>{session.classType?.name_mn ?? '—'}</Td>
                  <Td>{session.instructor?.name ?? '—'}</Td>
                  <Td className="tabular-nums">
                    {session.booked_count}/{session.capacity}
                  </Td>
                  <Td>
                    {session.status === 'cancelled' ? (
                      <Badge tone="danger">Цуцлагдсан</Badge>
                    ) : (
                      <Badge tone="good">Товлогдсон</Badge>
                    )}
                  </Td>
                  <Td>
                    {session.status !== 'cancelled' && (
                      <form action={cancelSession}>
                        <input type="hidden" name="session_id" value={session.id} />
                        <button type="submit" className="text-sm text-danger hover:underline">
                          Цуцлах
                        </button>
                      </form>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Section>
    </div>
  )
}
