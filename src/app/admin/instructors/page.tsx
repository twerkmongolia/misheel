import Image from 'next/image'
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
import { AdminIcon } from '@/components/admin/AdminIcon'
import { createInstructor, updateInstructor, toggleActive } from '@/actions/admin'
import { getInstructors } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { Instructor } from '@/lib/supabase/database.types'

/**
 * Жагсаалтыг засварын талбарт буулгана: нэг зүйл = нэг мөр.
 *
 * `?? []` нь хамгаалалт биш, ДАРААЛЛЫН асуудал: код нь миграциас өмнө
 * нийтлэгдэж болно (`background_mn` багана хараахан байхгүй), тэр үед
 * PostgREST талбарыг огт буцаахгүй. Хоосон талбар харагдах нь админ
 * бүхэлдээ унахаас хамаагүй дээр.
 */
function lines(values: string[] | null | undefined): string {
  return (values ?? []).join('\n')
}

/**
 * Багшийн талбарууд.
 *
 * Нэмэх ба засах форм ЯГ ижил талбартай. Урьд нь хоёр тусдаа хуулбар
 * байсан — таван талбартай үед тэвчиж болно, арван дөрөв болоход шинэ
 * талбарыг аль нэг дээр нь мартах нь цаг хугацааны л асуудал. Нэг эх
 * сурвалж = хоёр форм үргэлж тэнцүү.
 */
