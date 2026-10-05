import {
  Alert,
  Badge,
  Button,
  EmptyState,
  FilterChip,
  Panel,
  PageHeader,
  Pager,
  SearchBox,
  Sub,
  Table,
  Td,
  Th,
} from '@/components/admin/ui'
import { updateOrderStatus } from '@/actions/admin'
import { formatDate, formatMnt, nowMs } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { requireStaff } from '@/lib/auth/dal'
import { orderStatusLabels, orderStatusTones } from '@/lib/admin/order-status'
import { failedBefore, visibleToAdmin } from '@/lib/admin/payment-outcome'
import type { Order, OrderStatus } from '@/lib/supabase/database.types'

/* ───────────────────────────────────────────────────────────────────────────
   ЗАХИАЛГА

   ── Юу нь ойлгомжгүй байсан бэ ──────────────────────────────────────────
   Хүснэгтэд «Төлөв» ба «Төлөв солих» гэсэн ХОЁР багана зэрэгцэн байв: нэг нь
   шошго, нөгөө нь долоон сонголттой жагсаалт. Нэг зүйл хоёр удаа, хоёр өөр
   хэлбэрээр — аль нь үнэн бэ гэдэг нь тодорхойгүй.

   Дээр нь жагсаалт нь БҮХ долоон төлвийг санал болгодог байлаа. Гэтэл
   төлбөр хүлээж буй захиалгыг шууд «Хүргэгдсэн» болгох нь утгагүй; захиалга
   нь урагшаа урсдаг гинж юм. Долоон боломжоос зөв нэгийг нь сонгох ажлыг
   ажилтан бүрд, мөр бүрд даалгах шаардлагагүй.

   ── Одоо ─────────────────────────────────────────────────────────────────
   Нэг багана: одоогийн төлөв. Хажууд нь ДАРААГИЙН АЛХАМ товч, ганц эсвэл
   хоёр. Товч нь юу болохыг үйл үгээр хэлнэ («Илгээсэн гэж тэмдэглэх»), тул
   дарахаас өмнө үр дүн нь мэдэгдэнэ. «Хадгалах» товч хэрэггүй боллоо.

   ── АНГИЙН захиалга өөр ─────────────────────────────────────────────────
   Бэлтгэх → илгээх → хүргэх гинж нь БАРААНД л утгатай: хэн нэгэн савлаж,
   хүргэх ёстой. Анги (`order_items.course_id`) нь төлбөр орсон агшинд
   `orders_sync_enrollment` триггерээр элсэлт идэвхжиж (онлайнд Telegram ч
   нээгдэж) ажил ДУУСДАГ. Урьд нь анги ч барааны гинжийг харуулж, төлсөн
   захиалга бүрийн хажууд «Бэлтгэж эхлэх» товч, хоёр хоног өнгөрөхөд ШАР
   «N хоног хүлээж байна» гарч, ажилтан хийх зүйлгүй ажлыг хийх ёстой мэт
   санагддаг байв (2026-10-05, эзэн асуув). Одоо ангид: төлбөр хүлээж буй үед
   л ажил бий; төлөгдсөнөөс хойш ганц алхам нь «Буцаалт» (триггер элсэлтийг
   цуцалж, суудлыг чөлөөлнө).
   ─────────────────────────────────────────────────────────────────────── */

/* Төлвийн нэр, өнгө нь «Худалдан авагч» хуудастай НЭГ эх сурвалжтай. */
const labels = orderStatusLabels
const tones = orderStatusTones

type Step = { to: OrderStatus; label: string; variant?: 'primary' | 'secondary' | 'danger' }

/**
 * Төлөв бүрээс гарах ЗӨВШӨӨРӨГДСӨН алхмууд.
 *
 * Эхнийх нь ердийн урсгал (үндсэн товч), хоёр дахь нь онцгой тохиолдол
 * (тасархай хүрээтэй). Терминал төлөвт (цуцлагдсан, буцаагдсан) алхам алга —
 * тэнд товчны оронд зураас гарна.
 */
