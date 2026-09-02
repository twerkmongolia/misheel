import {
  Alert,
  Button,
  Field,
  FormActions,
  Input,
  PageHeader,
  Panel,
  Textarea,
} from '@/components/admin/ui'
import { updateSiteContent } from '@/actions/admin'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

/* ───────────────────────────────────────────────────────────────────────────
   САЙТЫН АГУУЛГА

   Утас, и-мэйл, хаяг, нүүрний текст, банкны данс, цуцлах хугацаа — эдгээр
   БҮГД `site_content` хүснэгтэд амьдардаг байсан ч удирдлагад засах хуудас
   БАЙГААГҮЙ. Өөрчлөх ганц арга нь SQL бичих — өөрөөр хэлбэл утасны дугаараа
   солихын тулд програмист хэрэгтэй.

   ── Бүтэц ──────────────────────────────────────────────────────────────
   Хүснэгт нь түлхүүр бүрд ХОЁР jsonb багана хадгална: `value_mn`, `value_en`.
   Талбарууд нь түлхүүр бүрд өөр тул энд ЗАРЛАНА — үйлдэл нь формын талбарын
   нэрнээс уншина (§ actions/admin.ts `updateSiteContent`):

     localized: true   → монгол, англи хоёр талбар
     localized: false  → нэг талбар, хоёуланд нь бичигдэнэ

   Утас, Instagram, тоо зэрэг нь хэлнээс хамаардаггүй тул хоёр удаа асуух нь
   зөвхөн алдаа гаргах боломж нэмнэ.
   ─────────────────────────────────────────────────────────────────────── */

type FieldDef = {
  name: string
  label: string
  localized: boolean
  kind?: 'text' | 'textarea' | 'number'
  hint?: string
}

