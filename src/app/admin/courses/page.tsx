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
  Textarea,
  Th,
} from '@/components/admin/ui'
import { FormDialog } from '@/components/admin/FormDialog'
import { FileInput } from '@/components/admin/FileInput'
import { AdminIcon } from '@/components/admin/AdminIcon'
import { createCourse, updateCourse, deleteCourse } from '@/actions/admin'
import { formatDate, formatMnt, toLocalInput } from '@/lib/format'
import { getCourses, getInstructors, getLocations, indexBy } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { Course, CourseAccess, EnrollmentStatus } from '@/lib/supabase/database.types'
import { EnrollmentDialog, type EnrollmentRow } from './EnrollmentDialog'

/* ───────────────────────────────────────────────────────────────────────────
   АНГИ, КУРС

   Танхим ба онлайн НЭГ хуудсанд. Ажилтны хувьд эдгээр нь нэг ажлын урсгал:
   «ямар анги зарж байна, хэн элссэн бэ». Хоёр хуудас болговол элсэгчийн
   тоог харахын тулд хоёр газар харах ёстой болно.

   Форм нь горимоос хамааран талбараа СОЛИНО (§ globals.css
   `.course-studio-only`) — танхимд байршил, суудал, огноо; онлайнд
   Telegram бүлэг. Хоёуланг зэрэг харуулах нь ажилтнаас «энэ надад
   хамаатай юу» гэж бодохыг шаардана.
   ─────────────────────────────────────────────────────────────────────── */

