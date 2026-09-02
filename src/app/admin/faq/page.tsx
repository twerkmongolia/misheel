import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Field,
  FormActions,
  Input,
  PageHeader,
  Panel,
  Sub,
  Table,
  Td,
  Textarea,
  Th,
} from '@/components/admin/ui'
import { FormDialog } from '@/components/admin/FormDialog'
import { createFaq, deleteFaq, toggleActive, updateFaq } from '@/actions/admin'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { FaqItem } from '@/lib/supabase/database.types'

/* ───────────────────────────────────────────────────────────────────────────
   ТҮГЭЭМЭЛ АСУУЛТ

   `faq_items` хүснэгтэд удирдлагын хуудас БАЙГААГҮЙ — асуулт нэмэх ганц арга
   нь SQL бичих байв. Гэтэл энэ бол хамгийн олон засагддаг агуулгын нэг:
   үнэ өөрчлөгдөх, дүрэм солигдох бүрд хариулт нь хуучирдаг.
   ─────────────────────────────────────────────────────────────────────── */

/** Нэмэх ба засах формын биет нэг — талбарууд ижил, зөвхөн утга нь өөр. */
function FaqFields({ item }: { item?: FaqItem }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Асуулт (MN)">
          <Input name="question_mn" defaultValue={item?.question_mn} required />
        </Field>
        <Field label="Асуулт (EN)">
          <Input name="question_en" defaultValue={item?.question_en} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Хариулт (MN)" hint="2-3 өгүүлбэр">
          <Textarea name="answer_mn" rows={5} defaultValue={item?.answer_mn} required />
        </Field>
        <Field label="Хариулт (EN)">
          <Textarea name="answer_en" rows={5} defaultValue={item?.answer_en} />
        </Field>
      </div>

      <Field label="Дараалал" hint="Бага тоо нь дээр гарна. Хоосон бол эцэст нь.">
        <Input type="number" name="sort_order" defaultValue={item?.sort_order ?? 0} min={0} />
      </Field>
    </>
  )
}

export default async function AdminFaqPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  const supabase = await createClient()
  const { data: items } = await supabase.from('faq_items').select('*').order('sort_order')

  const live = (items ?? []).filter((item) => item.is_active).length

  return (
    <>
      <PageHeader
        title="Түгээмэл асуулт"
        description={`${items?.length ?? 0} асуулт · ${live} нь нийтийн сайтад харагдаж байна.`}
        actions={
          <FormDialog
            trigger="Шинэ асуулт"
            title="Шинэ асуулт нэмэх"
            subtitle="Хариулт нь тойруу үггүй, 2-3 өгүүлбэр байх нь хамгийн ойлгомжтой."
            defaultOpen={Boolean(search.error)}
          >
            <form action={createFaq} className="flex flex-col gap-4">
              <FaqFields />
              <FormActions>
                <Button type="submit" variant="primary">
                  Асуулт нэмэх
                </Button>
              </FormActions>
            </form>
          </FormDialog>
        }
      />

      {search.ok && <Alert tone="good">Хадгалагдлаа.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      <Panel title="Асуултууд" description="Дарааллаар нь эрэмбэлэгдсэн" flush>
        {!items || items.length === 0 ? (
          <EmptyState icon="info" title="Асуулт алга" hint="Эхний асуултаа дээрээс нэмнэ үү." />
        ) : (
          <Table minWidth={720}>
            <thead>
              <tr>
                <Th align="right">№</Th>
                <Th>Асуулт</Th>
                <Th>Засах</Th>
                <Th align="right">Төлөв</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <Td align="right" className="tnum text-muted">
                    {item.sort_order}
                  </Td>

                  <Td label="Асуулт">
                    <span className="font-medium">{item.question_mn}</span>
                    {/* Хариултын эхлэлийг харуулна — асуулт ганцаараа аль
                        бичлэг болохыг хэлдэг ч, хариулт нь хуучирсан эсэхийг
                        нээлгүйгээр танихад хангалттай. */}
                    <Sub>
                      <span className="block max-w-[46rem] truncate">{item.answer_mn}</span>
                    </Sub>
                  </Td>

                  <Td label="Засах">
                    <div className="flex flex-wrap items-center gap-2">
                      <FormDialog
                        trigger="Засах"
                        title="Асуулт засах"
                        subtitle={item.question_mn}
                      >
                        <form action={updateFaq} className="flex flex-col gap-4">
                          <input type="hidden" name="id" value={item.id} />
                          <FaqFields item={item} />
                          <FormActions>
                            <Button type="submit" variant="primary">
                              Хадгалах
                            </Button>
                          </FormActions>
                        </form>
                      </FormDialog>

                      {/* Устгал нь ЭРГЭХГҮЙ тул зөвхөн нуугдмал бичлэгт.
                          Идэвхтэй асуултыг эхлээд унтраах ёстой — санамсаргүй
                          дарахад нийтийн сайтаас зүйл алга болохгүй. */}
                      {!item.is_active && (
                        <form action={deleteFaq}>
                          <input type="hidden" name="id" value={item.id} />
                          <Button type="submit" size="sm" variant="danger">
                            Устгах
                          </Button>
                        </form>
                      )}
                    </div>
                  </Td>

                  <Td align="right">
                    <form action={toggleActive} className="flex justify-end">
                      <input type="hidden" name="table" value="faq_items" />
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="is_active" value={String(!item.is_active)} />
                      <input type="hidden" name="back" value="/admin/faq" />
                      <button
                        type="submit"
                        title={item.is_active ? 'Нуух' : 'Харуулах'}
                        className="transition-opacity hover:opacity-70"
                      >
                        <Badge tone={item.is_active ? 'good' : 'neutral'}>
                          {item.is_active ? 'Харагдаж байна' : 'Нуугдсан'}
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
