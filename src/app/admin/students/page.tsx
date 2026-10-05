import { Alert, Button, EmptyState, Input, Panel, PageHeader } from '@/components/admin/ui'
import {
  StudentTable,
  type StudentEnrollment,
  type StudentRow,
} from '@/components/admin/StudentTable'
import { createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth/dal'
import { listAccountEmails } from '@/lib/auth/accounts'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { nowMs } from '@/lib/format'
import { visibleToAdmin } from '@/lib/admin/payment-outcome'

/* ───────────────────────────────────────────────────────────────────────────
   СУРАГЧИД

   «Хэрэглэгч» хуудас нь БҮРТГҮҮЛСЭН бүх хүнийг харуулна — тэдний ихэнх нь
   зүгээр л данс нээсэн хүмүүс. Энэ хуудас харин МӨНГӨ ТӨЛЖ хичээл авсан
   хүмүүсийг л харуулна: ажилтны өдөр тутмын асуулт («хэн явж байна», «хэн
   төлбөрөө хийгээгүй вэ») тэр хүмүүсийн тухай байдаг.

   Эрх нь энд ОГТ байхгүй — эрх олгох нь «Админ» хуудасны ажил
   (§ admin/access `grantAccess`).
   ───────────────────────────────────────────────────────────────────────── */

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  /* Layout-ын `requireStaff` нь client талын шилжилтэд ДАХИН ажилладаггүй.
     Түүнээс гадна `listAccountEmails()` нь service-role-оор явдаг тул RLS
     энд хамгаалахгүй — шалгалт ЗААВАЛ энэ хуудсанд байна
     (§ lib/auth/accounts.ts). */
  await requireStaff()

  const supabase = await createClient()

  /* Элсэлтийг ажилтан бүхэлд нь уншиж чадна (§ policies `course_enrollments_read`
     нь `is_staff()` -д нээлттэй) тул энгийн хэрэглэгчийн client хангалттай.

     500 мөрийн хязгаар: студийн хэмжээнд энэ нь бүх элсэлтээс хамаагүй их
     бөгөөд хязгааргүй асуулга нь мөр олшрох тусам ЧИМЭЭГҮЙ удааширдаг. */
  const [{ data: enrollments }, { data: courses }, { data: instructors }, { data: profiles }, emails] =
    await Promise.all([
    supabase
      .from('course_enrollments')
      .select('id, user_id, course_id, status, price_paid, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('courses').select('id, name_mn, mode, instructor_id'),
    supabase.from('instructors').select('id, name'),
    supabase.from('profiles').select('id, full_name, phone, created_at'),
    listAccountEmails(),
  ])

  const byCourse = new Map((courses ?? []).map((course) => [course.id, course]))
  const byProfile = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  const byInstructor = new Map((instructors ?? []).map((person) => [person.id, person.name]))

  /* Хүнээр бүлэглэнэ. `enrollments` нь шинэ нь эхэнд эрэмбэлэгдсэн тул
     бүлэг доторх дараалал ч шинээсээ хуучин руу явна — цонхон дотор эхний
     мөр нь хамгийн сүүлд авсан анги болно. `Map` нь оруулсан дарааллаа
     хадгалдаг тул сурагчид ч сүүлд элссэнээрээ эрэмбэлэгдэнэ. */
  const grouped = new Map<string, StudentEnrollment[]>()
  const now = nowMs()

  for (const row of enrollments ?? []) {
    /* Сүүлийн 30 минутын төлбөр хүлээж буй элсэлт — явцад, харуулахгүй;
       түүнээс хуучин нь амжилтгүй (§ lib/admin/payment-outcome.ts). */
    if (!visibleToAdmin(row.status, row.created_at, now)) continue
    const course = byCourse.get(row.course_id)
    const list = grouped.get(row.user_id) ?? []

    list.push({
      id: row.id,
      /* Анги устсан ч элсэлт үлдэж болно — нэрийг нь хоосон орхивол мөр
         юу байсан нь ойлгогдохгүй болно. */
      course: course?.name_mn ?? 'Устсан анги',
      online: course?.mode === 'online',
      /* Багш нь ЗӨВХӨН танхимын ангид утгатай: танхимын анги бүр нэг багшийн
         хичээл, харин онлайн анги нь багшаар салдаггүй нэг л бүтээгдэхүүн.
         Онлайнд багш бичвэл ажилтан «тэр багшийн онлайн анги» гэж байхгүй
         зүйлийг хайна. */
      teacher:
        course?.mode === 'studio' && course.instructor_id
          ? (byInstructor.get(course.instructor_id) ?? null)
          : null,
      status: row.status,
      price_paid: row.price_paid,
      created_at: row.created_at,
    })

    grouped.set(row.user_id, list)
  }

  const students: StudentRow[] = [...grouped.entries()].map(([userId, list]) => {
    const profile = byProfile.get(userId)

    return {
      id: userId,
      name: profile?.full_name ?? null,
      phone: profile?.phone ?? null,
      email: emails.get(userId) ?? null,
      /* Профайл олдоогүй (данс устсан) үед хамгийн хуучин элсэлтийнх нь
         огноог хэрэглэнэ — хоосон нүд нь «огноогүй» гэж худал хэлнэ. */
      created_at: profile?.created_at ?? list[list.length - 1]!.created_at,
      enrollments: list,
    }
  })

  /* Хайлтыг САНАХ ОЙД хийнэ — сурагчид нь аль хэдийн бүлэглэгдэж дууссан
     бөгөөд хүний тоо зуугаар хэмжигдэнэ. Өгөгдлийн сан руу дахин очих нь
     бүлэглэлтээ дахин хийнэ гэсэн үг, тэр нь илүү үнэтэй.

     Утсаар хайхад тоо л таарна; нэрээр хайхад том/жижиг үсэг хамаарахгүй. */
  const term = search.q?.trim().toLowerCase()
  const visible = term
    ? students.filter(
        (student) =>
          (student.name ?? '').toLowerCase().includes(term) ||
          (student.phone ?? '').includes(term),
      )
    : students

  return (
    <>
      <PageHeader
        title="Сурагчид"
        description="Хичээл авсан хүмүүс. Мөр дээр дарж холбоо барих мэдээлэл, авсан бүх ангийг нь харна."
      />

      <Panel
        title="Жагсаалт"
        description={`${visible.length} сурагч`}
        actions={
          <form className="flex items-center gap-1.5">
            <Input
              name="q"
              type="search"
              defaultValue={search.q ?? ''}
              placeholder="Нэр эсвэл утас"
              className="h-8 w-52 text-xs"
            />
            <Button type="submit" size="sm">
              Хайх
            </Button>
          </form>
        }
        flush
      >
        {visible.length === 0 ? (
          <EmptyState
            icon={term ? 'search' : 'users'}
            title={term ? 'Сурагч олдсонгүй' : 'Сурагч алга'}
            hint={
              term
                ? `«${search.q}» гэсэн хайлтад тохирох хүн алга.`
                : 'Хүн анги авмагц энд өөрөө харагдана.'
            }
          />
        ) : (
          <StudentTable students={visible} />
        )}
      </Panel>
    </>
  )
}
