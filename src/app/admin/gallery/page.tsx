import {
  Alert,
  Button,
  EmptyState,
  Field,
  FileInput,
  FormActions,
  Input,
  PageHeader,
  Panel,
} from '@/components/admin/ui'
import { FormDialog } from '@/components/admin/FormDialog'
import { Media } from '@/components/site/media'
import { addGalleryImages, deleteGalleryItem, updateGalleryItem } from '@/actions/admin'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

/* ───────────────────────────────────────────────────────────────────────────
   ГАЛЕРЕЙ

   Урьд нь галерей хоёр аргаар удирдагддаг байв: өгөгдлийн сангийн мөр, эсвэл
   `public/media/gallery/` хавтас руу гараар файл хийх. Хоёр дахь нь
   програмистад хурдан ч ажилтанд боломжгүй — серверийн файлын систем рүү
   хүрэх эрх хэрэггүй байх ёстой.

   Энэ хуудсаас зураг нэмэхэд өгөгдлийн санд мөр үүснэ. Мөр гарсан даруйд
   хавтасны сангийн нөөц ажиллахаа болино (§ marketing/gallery/page.tsx) —
   өөрөөр хэлбэл нэг эх сурвалж руу шилжинэ.
   ─────────────────────────────────────────────────────────────────────── */

export default async function AdminGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  const supabase = await createClient()
  const { data: items } = await supabase.from('gallery_items').select('*').order('sort_order')

  /* Хавтасны нөөц ажиллаж байгаа эсэх — ажилтанд ЯАГААД зураг өөр байгааг
     хэлнэ. Энэ бол хамгийн олон эргэлзээ төрүүлдэг цэг. */
  const photos = (items ?? []).filter((item) => !/\.svg(\?|$)/i.test(item.url))
  const usingFolder = photos.length === 0

  return (
    <>
      <PageHeader
        title="Галерей"
        description="Нийтийн сайтын «Галерей» хуудсанд гарах зургууд."
        actions={
          <FormDialog
            trigger="Зураг нэмэх"
            title="Галерейд зураг нэмэх"
            subtitle="Олон файл нэг дор сонгож болно."
            defaultOpen={Boolean(search.error)}
          >
            <form action={addGalleryImages} className="flex flex-col gap-4">
              <Field label="Зураг" hint="JPG / PNG / WEBP, 5MB хүртэл">
                <FileInput
                  name="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Тайлбар (MN)" hint="Дэлгэц уншигчид зориулсан">
                  <Input name="alt_mn" placeholder="Студид эгнэсэн бүжигчид" />
                </Field>
                <Field label="Тайлбар (EN)">
                  <Input name="alt_en" placeholder="Dancers lined up in the studio" />
                </Field>
              </div>
              <FormActions>
                <Button type="submit" variant="primary">
                  Нэмэх
                </Button>
              </FormActions>
            </form>
          </FormDialog>
        }
      />

      {search.ok && <Alert tone="good">Хадгалагдлаа.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      {usingFolder && (
        <Alert tone="warn">
          Одоо галерей нь <code>public/media/gallery/</code> хавтаснаас уншиж байна. Энд эхний
          зургаа нэмэхэд хавтас ажиллахаа болиод, зөвхөн эдгээр зураг харагдана.
        </Alert>
      )}

      <Panel title="Зургууд" description={`${photos.length} зураг · дарааллаар`}>
        {photos.length === 0 ? (
          <EmptyState
            icon="image"
            title="Өгөгдлийн санд зураг алга"
            hint="Дээрээс нэмэхэд энд гарч ирнэ."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {photos.map((item) => (
              <div key={item.id} className="flex flex-col gap-3">
                <Media src={item.url} alt={item.alt_mn} ratio="aspect-[4/3]" sizes="25vw" />

                <div className="flex items-center justify-between gap-3">
                  <span className="t-meta min-w-0 flex-1 truncate text-muted">
                    {item.alt_mn || 'Тайлбаргүй'}
                  </span>
                  <span className="t-meta shrink-0 tnum text-faint">#{item.sort_order}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <FormDialog trigger="Засах" title="Зураг засах" subtitle={item.alt_mn || undefined}>
                    <form action={updateGalleryItem} className="flex flex-col gap-4">
                      <input type="hidden" name="id" value={item.id} />
                      <Media src={item.url} alt={item.alt_mn} ratio="aspect-[16/9]" sizes="46rem" />
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Тайлбар (MN)">
                          <Input name="alt_mn" defaultValue={item.alt_mn} />
                        </Field>
                        <Field label="Тайлбар (EN)">
                          <Input name="alt_en" defaultValue={item.alt_en} />
                        </Field>
                      </div>
                      <Field label="Дараалал" hint="Бага тоо нь эхэнд гарна">
                        <Input
                          type="number"
                          name="sort_order"
                          defaultValue={item.sort_order}
                          min={0}
                        />
                      </Field>
                      <FormActions>
                        <Button type="submit" variant="primary">
                          Хадгалах
                        </Button>
                      </FormActions>
                    </form>
                  </FormDialog>

                  <form action={deleteGalleryItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <Button type="submit" size="sm" variant="danger">
                      Устгах
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  )
}
