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
  Table,
  Td,
  Textarea,
  Th,
} from '@/components/admin/ui'
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
    <>
      <PageHeader
        title="Багш нар"
        description="Хуваарь дээр багш сонгоход энэ жагсаалт харагдана."
      />

      {search.ok && <Alert tone="good">Хадгалагдлаа.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      <Disclosure summary="Шинэ багш нэмэх">
        <form action={createInstructor} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Танилцуулга (MN)">
              <Textarea name="bio_mn" rows={3} />
            </Field>
            <Field label="Танилцуулга (EN)">
              <Textarea name="bio_en" rows={3} />
            </Field>
          </div>

          <FormActions>
            <Button type="submit" variant="primary">
              Багш нэмэх
            </Button>
          </FormActions>
        </form>
      </Disclosure>

      <Panel title="Бүртгэлтэй багш нар" description={`${instructors.length} багш`} flush>
        {instructors.length === 0 ? (
          <EmptyState icon="users" title="Багш бүртгэгдээгүй" hint="Эхний багшаа дээрээс нэмнэ үү." />
        ) : (
          <Table minWidth={600}>
            <thead>
              <tr>
                <Th>Нэр</Th>
                <Th>Instagram</Th>
                <Th align="right">Төлөв</Th>
              </tr>
            </thead>
            <tbody>
              {instructors.map((instructor) => (
                <tr key={instructor.id}>
                  <Td className="font-medium">{instructor.name}</Td>
                  <Td className="text-foreground-soft" label="Instagram">
                    {instructor.instagram ? `@${instructor.instagram}` : '—'}
                  </Td>
                  <Td align="right">
                    <form action={toggleActive} className="flex justify-end">
                      <input type="hidden" name="table" value="instructors" />
                      <input type="hidden" name="id" value={instructor.id} />
                      <input type="hidden" name="is_active" value={String(!instructor.is_active)} />
                      <input type="hidden" name="back" value="/admin/instructors" />
                      <button
                        type="submit"
                        title={instructor.is_active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}
                        className="rounded-md transition-opacity hover:opacity-70"
                      >
                        <Badge tone={instructor.is_active ? 'good' : 'neutral'}>
                          {instructor.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                        </Badge>
                      </button>
                    </form>
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