function InstructorFields({ instructor }: { instructor?: Instructor }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Нэр">
          <Input name="name" defaultValue={instructor?.name} required />
        </Field>
        <Field label="Instagram" hint="@-гүйгээр. Бүтэн холбоос буулгасан ч болно.">
          <Input name="instagram" defaultValue={instructor?.instagram ?? ''} />
        </Field>
      </div>

      {/* Үүрэг нь нэрийн доор сууж, хөрөг дээр hover хийхэд ГАРЧ ирнэ —
          өөрөөр хэлбэл багшийн тухай хүний уншдаг ХАМГИЙН ЭХНИЙ мөр. */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Үүрэг (MN)" hint="Жишээ: Twerk Mongolia багш · Уран бүтээлч">
          <Input name="role_mn" defaultValue={instructor?.role_mn ?? ''} />
        </Field>
        <Field label="Үүрэг (EN)">
          <Input name="role_en" defaultValue={instructor?.role_en ?? ''} />
        </Field>
      </div>

      {/* Урьд нь энд «Зургийн URL» гэсэн текст талбар байсан — ажилтан
          эхлээд Supabase Storage руу орж файлаа байршуулж, хаягийг нь
          хуулж авчирч буулгах ёстой байв. Гурван программ, дөрвөн алхам.
          Одоо төхөөрөмжөөсөө шууд сонгоно. */}
      <Field
        label="Зураг"
        hint={
          instructor?.photo_url
            ? 'Шинийг сонговол хуучин зураг солигдоно'
            : 'Заавал биш · босоо 4:5 тохиромжтой · JPG / PNG / WEBP, 4MB хүртэл'
        }
      >
        <FileInput
          name="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          placeholder={instructor?.photo_url ? 'Зураг солих' : 'Зураг сонгох'}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Танилцуулга (MN)">
          <Textarea name="bio_mn" rows={4} defaultValue={instructor?.bio_mn} />
        </Field>
        <Field label="Танилцуулга (EN)">
          <Textarea name="bio_en" rows={4} defaultValue={instructor?.bio_en} />
        </Field>
      </div>

      {/* ── Жагсаалтууд ────────────────────────────────────────────────
          Гурвуулаа НЭГ дүрэмтэй: мөр бүр нэг зүйл. Таслалаар салгах
          боломжгүй — «Эдийн засагч — Санкт-Петербургт төгссөн, Oil & Gas»
          гэсэн мөрөнд таслал өөрөө агуулагдана. */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Мэргэжлийн намтар (MN)" hint="Мөр бүр — нэг зүйл">
          <Textarea name="background_mn" rows={6} defaultValue={lines(instructor?.background_mn)} />
        </Field>
        <Field label="Мэргэжлийн намтар (EN)" hint="Мөр бүр — нэг зүйл">
          <Textarea name="background_en" rows={6} defaultValue={lines(instructor?.background_en)} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Заадаг чиглэл (MN)" hint="Мөр бүр — нэг шошго">
          <Textarea name="expertise_mn" rows={4} defaultValue={lines(instructor?.expertise_mn)} />
        </Field>
        <Field label="Заадаг чиглэл (EN)" hint="Мөр бүр — нэг шошго">
          <Textarea name="expertise_en" rows={4} defaultValue={lines(instructor?.expertise_en)} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Хэл (MN)" hint="Мөр бүр — нэг хэл">
          <Textarea name="languages_mn" rows={3} defaultValue={lines(instructor?.languages_mn)} />
        </Field>
        <Field label="Хэл (EN)" hint="Мөр бүр — нэг хэл">
          <Textarea name="languages_en" rows={3} defaultValue={lines(instructor?.languages_en)} />
        </Field>
      </div>

      {/* Хоосон орхивол хуудсан дээр огт гарахгүй. `0` гэж бичих нь
          «тэг жил» гэсэн худал баримт болно. */}
      <Field label="Twerk Mongolia-д (жил)" hint="Мэдэхгүй бол хоосон орхино">
        <Input
          name="years"
          type="number"
          min={1}
          max={99}
          inputMode="numeric"
          defaultValue={instructor?.years ?? ''}
          className="sm:max-w-40"
        />
      </Field>
    </>
  )
}

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
              <InstructorFields />
              <FormActions sticky>
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
          <Table minWidth={680}>
            <thead>
              <tr>
                <Th />
                <Th>Нэр</Th>
                <Th>Instagram</Th>
                <Th>Засах</Th>
                <Th align="right">Төлөв</Th>
              </tr>
            </thead>
            <tbody>
              {instructors.map((instructor) => (
                <tr key={instructor.id}>
                  {/* Хөрөг нь ЗАЙ эзэлсэн хэвээр байна — зураггүй багш дээр
                      хоосон хүрээ үлдэж, «энд зураг дутуу» гэдгийг жагсаалт
                      өөрөө хэлнэ. Багана нэргүй: агуулга нь өөрөө тайлбар. */}
                  <Td className="w-16">
                    <span className="relative grid h-14 w-11 place-items-center overflow-hidden rounded-md border border-line bg-surface-2">
                      {instructor.photo_url ? (
                        <Image
                          src={instructor.photo_url}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <AdminIcon name="image" className="h-4 w-4 text-faint" />
                      )}
                    </span>
                  </Td>
                  <Td className="font-medium">
                    {instructor.name}
                    {/* Үүрэг нь нэрийг ТАНИУЛНА: ижил төстэй нэр хоёр
                        мөрөнд зэрэгцэхэд «аль нь вэ» гэдгийг ганцхан
                        нэр хэлж чадахгүй. */}
                    {instructor.role_mn && (
                      <span className="t-meta mt-0.5 block text-faint">{instructor.role_mn}</span>
                    )}
                  </Td>
                  <Td className="text-foreground-soft" label="Instagram">
                    {instructor.instagram ? `@${instructor.instagram}` : '—'}
                  </Td>
                  <Td label="Засах">
                    {/* Урьд нь багшийг зөвхөн НЭМЭХ, ИДЭВХГҮЙ болгох л
                        боломжтой байв — нэрэндээ алдаа гаргавал устгаад
                        дахин үүсгэх ёстой. */}
                    <FormDialog
                      trigger="Засах"
                      icon="pencil"
                      rowTrigger
                      title={instructor.name}
                      subtitle="Хаяг (slug) хэвээр үлдэнэ — гадны холбоос эвдрэхгүй."
                    >
                      <form action={updateInstructor} className="flex flex-col gap-4">
                        <input type="hidden" name="id" value={instructor.id} />
                        <InstructorFields instructor={instructor} />
                        <FormActions sticky>
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