const steps: Record<OrderStatus, Step[]> = {
  /* Амжилтгүй төлбөр: ажилтан мөнгө орсныг ӨӨРӨӨ шалгасан бол (дансаар
     шилжүүлсэн, webhook ирээгүй) гараар баталгаажуулна; үгүй бол цуцална. */
  pending_payment: [
    { to: 'paid', label: 'Төлбөр баталгаажуулах', variant: 'primary' },
    { to: 'cancelled', label: 'Цуцлах', variant: 'danger' },
  ],
  paid: [
    { to: 'preparing', label: 'Бэлтгэж эхлэх', variant: 'primary' },
    { to: 'cancelled', label: 'Цуцлах', variant: 'danger' },
  ],
  preparing: [
    { to: 'shipped', label: 'Илгээсэн', variant: 'primary' },
    { to: 'cancelled', label: 'Цуцлах', variant: 'danger' },
  ],
  shipped: [{ to: 'delivered', label: 'Хүргэгдсэн', variant: 'primary' }],
  delivered: [{ to: 'refunded', label: 'Буцаалт', variant: 'danger' }],
  cancelled: [],
  refunded: [],
}

/**
 * Хэдэн хоног хүлээгээд байгаа вэ — шийдвэр гаргахад хамгийн хэрэгтэй тоо.
 *
 * Одоогийн цагийг ГАДНААС авна: компонент дотор `Date.now()` дуудвал рендер
 * цэвэр бус болно (§ lib/format.ts `nowMs`). Мөр бүр өөр өөр агшныг барих нь
 * бас утгагүй — бүгд нэг агшнаас тоологдоно.
 */
function waitingDays(order: Order, now: number): number {
  return Math.max(0, Math.floor((now - new Date(order.created_at).getTime()) / 86_400_000))
}

/* Нээлттэй = АЖИЛТНЫ ажил хүлээж буй. Амжилтгүй төлбөр энд БАЙХГҮЙ: хүн
   төлөөгүй бол хийх ажил алга (§ payment-outcome.ts). */
const OPEN: OrderStatus[] = ['paid', 'preparing', 'shipped']

/** Ангийн захиалгад төлбөрөөс хойш хийх ажил алга — зөвхөн буцаалт. */
const classSteps: Record<OrderStatus, Step[]> = {
  ...steps,
  paid: [{ to: 'refunded', label: 'Буцаалт', variant: 'danger' }],
  preparing: [{ to: 'refunded', label: 'Буцаалт', variant: 'danger' }],
  shipped: [{ to: 'refunded', label: 'Буцаалт', variant: 'danger' }],
  delivered: [{ to: 'refunded', label: 'Буцаалт', variant: 'danger' }],
}

