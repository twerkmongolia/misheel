import Link from 'next/link'
import {
  Alert,
  Badge,
  Button,
  Disclosure,
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
  Textarea,
  Th,
} from '@/components/admin/ui'
import { FormDialog } from '@/components/admin/FormDialog'
import { cancelSession, createSessions, toggleActive, updateClassType } from '@/actions/admin'
import { formatDate, formatMnt, formatTime, weekStart, addDays } from '@/lib/format'
import { getClassTypes, getInstructors, getLocations, getSessionsBetween } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

const LEVELS: Record<string, string> = {
  beginner: 'Анхан шат',
  intermediate: 'Дунд шат',
  advanced: 'Ахисан шат',
}

function WeekLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex h-8 items-center rounded-lg px-2.5 text-[13px] whitespace-nowrap text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      {children}
    </Link>
  )
}

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

  const range = `${formatDate(from.toISOString(), 'mn')} – ${formatDate(addDays(from, 6).toISOString(), 'mn')}`

  /* Хүлээлгийн жагсаалт — хичээл бүрд хэдэн хүн хүлээж байгаа вэ.
     Суудал цуцлагдахад ажилтан ХЭНД холбогдохоо мэдэх ёстой; тоо нь энэ
     ажил байгаа эсэхийг мөрөөс нь шууд хэлнэ. Нэг асуултаар бүгдийг татаад
     санах ойд бүлэглэнэ — мөр бүрд асуулт явуулах нь долоо хоногийн
     хуваарьт хорь гаруй дуудлага болно. */
  const supabase = await createClient()
  const { data: waitRows } = await supabase
    .from('waitlist')
    .select('session_id')
    .in('session_id', sessions.map((session) => session.id))

  const waiting = new Map<string, number>()
  for (const row of waitRows ?? []) {
    waiting.set(row.session_id, (waiting.get(row.session_id) ?? 0) + 1)
  }

  return (
    <>
      <PageHeader
        title="Хуваарь"
        description="Долоо хоногийн хичээлүүд. Давтагдах цувралыг нэг удаагийн бичлэгээр үүсгэнэ."
        actions={
          <FormDialog
            trigger="Хичээл нэмэх"
            title="Хичээл нэмэх"
            subtitle="Давтагдах цувралыг нэг удаагийн бичлэгээр үүсгэнэ."
            /* Хичээлийн ТӨРӨЛ огт байхгүй бол эхний ажил нь энэ — цонх
               өөрөө нээгдэж, хоосон хуудсанд «одоо юу хийх вэ» гэсэн
               асуулт үлдэхгүй. */
            defaultOpen={classTypes.length === 0 || Boolean(search.error)}
          >
              <form action={createSessions} className="flex flex-col gap-4">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Хичээл" hint="Байхгүй бол «Шинэ хичээл» сонгоно уу">
                    <Select name="class_type_id" required defaultValue={classTypes[0]?.id ?? 'new'}>
                      {classTypes.map((classType) => (
                        <option key={classType.id} value={classType.id}>
                          {classType.name_mn}
                        </option>
                      ))}
                      <option value="new">＋ Шинэ хичээл</option>
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

                {/* «Шинэ хичээл» сонгосон үед л CSS -ээр нээгдэнэ (§ globals.css) */}
                {/* Нэмэлт талбарууд нь дүүргэлттэй хайрцаг биш, ЗҮҮН ШУГАМААР
                    тэмдэглэгдсэн блок — сайтын `Alert` -тай нэг хэл. */}
                <div className="new-class-fields gap-4 border-l-2 border-foreground bg-surface p-5">
                  <p className="t-label text-foreground">
                    Шинэ хичээлийн мэдээлэл
                  </p>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Нэр (MN)" hint="Жишээ: Twerk үндэс">
                      <Input name="new_name_mn" />
                    </Field>
                    <Field label="Нэр (EN)">
                      <Input name="new_name_en" />
                    </Field>
                    <Field label="Түвшин">
                      <Select name="new_level" defaultValue="beginner">
                        <option value="beginner">Анхан шат</option>
                        <option value="intermediate">Дунд шат</option>
                        <option value="advanced">Ахисан шат</option>
                      </Select>
                    </Field>
                    <Field label="Тайлбар (MN)" className="sm:col-span-2 lg:col-span-2">
                      <Textarea name="new_desc_mn" rows={2} />
                    </Field>
                    <Field label="Тайлбар (EN)">
                      <Textarea name="new_desc_en" rows={2} />
                    </Field>
                  </div>

                  <p className="text-xs text-muted">
                    Үргэлжлэх хугацаа, үнийг дээрх талбараас авна. Хаягийн мөрийг нэрнээс автоматаар
                    үүсгэнэ.
                  </p>
                </div>

                <FormActions>
                  <Button type="submit" variant="primary">
                    Хуваарьт нэмэх
                  </Button>
                </FormActions>
              </form>
          </FormDialog>
        }
      />

      {search.ok && <Alert tone="good">Хадгалагдлаа.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}


      <Panel
        title={range}
        description={`${sessions.length} хичээл`}
        actions={
          <div className="flex items-center gap-1">
            <WeekLink href={`/admin/schedule?w=${offset - 1}`}>← Өмнөх</WeekLink>
            {offset !== 0 && <WeekLink href="/admin/schedule">Энэ долоо хоног</WeekLink>}
            <WeekLink href={`/admin/schedule?w=${offset + 1}`}>Дараах →</WeekLink>
          </div>
        }
        flush
      >
        {sessions.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="Энэ долоо хоногт хичээл алга"
            hint="Дээрх «Хичээл нэмэх» хэсгээс үүсгэнэ."
          />
        ) : (
          <Table minWidth={760}>
            <thead>
              <tr>
                <Th>Огноо</Th>
                <Th>Цаг</Th>
                <Th>Хичээл</Th>
                <Th>Багш</Th>
                <Th align="right">Суудал</Th>
                <Th>Төлөв</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <Td className="whitespace-nowrap">{formatDate(session.starts_at, 'mn')}</Td>
                  <Td className="whitespace-nowrap font-medium" label="Цаг">
                    {formatTime(session.starts_at)}–{formatTime(session.ends_at)}
                  </Td>
                  <Td label="Хичээл">{session.classType?.name_mn ?? '—'}</Td>
                  <Td className="text-foreground-soft" label="Багш">{session.instructor?.name ?? '—'}</Td>
                  <Td align="right" label="Суудал">
                    {session.booked_count}/{session.capacity}
                    {/* Хүлээж буй хүн байвал л гарна — тэг нь мэдээлэл биш. */}
                    {(waiting.get(session.id) ?? 0) > 0 && (
                      <Sub>
                        <span className="font-medium text-foreground">
                          +{waiting.get(session.id)} хүлээж байна
                        </span>
                      </Sub>
                    )}
                  </Td>
                  <Td label="Төлөв">
                    {session.status === 'cancelled' ? (
                      <Badge tone="danger">Цуцлагдсан</Badge>
                    ) : (
                      <Badge tone="good">Товлогдсон</Badge>
                    )}
                  </Td>
                  <Td align="right">
                    {session.status !== 'cancelled' && (
                      <form action={cancelSession}>
                        <input type="hidden" name="session_id" value={session.id} />
                        <Button type="submit" variant="danger" size="sm">
                          Цуцлах
                        </Button>
                      </form>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      {/* Хичээлүүд өөрсдөө хуваарийн ХЭРЭГСЭЛ болохоос тусдаа ажлын урсгал биш —
          тиймээс тусдаа цэс биш, энд хумигдсан жагсаалт болж сууна. */}
      {classTypes.length > 0 && (
        <Disclosure summary={`Хичээлүүд (${classTypes.length})`} icon="layers" flush>
          <Table minWidth={560}>
            <thead>
              <tr>
                <Th>Нэр</Th>
                <Th>Түвшин</Th>
                <Th align="right">Хугацаа</Th>
                <Th align="right">Үндсэн үнэ</Th>
                <Th>Засах</Th>
                <Th align="right">Төлөв</Th>
              </tr>
            </thead>
            <tbody>
              {classTypes.map((classType) => (
                <tr key={classType.id}>
                  <Td className="font-medium">{classType.name_mn}</Td>
                  <Td className="text-foreground-soft" label="Түвшин">
                    {LEVELS[classType.level] ?? classType.level}
                  </Td>
                  <Td align="right" className="whitespace-nowrap" label="Хугацаа">
                    {classType.duration_min} мин
                  </Td>
                  <Td align="right" className="whitespace-nowrap" label="Үндсэн үнэ">
                    {formatMnt(classType.base_price)}
                  </Td>
                  <Td label="Засах">
                    <FormDialog
                      trigger="Засах"
                      title={classType.name_mn}
                      subtitle="Үнэ, хугацаа солиход ТОВЛОГДСОН хичээлүүд хөндөгдөхгүй."
                    >
                      <form action={updateClassType} className="flex flex-col gap-4">
                        <input type="hidden" name="id" value={classType.id} />
                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field label="Нэр (MN)">
                            <Input name="name_mn" defaultValue={classType.name_mn} required />
                          </Field>
                          <Field label="Нэр (EN)">
                            <Input name="name_en" defaultValue={classType.name_en} />
                          </Field>
                          <Field label="Түвшин">
                            <Select name="level" defaultValue={classType.level}>
                              <option value="beginner">Анхан шат</option>
                              <option value="intermediate">Дунд шат</option>
                              <option value="advanced">Ахисан шат</option>
                            </Select>
                          </Field>
                          <Field label="Хугацаа (мин)">
                            <Input
                              type="number"
                              name="duration_min"
                              defaultValue={classType.duration_min}
                              min={15}
                              max={240}
                              step={5}
                              required
                            />
                          </Field>
                          <Field
                            label="Үндсэн үнэ (₮)"
                            hint="Шинэ хичээл үүсгэхэд анхдагчаар орно"
                            className="sm:col-span-2"
                          >
                            <Input
                              type="number"
                              name="base_price"
                              defaultValue={classType.base_price}
                              min={0}
                              step={1000}
                              required
                            />
                          </Field>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field label="Тайлбар (MN)">
                            <Textarea name="desc_mn" rows={3} defaultValue={classType.desc_mn} />
                          </Field>
                          <Field label="Тайлбар (EN)">
                            <Textarea name="desc_en" rows={3} defaultValue={classType.desc_en} />
                          </Field>
                        </div>
                        <FormActions>
                          <Button type="submit" variant="primary">
                            Хадгалах
                          </Button>
                        </FormActions>
                      </form>
                    </FormDialog>
                  </Td>
                  <Td align="right">
                    {/* Шошго нь товч — дарахад төлөв солигдоно (§ toggleActive).
                        Идэвхгүй хичээл нийтийн сайтад харагдахгүй. */}
                    <form action={toggleActive} className="flex justify-end">
                      <input type="hidden" name="table" value="class_types" />
                      <input type="hidden" name="id" value={classType.id} />
                      <input type="hidden" name="is_active" value={String(!classType.is_active)} />
                      <input type="hidden" name="back" value="/admin/schedule" />
                      <button
                        type="submit"
                        title={classType.is_active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}
                        className="rounded-md transition-opacity hover:opacity-70"
                      >
                        <Badge tone={classType.is_active ? 'good' : 'neutral'}>
                          {classType.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                        </Badge>
                      </button>
                    </form>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Disclosure>
      )}
    </>
  )
}
