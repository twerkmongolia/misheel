import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Field,
  FileInput,
  FormActions,
  Input,
  Panel,
  PageHeader,
  Table,
  Td,
  Textarea,
  Th,
} from '@/components/admin/ui'
import { FormDialog } from '@/components/admin/FormDialog'
import { createInstructor, updateInstructor, toggleActive } from '@/actions/admin'
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
        actions={
          <FormDialog
            trigger="Шинэ багш"
            title="Шинэ багш нэмэх"
            subtitle="Хуваарь дээр багш сонгоход энэ жагсаалтад гарна."
            defaultOpen={Boolean(search.error)}
          >
            <form action={createInstructor} className="flex flex-col gap-4">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Нэр">
                    <Input name="name" required />
                  </Field>
                  <Field label="Instagram" hint="@-гүйгээр">
                    <Input name="instagram" />
                  </Field>
                </div>

                {/* Урьд нь энд «Зургийн URL» гэсэн текст талбар байсан —
                    ажилтан эхлээд Supabase Storage руу орж файлаа
                    байршуулж, хаягийг нь хуулж авчирч буулгах ёстой байв.
                    Гурван программ, дөрвөн алхам. Одоо төхөөрөмжөөсөө
                    шууд сонгоно. */}
                <Field
                  label="Зураг"
                  hint="Заавал биш · босоо 4:5 тохиромжтой · JPG / PNG / WEBP, 5MB хүртэл"
                >
                  <FileInput name="file" accept="image/jpeg,image/png,image/webp,image/avif" />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
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
          </FormDialog>
        }
      />

      {search.ok && <Alert tone="good">Хадгалагдлаа.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}


      <Panel title="Бүртгэлтэй багш нар" description={`${instructors.length} багш`} flush>
        {instructors.length === 0 ? (
          <EmptyState icon="users" title="Багш бүртгэгдээгүй" hint="Эхний багшаа дээрээс нэмнэ үү." />
        ) : (
          <Table minWidth={600}>
            <thead>
              <tr>
                <Th>Нэр</Th>
                <Th>Instagram</Th>
                <Th>Засах</Th>
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
                  <Td label="Засах">
                    {/* Урьд нь багшийг зөвхөн НЭМЭХ, ИДЭВХГҮЙ болгох л
                        боломжтой байв — нэрэндээ алдаа гаргавал устгаад
                        дахин үүсгэх ёстой. */}
                    <FormDialog
                      trigger="Засах"
                      title={instructor.name}
                      subtitle="Хаяг (slug) хэвээр үлдэнэ — гадны холбоос эвдрэхгүй."
                    >
                      <form action={updateInstructor} className="flex flex-col gap-4">
                        <input type="hidden" name="id" value={instructor.id} />
                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field label="Нэр">
                            <Input name="name" defaultValue={instructor.name} required />
                          </Field>
                          <Field label="Instagram" hint="@-гүйгээр">
                            <Input name="instagram" defaultValue={instructor.instagram ?? ''} />
                          </Field>
                        </div>
                        <Field
                          label="Зураг"
                          hint={
                            instructor.photo_url
                              ? 'Шинийг сонговол хуучин зураг солигдоно'
                              : 'Заавал биш · босоо 4:5 тохиромжтой'
                          }
                        >
                          <FileInput
                            name="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            placeholder={instructor.photo_url ? 'Зураг солих' : 'Зураг сонгох'}
                          />
                        </Field>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field label="Танилцуулга (MN)">
                            <Textarea name="bio_mn" rows={3} defaultValue={instructor.bio_mn} />
                          </Field>
                          <Field label="Танилцуулга (EN)">
                            <Textarea name="bio_en" rows={3} defaultValue={instructor.bio_en} />
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
