import { Alert, Button, EmptyState, Input, Panel, PageHeader } from '@/components/admin/ui'
import { BuyerTable, type BuyerOrder, type BuyerRow } from '@/components/admin/BuyerTable'
import { createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth/dal'
import { listAccountEmails } from '@/lib/auth/accounts'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { nowMs } from '@/lib/format'
import { visibleToAdmin } from '@/lib/admin/payment-outcome'

/* ───────────────────────────────────────────────────────────────────────────
   ХУДАЛДАН АВАГЧИД

   Гурван жагсаалт, гурван өөр асуулт:
     · «Хэрэглэгч»       — бүртгүүлсэн БҮХ хүн (ихэнх нь зүгээр данс нээсэн)
     · «Сурагчид»        — анги (танхим, онлайн) авсан хүмүүс
     · «Худалдан авагч»  — дэлгүүрээс БАРАА авсан хүмүүс (энэ хуудас)

   Ажилтны асуулт нь хүнээр эхэлдэг — «энэ хүн юу авсан, хаашаа хүргэх вэ» —
   тиймээс захиалга биш ХҮН нэг мөр, авсан бараа нь цонхон дотор. Захиалгын
   ажил (бэлтгэх, илгээх) нь «Захиалга» хуудсанд хэвээр.

   Барааны захиалга = `course_id`-гүй мөртэй захиалга. Ангийн захиалга
   (`enroll_course` үүсгэдэг) нь «Сурагчид»-д харагдана, энд холилдохгүй.
   ─────────────────────────────────────────────────────────────────────── */

export default async function AdminBuyersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  /* `listAccountEmails()` нь service-role-оор явдаг тул RLS энд хамгаалахгүй —
     шалгалт ЗААВАЛ энэ хуудсанд (§ admin/students ижил шалтгаан). */
  await requireStaff()

  const supabase = await createClient()

  /* Студийн хэмжээнд 1000 захиалга, 5000 мөр нь бүх түүхээс хамаагүй их;
     хязгааргүй асуулга мөр олшрох тусам ЧИМЭЭГҮЙ удааширна. */
  const [{ data: orders }, { data: items }, { data: profiles }, emails] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, order_no, user_id, status, total, ship_name, ship_phone, ship_district, ship_khoroo, ship_address, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase
      .from('order_items')
      .select('id, order_id, name_snapshot, variant_snapshot, unit_price, qty')
      .is('course_id', null)
      .limit(5000),
    supabase.from('profiles').select('id, full_name, phone, created_at'),
    listAccountEmails(),
  ])

  const itemsByOrder = new Map<string, BuyerOrder['items']>()
  for (const item of items ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? []
    list.push({
      id: item.id,
      name: item.name_snapshot,
      variant: item.variant_snapshot ?? null,
      qty: item.qty,
      unit_price: item.unit_price,
    })
    itemsByOrder.set(item.order_id, list)
  }

  const byProfile = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  /* Хүнээр бүлэглэнэ. `orders` нь шинэ нь эхэнд тул бүлгийн эхний захиалга нь
     хамгийн сүүлийнх — нэр, хаягийг түүнээс авна: хүн хаягаа сольсон бол
     дараагийн илгээмж ШИНЭ хаяг руу явах ёстой. */
  const grouped = new Map<string, BuyerOrder[]>()
  const latest = new Map<string, NonNullable<typeof orders>[number]>()
  const now = nowMs()

  for (const order of orders ?? []) {
    // Явцад буй төлбөр харагдахгүй, хуучин нь амжилтгүй (§ payment-outcome.ts).
    if (!visibleToAdmin(order.status, order.created_at, now)) continue
    const products = itemsByOrder.get(order.id)
    // Барааны мөргүй захиалга бол анги — энэ жагсаалтынх биш.
    if (!products?.length) continue

    const list = grouped.get(order.user_id) ?? []
    list.push({
      id: order.id,
      order_no: order.order_no,
      status: order.status,
      total: order.total,
      created_at: order.created_at,
      items: products,
    })
    grouped.set(order.user_id, list)
    if (!latest.has(order.user_id)) latest.set(order.user_id, order)
  }

  const buyers: BuyerRow[] = [...grouped.entries()].map(([userId, list]) => {
    const profile = byProfile.get(userId)
    const last = latest.get(userId)!

    return {
      id: userId,
      name: profile?.full_name || last.ship_name || null,
      phone: profile?.phone || last.ship_phone || null,
      email: emails.get(userId) ?? null,
      address: [last.ship_district, last.ship_khoroo, last.ship_address].filter(Boolean).join(', ') || null,
      registered_at: profile?.created_at ?? null,
      orders: list,
    }
  })

  /* Хайлтыг САНАХ ОЙД (§ admin/students): хүмүүс аль хэдийн бүлэглэгдсэн. */
  const term = search.q?.trim().toLowerCase()
  const visible = term
    ? buyers.filter(
        (buyer) =>
          (buyer.name ?? '').toLowerCase().includes(term) || (buyer.phone ?? '').includes(term),
      )
    : buyers

  return (
    <>
      <PageHeader
        title="Худалдан авагчид"
        description="Дэлгүүрээс бараа авсан хүмүүс. Мөр дээр дарж холбоо барих мэдээлэл, хаяг, авсан бүх барааг нь огноотой нь харна."
      />

      <Panel
        title="Жагсаалт"
        description={`${visible.length} худалдан авагч`}
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
            title={term ? 'Худалдан авагч олдсонгүй' : 'Худалдан авагч алга'}
            hint={
              term
                ? `«${search.q}» гэсэн хайлтад тохирох хүн алга.`
                : 'Хүн дэлгүүрээс бараа захиалмагц энд өөрөө харагдана.'
            }
          />
        ) : (
          <BuyerTable buyers={visible} />
        )}
      </Panel>
    </>
  )
}
