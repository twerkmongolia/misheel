import { Alert, Badge, Button, Card, Empty, Field, Input, Section, TableWrap, Td, Th, Textarea } from '@/components/ui'
import { createInstructor, toggleActive } from '@/actions/admin'
import { getInstructors } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export default async function AdminInstructorsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  const instructors = await getInstructors(true)

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Багш нар</h1>

      {search.ok && <Alert tone="good">Хадгалагдлаа.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      <Card>
        <form action={createInstructor} className="flex flex-col gap-4">
          <h2 className="font-semibold">Шинэ багш</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug">
              <Input name="slug" required pattern="[a-z0-9\-]+" />
            </Field>
            <Field label="Нэр">
              <Input name="name" required />
            </Field>
            <Field label="Instagram" hint="@-гүйгээр">
              <Input name="instagram" />
            </Field>
            <Field label="Зургийн URL" hint="Storage-д байршуулсны дараа">
              <Input name="photo_url" />
            </Field>
          </div>

          <Field label="Танилцуулга (MN)">
            <Textarea name="bio_mn" rows={3} />
          </Field>
          <Field label="Танилцуулга (EN)">
            <Textarea name="bio_en" rows={3} />
          </Field>

          <Button type="submit" className="self-start">
            Нэмэх
          </Button>
        </form>
      </Card>

      <Section title="Бүртгэлтэй багш нар">
        {instructors.length === 0 ? (
          <Empty>Одоогоор алга.</Empty>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Нэр</Th>
                <Th>Slug</Th>
                <Th>Instagram</Th>
                <Th>Төлөв</Th>
              </tr>
            </thead>
            <tbody>
              {instructors.map((instructor) => (
                <tr key={instructor.id}>
                  <Td>{instructor.name}</Td>
                  <Td className="font-mono text-xs">{instructor.slug}</Td>
                  <Td>{instructor.instagram ? `@${instructor.instagram}` : '—'}</Td>
                  <Td>
                    <form action={toggleActive}>
                      <input type="hidden" name="table" value="instructors" />
                      <input type="hidden" name="id" value={instructor.id} />
                      <input type="hidden" name="is_active" value={String(!instructor.is_active)} />
                      <input type="hidden" name="back" value="/admin/instructors" />
                      <button type="submit">
                        <Badge tone={instructor.is_active ? 'good' : 'neutral'}>
                          {instructor.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                        </Badge>
                      </button>
                    </form>
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