/** Ажил хүлээж буй юу. Анги төлөгдмөгц өөрөө нээгддэг тул хэзээ ч нээлттэй биш. */
function isOpen(status: OrderStatus, isClass: boolean): boolean {
  return !isClass && OPEN.includes(status)
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; ok?: string; error?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  /* Layout-ын `requireStaff` нь client талын шилжилтэд ДАХИН ажилладаггүй:
     эрх нь хасагдсан ажилтан хуудсыг бүрэн дахин ачаалах хүртэл орсоор
     байна. Тиймээс хуудас бүр өөрөө ч шалгана. */
  await requireStaff()

  const supabase = await createClient()

  /* Хуудаслалт. Урьд нь 100-аар таслагдаж, түүнээс цааш ХҮРЭХ АРГАГҮЙ байв —
     101 дэх захиалга оршин байсаар атал харагдахгүй. */
  const PAGE_SIZE = 40
  const page = Math.max(1, Number(search.page ?? 1) || 1)
  const term = (search.q ?? '').trim()

  /* Явцад буй (сүүлийн 30 минутын) төлбөрийг ХАРУУЛАХГҮЙ — хагас цагийн
     дотор баталгаажих эсвэл амжилтгүй болно (§ payment-outcome.ts). */
  const now = nowMs()
  const cutoff = failedBefore(now)

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search.status && search.status in labels) {
    query = query.eq('status', search.status as OrderStatus)
    if (search.status === 'pending_payment') query = query.lt('created_at', cutoff)
  } else {
    /* ── Анхдагчаар ТӨЛӨГДСӨНИЙГ л ─────────────────────────────────────
       Амжилтгүй төлбөртэй захиалга бол орхигдсон сагс: төлбөр онлайн
       болсон тул хүн төлсөн эсвэл төлөөгүй, дунд төлөв гэж үгүй.
       Тэднийг үндсэн жагсаалтад холих нь жинхэнэ ажлыг дарна.

       ХАСААГҮЙ, зөвхөн НУУСАН: «Төлбөр амжилтгүй» шошгоор дарвал гарч ирнэ. Webhook
       ирээгүй (Bonum дээр хаяг бүртгэгдээгүй) тохиолдолд төлсөн хүний
       захиалга тэнд гацдаг — тэр үед ажилтан түүнийг олох ёстой. */
    query = query.neq('status', 'pending_payment')
  }
  /* Дугаар, нэр, утас гурвуулаар нэг талбараас хайна — ажилтан ямар
     мэдээллээр асуулгыг хүлээж авахаа урьдчилж мэдэхгүй. */
  if (term) {
    const safe = term.replace(/[%,()]/g, '')
    query = query.or(
      `order_no.ilike.%${safe}%,ship_name.ilike.%${safe}%,ship_phone.ilike.%${safe}%`,
    )
  }

  const { data: orders, count } = await query.range(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE - 1,
  )
  const total = count ?? 0

  const active = search.status && search.status in labels ? search.status : null

  const link = (next: { page?: number; q?: string }) => {
    const params = new URLSearchParams()
    if (active) params.set('status', active)
    if (next.q ?? term) params.set('q', next.q ?? term)
    if ((next.page ?? page) > 1) params.set('page', String(next.page ?? page))
    const qs = params.toString()
    return `/admin/orders${qs ? `?${qs}` : ''}`
  }

  const back = link({})

  /* Шүүлтийн шошго бүрд ТОО. Хоосон төлөв рүү дарж мэдэх шаардлагагүй
     болно — хэдэн захиалга хүлээж байгааг шүүхээсээ өмнө харна.

     Аль захиалга АНГИ вэ гэдгийг нэг асуултаар — мөр бүрд асуувал жагсаалт
     40 дуудлага болно. `variant_snapshot` нь «Танхимын анги» / «Онлайн анги»
     (§ migration `enroll_course`). */
  const [{ data: all }, { data: classItems }] = await Promise.all([
    supabase.from('orders').select('id, status, created_at').limit(1000),
    supabase
      .from('order_items')
      .select('order_id, variant_snapshot')
      .not('course_id', 'is', null)
      .limit(2000),
  ])
  const classKind = new Map<string, string>(
    (classItems ?? []).map((item) => [item.order_id, item.variant_snapshot ?? 'Анги']),
  )
  const counts = new Map<string, number>()
  for (const row of all ?? []) {
    if (!visibleToAdmin(row.status, row.created_at, now)) continue
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1)
  }
  const openCount = (all ?? []).filter((row) => isOpen(row.status, classKind.has(row.id))).length

  return (
    <>
      <PageHeader
        title="Захиалга"
        description={
          openCount > 0
            ? `${openCount} захиалга нээлттэй. Товч дарахад нөөц автоматаар тохируулагдана.`
            : 'Нээлттэй захиалга алга. Сүүлийн 100 бичлэг доор.'
        }
      />

      {search.ok && <Alert tone="good">Шинэчлэгдлээ.</Alert>}
      {search.error && <Alert tone="danger">{search.error}</Alert>}

      {/* Утсан дээр нэг мөрөнд хэвтээ гүйнэ — 8 шүүлтүүр гурван мөр болж
          хуудсыг эзлэхгүй. Дэлгэцэн дээр урьдын адил бүгд харагдана. */}
      <nav
        aria-label="Төлвөөр шүүх"
        className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
      >
        <FilterChip href={term ? `/admin/orders?q=${encodeURIComponent(term)}` : '/admin/orders'} active={!active}>
          Бүгд
        </FilterChip>
        {(Object.keys(labels) as OrderStatus[]).map((status) => (
          <FilterChip
            key={status}
            href={`/admin/orders?status=${status}${term ? `&q=${encodeURIComponent(term)}` : ''}`}
            active={active === status}
          >
            {labels[status]}
            {counts.get(status) ? (
              <span className="ml-1.5 tnum opacity-60">{counts.get(status)}</span>
            ) : null}
          </FilterChip>
        ))}
      </nav>

      <SearchBox
        placeholder="Дугаар, нэр эсвэл утас"
        defaultValue={term}
        hidden={{ status: active ?? undefined }}
      />

      <Panel
        title={active ? labels[active as OrderStatus] : 'Бүх захиалга'}
        description={`${total} бичлэг`}
        flush
      >
        {!orders || orders.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="Захиалга алга"
            hint={active ? 'Энэ төлөвт захиалга байхгүй байна.' : undefined}
          />
        ) : (
          <Table minWidth={860}>
            <thead>
              <tr>
                <Th>Дугаар</Th>
                <Th>Хүлээн авагч</Th>
                <Th align="right">Дүн</Th>
                <Th>Төлөв</Th>
                <Th>Дараагийн алхам</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const kind = classKind.get(order.id)
                const next = (kind ? classSteps : steps)[order.status]
                const days = waitingDays(order, now)
                const open = isOpen(order.status, Boolean(kind))
                const stale = open && days >= 2

                const closed = !open

                return (
                  /* Хаагдсан захиалга (хүргэгдсэн, цуцлагдсан, буцаагдсан) нь
                     БҮДГЭРНЭ. Урьд нь долоон төлөв өөр өнгөтэй байсан тул
                     хүснэгтийг гүйлгэхэд «юу нь ажил, юу нь түүх» гэдэг нь
                     өнгөнөөс шууд уншигддаг байв. Монохром систем дээр тэр
                     ажлыг ГЭРЭЛТҮҮЛЭЛТ хийнэ: нээлттэй мөр тод, хаагдсан нь
                     ард үлдэнэ. */
                  <tr key={order.id} className={closed ? 'opacity-55' : undefined}>
                    <Td className="whitespace-nowrap">
                      <span className="font-mono text-xs">{order.order_no}</span>
                      <Sub>{formatDate(order.created_at, 'mn')}</Sub>
                    </Td>

                    <Td label="Хүлээн авагч">
                      <span className="font-medium">{order.ship_name}</span>
                      <Sub>{order.ship_phone}</Sub>
                      {/* Хаяг нь савлах үед хэрэгтэй, гүйлгэж харах үед биш —
                          нэг мөрөнд багтааж, шаардвал бүтнээр нь `title` -аас. */}
                      <Sub>
                        <span
                          className="block max-w-[22rem] truncate"
                          title={[order.ship_district, order.ship_khoroo, order.ship_address]
                            .filter(Boolean)
                            .join(', ')}
                        >
                          {[order.ship_district, order.ship_khoroo, order.ship_address]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </Sub>
                    </Td>

                    <Td align="right" className="font-medium whitespace-nowrap" label="Дүн">
                      {formatMnt(order.total)}
                    </Td>

                    <Td label="Төлөв">
                      <Badge tone={tones[order.status]}>{labels[order.status]}</Badge>
                      {/* Ангийн захиалга гэдгийг ИЛ хэлнэ — ажилтан «яагаад
                          бэлтгэх товч алга» гэж гайхахгүй. */}
                      {kind && (
                        <Sub>
                          {kind}
                          {order.status === 'pending_payment' || order.status === 'cancelled' || order.status === 'refunded'
                            ? ''
                            : ' · элсэлт автоматаар идэвхжсэн'}
                        </Sub>
                      )}
                      {/* Хэдэн хоног болсныг зөвхөн НЭЭЛТТЭЙ захиалгад хэлнэ.
                          Хаагдсан захиалгын нас нь шийдвэрт нөлөөлөхгүй. */}
                      {open && (
                        <Sub>
                          <span className={stale ? 'font-medium text-warn' : undefined}>
                            {days === 0 ? 'Өнөөдөр' : `${days} хоног хүлээж байна`}
                          </span>
                        </Sub>
                      )}
                    </Td>

                    <Td>
                      {next.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {next.map((step) => (
                            <form key={step.to} action={updateOrderStatus}>
                              <input type="hidden" name="order_id" value={order.id} />
                              <input type="hidden" name="status" value={step.to} />
                              <input type="hidden" name="back" value={back} />
                              <Button
                                type="submit"
                                size="sm"
                                variant={step.variant}
                              >
                                {step.label}
                              </Button>
                            </form>
                          ))}
                        </div>
                      )}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Panel>

      <Pager page={page} pageSize={PAGE_SIZE} total={total} href={(next) => link({ page: next })} />
    </>
  )
}