const GROUPS: { key: string; title: string; description: string; fields: FieldDef[] }[] = [
  {
    key: 'contact',
    title: 'Холбоо барих',
    description: 'Хөл, Холбоо барих хуудсанд гарна. Хоосон талбар огт харагдахгүй.',
    fields: [
      { name: 'phone', label: 'Утас', localized: false, hint: '+976 9919 0857' },
      { name: 'email', label: 'И-мэйл', localized: false },
      { name: 'instagram', label: 'Instagram', localized: false, hint: '@-гүйгээр' },
      { name: 'facebook', label: 'Facebook', localized: false, hint: 'Бүтэн холбоос' },
      { name: 'address', label: 'Хаяг', localized: true, kind: 'textarea' },
    ],
  },
  {
    key: 'hero',
    title: 'Нүүрний баатар хэсэг',
    description: 'Хуудас нээгдэхэд хамгийн түрүүнд харагдах текст.',
    fields: [
      { name: 'title', label: 'Гарчиг', localized: true },
      { name: 'subtitle', label: 'Дэд гарчиг', localized: true },
      { name: 'body', label: 'Тайлбар', localized: true, kind: 'textarea' },
      { name: 'cta', label: 'Товчны бичиг', localized: true },
    ],
  },
  {
    key: 'about',
    title: 'Бидний тухай',
    description: 'Тоонууд нүүр болон «Бидний тухай» хуудсанд үзүүлэлт болж гарна.',
    fields: [
      { name: 'title', label: 'Гарчиг', localized: true },
      { name: 'body', label: 'Тайлбар', localized: true, kind: 'textarea' },
      { name: 'stat_students', label: 'Сурагчийн тоо', localized: false, kind: 'number' },
      { name: 'stat_years', label: 'Жил', localized: false, kind: 'number' },
      { name: 'stat_classes', label: '7 хоногийн хичээл', localized: false, kind: 'number' },
    ],
  },
  {
    key: 'videos',
    title: 'Нүүрний бичлэгүүд',
    description: 'YouTube-ийн ID эсвэл бүтэн холбоос буулгаж болно.',
    fields: [
      { name: 'id_1', label: '1-р бичлэг', localized: false, hint: 'u261YyMWm0g' },
      { name: 'title_1', label: '1-р бичлэгийн нэр', localized: true },
      { name: 'id_2', label: '2-р бичлэг', localized: false },
      { name: 'title_2', label: '2-р бичлэгийн нэр', localized: true },
    ],
  },
  {
    key: 'booking',
    title: 'Бүртгэлийн дүрэм',
    description: 'Хичээл эхлэхээс хэдэн цагийн өмнө хүртэл сурагч өөрөө цуцалж болох вэ.',
    fields: [
      {
        name: 'cancel_cutoff_hours',
        label: 'Цуцлах хугацаа (цаг)',
        localized: false,
        kind: 'number',
        hint: 'Түгээмэл асуултад ч энэ тоо бичигдсэн — сольвол тэндээ ч зас',
      },
    ],
  },
  {
    key: 'shop',
    title: 'Дэлгүүр',
    description: 'Захиалга баталгаажуулах хуудсанд харагдана.',
    fields: [
      { name: 'shipping_fee', label: 'Хүргэлтийн төлбөр (₮)', localized: false, kind: 'number' },
      { name: 'bank', label: 'Банкны данс', localized: true, kind: 'textarea' },
    ],
  },
]

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  const supabase = await createClient()
  const { data } = await supabase.from('site_content').select('key, value_mn, value_en')

  const rows = new Map(
    (data ?? []).map((row) => [
      row.key,
      {
        mn: (row.value_mn ?? {}) as Record<string, string | number>,
        en: (row.value_en ?? {}) as Record<string, string | number>,
      },
    ]),
  )

  return (
    <>
      <PageHeader
        title="Сайтын агуулга"
        description="Нийтийн сайтад харагдах текст, холбоо барих мэдээлэл. Хадгалсны дараа шууд шинэчлэгдэнэ."
      />

      {search.ok && <Alert tone="good">Хадгалагдлаа.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      {GROUPS.map((group) => {
        const value = rows.get(group.key) ?? { mn: {}, en: {} }
        const numeric = group.fields
          .filter((field) => field.kind === 'number')
          .map((field) => field.name)
          .join(',')

        return (
          <section key={group.key} id={group.key} className="scroll-mt-24">
            <Panel title={group.title} description={group.description}>
              <form action={updateSiteContent} className="flex flex-col gap-5">
                <input type="hidden" name="key" value={group.key} />
                <input type="hidden" name="numeric" value={numeric} />

                <div className="grid gap-5 sm:grid-cols-2">
                  {group.fields.map((field) => {
                    const Control = field.kind === 'textarea' ? Textarea : Input
                    const type = field.kind === 'number' ? 'number' : 'text'
                    const wide = field.kind === 'textarea' ? 'sm:col-span-2' : ''

                    /* Хэлнээс хамаардаггүй талбар — нэг удаа асууна. Утас,
                       Instagram, тоог хоёр удаа асуух нь зөвхөн зөрүү
                       үүсгэх боломж нэмнэ. */
                    if (!field.localized) {
                      return (
                        <Field
                          key={field.name}
                          label={field.label}
                          hint={field.hint}
                          className={wide}
                        >
                          <Control
                            name={`both__${field.name}`}
                            type={field.kind === 'textarea' ? undefined : type}
                            defaultValue={String(value.mn[field.name] ?? '')}
                          />
                        </Field>
                      )
                    }

                    return (
                      <div key={field.name} className={`grid gap-5 sm:grid-cols-2 sm:col-span-2`}>
                        <Field label={`${field.label} · MN`} hint={field.hint}>
                          <Control
                            name={`mn__${field.name}`}
                            defaultValue={String(value.mn[field.name] ?? '')}
                          />
                        </Field>
                        <Field label={`${field.label} · EN`}>
                          <Control
                            name={`en__${field.name}`}
                            defaultValue={String(value.en[field.name] ?? '')}
                          />
                        </Field>
                      </div>
                    )
                  })}
                </div>

                <FormActions>
                  <Button type="submit" variant="primary">
                    Хадгалах
                  </Button>
                </FormActions>
              </form>
            </Panel>
          </section>
        )
      })}
    </>
  )
}