const modeLabel = { studio: 'Танхим', online: 'Онлайн' } as const
const levelLabel = { beginner: 'Анхан', intermediate: 'Дунд', advanced: 'Ахисан' } as const

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; open?: string; mode?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  /* Зурвасын хоёр цэг нэг хуудас руу хөтөлдөг — ялгаа нь энэ шүүлтүүр.
     Шүүлтүүр байхгүй бол (үйлдлийн дараах `?ok=1` гэх мэт) бүгдийг
     харуулна: ажилтныг хоосон дэлгэц рүү хаях нь алдаа. */
  const mode: 'studio' | 'online' | null =
    search.mode === 'studio' || search.mode === 'online' ? search.mode : null

  const supabase = await createClient()
  const [all, instructors, locations] = await Promise.all([
    getCourses({ includeInactive: true }),
    getInstructors(true),
    getLocations(),
  ])

  const courses = mode ? all.filter((course) => course.mode === mode) : all

  /* Telegram холбоос ба элсэгчдийг НЭГ дор татна — курс бүрд нэг асуулга
     хийвэл арван ангитай студид хорин дараалсан дуудлага үүснэ. */
  const ids = all.map((course) => course.id)
  const [{ data: access }, { data: enrollments }] = await Promise.all([
    ids.length ? supabase.from('course_access').select('*').in('course_id', ids) : { data: [] },
    ids.length
      ? supabase
          .from('course_enrollments')
          .select('*')
          .in('course_id', ids)
          .order('created_at', { ascending: false })
      : { data: [] },
  ])

  const accessById = indexBy((access ?? []) as CourseAccess[], 'course_id')

  /* Элсэгчийн НЭР нь `profiles` дээр. `course_enrollments` -тэй join хийхийн
     оронд тусад нь татна: RLS нь join бүрд дахин үнэлэгддэг тул нэг том
     `in (...)` асуулга хамаагүй хямд. */
  const userIds = [...new Set((enrollments ?? []).map((row) => row.user_id))]
  const { data: people } = userIds.length
    ? await supabase.from('profiles').select('id, full_name, phone').in('id', userIds)
    : { data: [] as { id: string; full_name: string | null; phone: string | null }[] }
  const byUser = indexBy(people ?? [], 'id')

  const rowsByCourse = new Map<string, EnrollmentRow[]>()
  for (const row of enrollments ?? []) {
    const person = byUser.get(row.user_id)
    const list = rowsByCourse.get(row.course_id) ?? []
    list.push({
      id: row.id,
      name: person?.full_name ?? 'Нэргүй',
      phone: person?.phone ?? '',
      status: row.status,
      pricePaid: row.price_paid,
      createdAt: row.created_at,
    })
    rowsByCourse.set(row.course_id, list)
  }

  const live = (status: EnrollmentStatus) => status !== 'cancelled'

  return (
    <>
      <PageHeader
        title={
          mode === 'studio' ? 'Танхимын анги' : mode === 'online' ? 'Онлайн анги' : 'Анги, курс'
        }
        description={
          mode === 'online'
            ? 'Telegram бүлгээр хүргэгддэг анги. Холбоос нь ЗӨВХӨН төлбөрөө төлсөн элсэгчид харагдана.'
            : mode === 'studio'
              ? 'Заалд явагдах бүтэн хөтөлбөр — суудлын тоо, эхлэх огноотой.'
              : 'Танхимын элсэлт ба онлайн анги.'
        }
        actions={
          <FormDialog
            trigger={mode === 'online' ? 'Шинэ онлайн анги' : 'Шинэ анги'}
            title="Шинэ анги нэмэх"
            subtitle="Горимоо сонгоход тохирох талбарууд гарч ирнэ."
            defaultOpen={Boolean(search.error)}
          >
            {/* Шүүлтүүрээс горимыг нь УРЬДЧИЛЖ сонгоно: «Онлайн анги»
                хуудсан дээр «Шинэ анги» дарсан хүн онлайн анги үүсгэх гэж
                байгаа нь тодорхой. Сонголт нь харагдсаар байх тул андуурч
                сонгосон бол засна. */}
            <CourseForm
              action={createCourse}
              defaultMode={mode ?? 'studio'}
              instructors={instructors}
              locations={locations}
              submitLabel="Анги нэмэх"
            />
          </FormDialog>
        }
      />

      {search.ok && <Alert tone="good">Хадгалагдлаа.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      <Panel
        title={mode ? 'Жагсаалт' : 'Бүх анги'}
        description={`${courses.length} анги`}
        flush
      >
        {courses.length === 0 ? (
          <EmptyState
            icon={mode === 'online' ? 'globe' : 'layers'}
            title={
              mode === 'online'
                ? 'Онлайн анги бүртгэгдээгүй'
                : mode === 'studio'
                  ? 'Танхимын анги бүртгэгдээгүй'
                  : 'Анги бүртгэгдээгүй'
            }
            hint={
              mode === 'online'
                ? 'Эхний онлайн ангиа дээрээс нэмнэ үү. Telegram бүлгээ урьдчилж үүсгэсэн байвал холбоосыг нь тэр дороо буулгана.'
                : 'Эхний ангиа дээрээс нэмнэ үү.'
            }
          />
        ) : (
          <Table minWidth={900}>
            <thead>
              <tr>
                <Th>Анги</Th>
                {/* Шүүсэн үед энэ багана мөр бүрд ижил утга давтана —
                    мэдээлэл биш, зүгээр л өргөн. */}
                {!mode && <Th>Горим</Th>}
                <Th align="right">Үнэ</Th>
                <Th align="right">Элсэгч</Th>
                <Th>Элсэлт</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const rows = rowsByCourse.get(course.id) ?? []
                const liveCount = rows.filter((row) => live(row.status)).length
                const pending = rows.filter((row) => row.status === 'pending_payment').length
                const online = course.mode === 'online'
                const telegram = accessById.get(course.id)?.telegram_url ?? ''

                return (
                  <tr key={course.id} className={course.is_active ? undefined : 'opacity-55'}>
                    <Td>
                      <span className="font-medium">{course.name_mn}</span>
                      <Sub>
                        {[
                          levelLabel[course.level],
                          course.starts_on
                            ? formatDate(`${course.starts_on}T00:00:00+08:00`, 'mn')
                            : course.schedule_mn || null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Sub>
                      {/* Telegram холбоосгүй онлайн анги = зарагдаж байгаа
                          атлаа хүргэж чадахгүй бүтээгдэхүүн. Хамгийн үнэтэй
                          алдаа тул ангийн нэрийн ЯГ доор хашгирна — «Горим»
                          багана шүүсэн үед алга болдог тул тэнд байж
                          болохгүй. */}
                      {online && !telegram && (
                        <Sub>
                          <span className="font-medium text-warn">Telegram холбоос алга</span>
                        </Sub>
                      )}
                    </Td>

                    {!mode && (
                      <Td label="Горим">
                        <Badge tone={online ? 'info' : 'neutral'}>{modeLabel[course.mode]}</Badge>
                      </Td>
                    )}

                    <Td align="right" className="font-medium whitespace-nowrap" label="Үнэ">
                      {course.price === 0 ? 'Үнэгүй' : formatMnt(course.price)}
                    </Td>

                    <Td align="right" label="Элсэгч">
                      <span className="tnum">
                        {liveCount}
                        {course.capacity !== null && `/${course.capacity}`}
                      </span>
                      {pending > 0 && (
                        <Sub>
                          <span className="text-warn">{pending} төлбөр хүлээж буй</span>
                        </Sub>
                      )}
                    </Td>

                    <Td label="Элсэлт">
                      {course.enrollOpen ? (
                        <Badge tone="good">Нээлттэй</Badge>
                      ) : (
                        <Badge tone="neutral">
                          {
                            {
                              inactive: 'Идэвхгүй',
                              not_open: 'Эхлээгүй',
                              closed: 'Хаагдсан',
                              started: 'Эхэлсэн',
                              full: 'Дүүрсэн',
                            }[course.closedReason ?? 'inactive']
                          }
                        </Badge>
                      )}
                    </Td>

                    <Td align="right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <EnrollmentDialog course={course.name_mn} mode={course.mode} rows={rows} />

                        <FormDialog
                          trigger="Засах"
                          title={course.name_mn}
                          subtitle="Хаяг (slug) хэвээр үлдэнэ — гадны холбоос эвдрэхгүй."
                          defaultOpen={search.open === course.id}
                        >
                          <CourseForm
                            action={updateCourse}
                            course={course}
                            access={accessById.get(course.id) ?? null}
                            instructors={instructors}
                            locations={locations}
                            submitLabel="Хадгалах"
                            onDelete={rows.length === 0}
                          />
                        </FormDialog>
                      </div>
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

/**
 * Курсын форм — НЭМЭХ ба ЗАСАХ хоёуланд.
 *
 * Нэг форм хоёр үйлдэлд: талбарын жагсаалт хоёр газар давхардвал нэгд нь
 * шинэ талбар нэмэхээ мартаж, «засахад алга болдог утга» гэсэн алдаа
 * төрдөг. Ялгаа нь зөвхөн `action`, нуугдмал `id`, товчны бичиг.
 */
function CourseForm({
  action,
  course,
  access,
  defaultMode = 'studio',
  instructors,
  locations,
  submitLabel,
  onDelete = false,
}: {
  action: (formData: FormData) => Promise<void>
  course?: Course
  access?: CourseAccess | null
  /** ШИНЭ анги үүсгэхэд урьдчилж сонгогдох горим — жагсаалтын шүүлтүүрээс. */
  defaultMode?: 'studio' | 'online'
  instructors: { id: string; name: string }[]
  locations: { id: string; name: string }[]
  submitLabel: string
  /** Устгах товч гарах эсэх — зөвхөн элсэгчгүй ангид. */
  onDelete?: boolean
}) {
  return (
    <>
      <form action={action} className="flex flex-col gap-5">
        {course && <input type="hidden" name="id" value={course.id} />}

        {/* Горим нь ХАМГИЙН ЭХЭНД: доорх талбарууд түүнээс хамаарч
            солигдоно, тиймээс сонголт нь өөрчлөлтөөсөө өмнө байх ёстой. */}
        <Field label="Горим" hint="Танхим = суудалтай, огноотой · Онлайн = Telegram бүлэг">
          <Select name="mode" defaultValue={course?.mode ?? defaultMode}>
            <option value="studio">Танхимын курс</option>
            <option value="online">Онлайн анги</option>
          </Select>
        </Field>

        {/* ЗААВАЛ бөглөх ганц талбар. Хаяг (slug) нь эндээс өөрөө үүснэ —
            ажилтнаас кирилл нэрнээс латин хаяг зохиохыг шаардахгүй
            (§ actions/admin.ts `uniqueSlug`). */}
        <Field label="Нэр" hint="Жагсаалт, хуудасны гарчигт гарна">
          <Input name="name_mn" defaultValue={course?.name_mn ?? ''} required autoFocus />
        </Field>

        <Field label="Товч" hint="Жагсаалтын карт дээр гарна — нэг өгүүлбэр">
          <Textarea name="summary_mn" rows={2} defaultValue={course?.summary_mn ?? ''} />
        </Field>

        <Field label="Дэлгэрэнгүй" hint="Мөр таслалт хэвээрээ харагдана">
          <Textarea name="desc_mn" rows={5} defaultValue={course?.desc_mn ?? ''} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Түвшин">
            <Select name="level" defaultValue={course?.level ?? 'beginner'}>
              <option value="beginner">Анхан</option>
              <option value="intermediate">Дунд</option>
              <option value="advanced">Ахисан</option>
            </Select>
          </Field>
          <Field label="Төлбөр (₮)" hint="0 = үнэгүй, шууд нээгдэнэ">
            <Input type="number" name="price" min={0} defaultValue={course?.price ?? 0} />
          </Field>
          <Field label="Хичээлийн тоо" hint="0 бол харагдахгүй">
            <Input
              type="number"
              name="lesson_count"
              min={0}
              defaultValue={course?.lesson_count ?? 0}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Багш">
            <Select name="instructor_id" defaultValue={course?.instructor_id ?? ''}>
              <option value="">— сонгоогүй —</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </Select>
          </Field>
          {/* Хаяг биш ФАЙЛ. Урьд нь URL асуудаг байсан нь ажилтнаас Storage
              руу орж байршуулаад хаягийг нь хуулж ирэхийг шаарддаг байв —
              гурван программ, дөрвөн алхам (§ багшийн форм). */}
          <Field
            label="Нүүр зураг"
            hint={
              course?.cover_url
                ? 'Заавал биш · шинэ файл сонгосон үед л солигдоно'
                : 'Заавал биш · хэвтээ 4:3 тохиромжтой · JPG / PNG / WEBP, 5MB хүртэл'
            }
          >
            <FileInput name="file" accept="image/jpeg,image/png,image/webp,image/avif" />
          </Field>
        </div>

        <Field label="Хуваарийн тэмдэглэл" hint="«Мяг, Пү 19:00» эсвэл «Өөрийн хэмнэлээр»">
          <Input name="schedule_mn" defaultValue={course?.schedule_mn ?? ''} />
        </Field>

        {/* ── Зөвхөн танхим ────────────────────────────────────────────── */}
        <fieldset className="course-studio-only gap-5 border-t border-line pt-5">
          <legend className="t-label px-1 text-faint">Танхим</legend>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Байршил">
              <Select name="location_id" defaultValue={course?.location_id ?? ''}>
                <option value="">— сонгоогүй —</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Суудлын тоо" hint="Хоосон = хязгааргүй">
              <Input type="number" name="capacity" min={1} defaultValue={course?.capacity ?? ''} />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Эхлэх өдөр" hint="Энэ өдөр өнгөрмөгц элсэлт өөрөө хаагдана">
              <Input type="date" name="starts_on" defaultValue={course?.starts_on ?? ''} />
            </Field>
            <Field label="Дуусах өдөр">
              <Input type="date" name="ends_on" defaultValue={course?.ends_on ?? ''} />
            </Field>
          </div>
        </fieldset>

        {/* ── Зөвхөн онлайн ────────────────────────────────────────────── */}
        <fieldset className="course-online-only gap-5 border-t border-line pt-5">
          <legend className="t-label px-1 text-faint">Онлайн</legend>

          <Field
            label="Telegram урилгын холбоос"
            hint="t.me/+… · ЗӨВХӨН төлбөрөө төлсөн элсэгчид харагдана"
          >
            <Input
              name="telegram_url"
              type="url"
              inputMode="url"
              placeholder="https://t.me/+AbCdEf123"
              defaultValue={access?.telegram_url ?? ''}
            />
          </Field>

          <Field label="Нэмэлт заавар" hint="Элсэгчид Telegram товчны доор харагдана">
            <Textarea name="access_note_mn" rows={2} defaultValue={access?.note_mn ?? ''} />
          </Field>
        </fieldset>

        {/* ── Элсэлтийн цонх ───────────────────────────────────────────── */}
        <fieldset className="grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
          <legend className="t-label px-1 text-faint">Элсэлтийн хугацаа</legend>
          <Field label="Нээгдэх (УБ цагаар)" hint="Хоосон = одооноос">
            <Input
              type="datetime-local"
              name="enroll_opens_at"
              defaultValue={toLocalInput(course?.enroll_opens_at ?? null)}
            />
          </Field>
          <Field label="Хаагдах (УБ цагаар)" hint="Хоосон = хязгааргүй">
            <Input
              type="datetime-local"
              name="enroll_closes_at"
              defaultValue={toLocalInput(course?.enroll_closes_at ?? null)}
            />
          </Field>
        </fieldset>

        {/* ── Англи хувилбар ───────────────────────────────────────────────
            ЭВХЭГДСЭН. Англи талбар нь бүгд заавал биш: хоосон бол сайт
            монголоороо гардаг (§ lib/i18n `loc`). Гэтэл задгай байхад тэд
            формын талыг эзэлж, ажилтан бүгдийг бөглөх ёстой мэт мэдрэгддэг
            байв. Одоо хэрэгтэй нэг л газраа, нэг дарахад нээгдэнэ. */}
        <details className="admin-card group overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[var(--r)] border border-line transition-transform duration-200 group-open:rotate-45">
              <AdminIcon name="plus" className="h-3.5 w-3.5" />
            </span>
            Англи хувилбар
            <span className="t-meta ml-auto text-faint">заавал биш</span>
          </summary>

          <div className="flex flex-col gap-5 border-t border-line p-4">
            <Field label="Name (EN)">
              <Input name="name_en" defaultValue={course?.name_en ?? ''} />
            </Field>
            <Field label="Summary (EN)">
              <Textarea name="summary_en" rows={2} defaultValue={course?.summary_en ?? ''} />
            </Field>
            <Field label="Description (EN)">
              <Textarea name="desc_en" rows={4} defaultValue={course?.desc_en ?? ''} />
            </Field>
            <Field label="Schedule (EN)">
              <Input name="schedule_en" defaultValue={course?.schedule_en ?? ''} />
            </Field>
            <Field label="Telegram note (EN)">
              <Textarea name="access_note_en" rows={2} defaultValue={access?.note_en ?? ''} />
            </Field>
          </div>
        </details>

        <div className="grid items-end gap-5 border-t border-line pt-5 sm:grid-cols-2">
          <Field label="Эрэмбэ" hint="Бага тоо нь эхэнд">
            <Input type="number" name="sort_order" min={0} defaultValue={course?.sort_order ?? 0} />
          </Field>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={course?.is_active ?? true}
              className="h-4 w-4"
            />
            Идэвхтэй — нийтийн сайтад харагдана
          </label>
        </div>

        {/* Наалдмал: энэ форм 20 талбартай тул бөглөж дуусаад товч хайж
            доош гүйлгэх шаардлагагүй байх ёстой. */}
        <FormActions sticky>
          <Button type="submit" variant="primary">
            {submitLabel}
          </Button>
        </FormActions>
      </form>

      {/* Устгах нь ТУСДАА форм: HTML дотор форм үүрлэж болохгүй бөгөөд
          хоёр өөр үйлдлийг нэг товчны дор нуух нь санамсаргүй устгал
          үүсгэнэ. Элсэгчтэй ангид энэ товч огт гарахгүй — өгөгдлийн сан
          хориглох ч ажилтанд хийж чадахгүй үйлдлийг санал болгох нь өөрөө
          алдаа. */}
      {course && onDelete && (
        <form action={deleteCourse} className="mt-5 border-t border-line pt-5">
          <input type="hidden" name="id" value={course.id} />
          {/* Устгасны дараа ЯМАР жагсаалт руу буцахыг хэлнэ — курс устсан
              хойно горимыг нь асуух газар үлдэхгүй. */}
          <input type="hidden" name="mode" value={course.mode} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="t-meta text-muted">
              Элсэгчгүй тул устгаж болно. Элсэгчтэй болсны дараа зөвхөн идэвхгүй болгоно.
            </p>
            <Button type="submit" variant="danger" size="sm">
              Устгах
            </Button>
          </div>
        </form>
      )}
    </>
  )
}
