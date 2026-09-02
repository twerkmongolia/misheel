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
  type Tone,
} from '@/components/admin/ui'
import { updateOrderStatus } from '@/actions/admin'
import { formatDate, formatMnt, nowMs } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
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
   ─────────────────────────────────────────────────────────────────────── */

const labels: Record<OrderStatus, string> = {
  pending_payment: 'Төлбөр хүлээж байна',
  paid: 'Төлөгдсөн',
  preparing: 'Бэлтгэж байна',
  shipped: 'Илгээсэн',
  delivered: 'Хүргэгдсэн',
  cancelled: 'Цуцлагдсан',
  refunded: 'Буцаагдсан',
}

/** Төлөв бүр өөрийн өнгөтэй — хүснэгтийг гүйлгэж хараад л ялгагдана. */
const tones: Record<OrderStatus, Tone> = {
  pending_payment: 'warn',
  paid: 'good',
  preparing: 'info',
  shipped: 'info',
  delivered: 'good',
  cancelled: 'danger',
  refunded: 'neutral',
}

type Step = { to: OrderStatus; label: string; variant?: 'primary' | 'secondary' | 'danger' }

/**
 * Төлөв бүрээс гарах ЗӨВШӨӨРӨГДСӨН алхмууд.
 *
 * Эхнийх нь ердийн урсгал (үндсэн товч), хоёр дахь нь онцгой тохиолдол
 * (тасархай хүрээтэй). Терминал төлөвт (цуцлагдсан, буцаагдсан) алхам алга —
 * тэнд товчны оронд зураас гарна.
 */
const steps: Record<OrderStatus, Step[]> = {
  pending_payment: [
    { to: 'paid', label: 'Төлбөр орсон', variant: 'primary' },
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

const OPEN: OrderStatus[] = ['pending_payment', 'paid', 'preparing', 'shipped']

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; ok?: string; error?: string }>
}) {
  const search = await searchParams
  if (!isSupabaseConfigured()) return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>

  const supabase = await createClient()

  /* Хуудаслалт. Урьд нь 100-аар таслагдаж, түүнээс цааш ХҮРЭХ АРГАГҮЙ байв —
     101 дэх захиалга оршин байсаар атал харагдахгүй. */
  const PAGE_SIZE = 40
  const page = Math.max(1, Number(search.page ?? 1) || 1)
  const term = (search.q ?? '').trim()

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search.status && search.status in labels) {
    query = query.eq('status', search.status as OrderStatus)
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

  const now = nowMs()
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
     болно — хэдэн захиалга хүлээж байгааг шүүхээсээ өмнө харна. */
  const { data: all } = await supabase.from('orders').select('status').limit(1000)
  const counts = new Map<string, number>()
  for (const row of all ?? []) counts.set(row.status, (counts.get(row.status) ?? 0) + 1)
  const openCount = OPEN.reduce((n, s) => n + (counts.get(s) ?? 0), 0)

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
                const next = steps[order.status]
                const days = waitingDays(order, now)
                const stale = OPEN.includes(order.status) && days >= 2

                const closed = !OPEN.includes(order.status)

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
                      {/* Хэдэн хоног болсныг зөвхөн НЭЭЛТТЭЙ захиалгад хэлнэ.
                          Хаагдсан захиалгын нас нь шийдвэрт нөлөөлөхгүй. */}
                      {OPEN.includes(order.status) && (
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
