import Link from 'next/link'
import {
  Alert,
  Badge,
  EmptyState,
  FilterChip,
  Panel,
  PageHeader,
  StatCard,
  StatRow,
} from '@/components/admin/ui'
import { RevenueBars } from '@/components/admin/charts/RevenueBars'
import { InstructorDonut } from '@/components/admin/charts/InstructorDonut'
import { RANGES, toRange } from '@/lib/admin/revenue'
import { loadRevenue } from '@/lib/admin/revenue-query'
import { formatMnt, weekStart, addDays } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { getProfile, requireStaff } from '@/lib/auth/dal'
import { indexBy } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const search = await searchParams
  const range = toRange(search.range)
  if (!isSupabaseConfigured()) {
    return <Alert tone="warn">Supabase тохируулаагүй байна.</Alert>
  }

  /* Layout-ын `requireStaff` нь client талын шилжилтэд ДАХИН ажилладаггүй:
     эрх нь хасагдсан ажилтан хуудсыг бүрэн дахин ачаалах хүртэл орсоор
     байна. Тиймээс хуудас бүр өөрөө ч шалгана. */
  await requireStaff()

  const supabase = await createClient()
  const now = new Date()
  const todayStart = new Date(`${now.toISOString().slice(0, 10)}T00:00:00+08:00`)
  const todayEnd = addDays(todayStart, 1)
  const weekAgo = weekStart(0)

  /* Өмнөх долоо хоногийг ЧУ давхар татна — тоо ганцаараа мэдээлэл биш.
     «1.2 сая» гэдэг нь сайн уу, муу юу гэдгийг зөвхөн өмнөхтэй нь
     харьцуулж мэдэх боломжтой. */
  const prevWeek = weekStart(-1)

  const [
    { data: todaySessions },
    { data: paidOrders },
    { data: prevOrders },
    { data: newOrders },
    { data: lowStock },
    report,
    profile,
  ] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('*')
      .gte('starts_at', todayStart.toISOString())
      .lt('starts_at', todayEnd.toISOString())
      .order('starts_at'),
    supabase.from('orders').select('total, created_at, status').gte('created_at', weekAgo.toISOString()),
    supabase
      .from('orders')
      .select('total, status')
      .gte('created_at', prevWeek.toISOString())
      .lt('created_at', weekAgo.toISOString()),
    /* ── ТӨЛӨГДСӨН захиалга ──────────────────────────────────────────
       Төлбөр хүлээж буй захиалга бол зүгээр л ОРХИГДСОН сагс: төлбөр
       онлайн болсон тул хүн төлөх эсвэл төлөхгүй, дунд төлөв гэж үгүй.
       Тэднийг самбар дээр жагсаах нь ажилтныг хэзээ ч ирэхгүй мөнгө
       хүлээлгэнэ.

       Ажилтанд хэрэгтэй нь: мөнгө нь ОРСОН, одоо бэлтгэх ёстой захиалга.
       Хамгийн ЭРТ төлөгдсөнийг эхэнд — хүлээлт нь хамгийн урт нь тэр. */
    supabase
      .from('orders')
      .select('*')
      .eq('status', 'paid')
      .order('created_at', { ascending: true })
      .limit(5),
    supabase.from('product_variants').select('*').lte('stock_qty', 3).order('stock_qty').limit(8),
    loadRevenue(range),
    getProfile(),
  ])

  /* Нөөц дуусаж буй хувилбарын БАРААНЫ НЭРийг татна. Урьд нь зөвхөн SKU
     («MOCK-CROP-M-PNK») харагддаг байсан — ажилтан тэр код ямар бараа болохыг
     таамаглах, эсвэл Бараа хуудас руу очиж хайх ёстой болдог байв. */
  const productIds = [...new Set((lowStock ?? []).map((v) => v.product_id))]
  const { data: lowProducts } = productIds.length
    ? await supabase.from('products').select('id, name_mn').in('id', productIds)
    : { data: [] as { id: string; name_mn: string }[] }
  const productName = indexBy(lowProducts ?? [], 'id')

  const earned = (rows: { total: number; status: string }[] | null) =>
    (rows ?? [])
      .filter((order) => ['paid', 'preparing', 'shipped', 'delivered'].includes(order.status))
      .reduce((sum, order) => sum + order.total, 0)

  const revenue = earned(paidOrders)
  const prevRevenue = earned(prevOrders)
  const delta = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null

  const seats = (todaySessions ?? []).reduce(
    (acc, session) => ({
      taken: acc.taken + session.booked_count,
      capacity: acc.capacity + session.capacity,
    }),
    { taken: 0, capacity: 0 },
  )
  const occupancy = seats.capacity > 0 ? Math.round((seats.taken / seats.capacity) * 100) : 0

  // Анхаарал шаардсан зүйлс — мэндчилгээний доор нэг өгүүлбэрээр
  const waiting = (newOrders?.length ?? 0) + (lowStock?.length ?? 0)

  return (
    <>
      <PageHeader
        title={`Сайн байна уу, ${profile?.full_name ?? 'Админ'}`}
        description={
          waiting > 0
            ? `${waiting} зүйл таны шийдвэрийг хүлээж байна.`
            : 'Шийдвэр хүлээсэн зүйл алга. Өнөөдрийн байдал доор.'
        }
        /* Гарчгийн хажуугийн хоёр товч (》Хуваарь нэмэх《, 》Захиалга шалгах《)
           хасагдав: хоёулангийнх нь очих газар доорх үзүүлэлтийн хайрцгууд
           дээрээс аль хэдийн дарагддаг бөгөөд зүүн талын зурвас мөн тэр
           хоёр хуудсыг байнга барьж байдаг. Нэг зүйл рүү гурван зам. */
      />

      <StatRow>
        <StatCard
          icon="calendar"
          label="Өнөөдрийн хичээл"
          value={todaySessions?.length ?? 0}
          hint={todaySessions?.length ? 'Хуваарь харах' : 'Хуваарь хоосон'}
          href="/admin/schedule"
        />
        <StatCard
          icon="percent"
          label="Өнөөдрийн дүүргэлт"
          value={`${occupancy}%`}
          hint={`${seats.taken}/${seats.capacity} суудал`}
        />
        <StatCard
          icon="wallet"
          label="7 хоногийн орлого"
          value={formatMnt(revenue)}
          hint={
            delta === null
              ? 'Өмнөх долоо хоног хоосон'
              : `Өмнөх 7 хоногоос ${delta >= 0 ? '+' : ''}${delta}%`
          }
        />
        <StatCard
          icon="receipt"
          label="Бэлтгэх захиалга"
          value={newOrders?.length ?? 0}
          hint={newOrders?.length ? 'Төлбөр орсон, хүргэлт хүлээж буй' : 'Бүгд бэлтгэгдсэн'}
          href="/admin/orders?status=paid"
        />
      </StatRow>

      <Panel
        title={`Орлого · ${range.label}`}
        description="Багана дээр хулгана аваачихад задаргаа гарна. Дарвал бүтэн тайлан."
        /* Цонх нь ХАЯГАНД үлдэнэ (`?range=`) тул сэргээх, буцах, хуваалцах
           гурвуулаа ажиллана — JavaScript-гүй ч сонголт солигдоно. */
        actions={
          <div className="flex flex-wrap gap-1.5">
            {RANGES.map((row) => (
              <FilterChip
                key={row.key}
                href={`/admin?range=${row.key}`}
                active={row.key === range.key}
              >
                {row.label}
              </FilterChip>
            ))}
          </div>
        }
      >
        <RevenueBars
          range={range}
          buckets={report.buckets}
          days={report.days}
          totals={report.totals}
          previous={report.previous}
        />
      </Panel>

      <Panel
        title="Танхимын орлого · багшаар"
        description="Багшийн хөтөлдөг АНГИас орсон мөнгө. Дарвал бүтэн хүснэгт."
      >
        {/* ⚠️ `instructors.length` -ээр шалгахад ХАНГАЛТГҮЙ.
            Зөвхөн ганц хичээл заасан багш нар энэ жагсаалтад ордог ч тэдэнд
            танхимын КУРСын орлого байхгүй — бөгж зурах юмгүй болж, самбар
            бүхэлдээ хоосон гарна. Тиймээс бөгжинд юу орохыг нь шалгана. */}
        {report.instructors.some((row) => row.studio > 0) ? (
          <InstructorDonut rows={report.instructors} range={range} />
        ) : (
          <EmptyState
            icon="users"
            title="Танхимын орлого алга"
            hint={
              report.instructors.length > 0
                ? `Сүүлийн ${range.in} зөвхөн ганц хичээлийн орлого орсон байна.`
                : `Сүүлийн ${range.in} танхимын анги зарагдаагүй байна.`
            }
          />
        )}
      </Panel>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel
          title="Бэлтгэх захиалга"
          description="Төлбөр орсон, хамгийн эртнээс эхэлж 5"
          actions={
            <Link
              href="/admin/orders"
              className="lnk t-meta text-muted hover:text-foreground"
            >
              Бүгд →
            </Link>
          }
          flush
        >
          {!newOrders || newOrders.length === 0 ? (
            <EmptyState icon="receipt" title="Бэлтгэх захиалга алга" />
          ) : (
            <ul>
              {newOrders.map((order) => {
                const days = Math.max(
                  0,
                  Math.floor((now.getTime() - new Date(order.created_at).getTime()) / 86_400_000),
                )
                return (
                  /* БҮТЭН мөр дарагдана — өмнө нь зөвхөн нэр нь холбоос
                     байсан бөгөөд дүнгийн дээр дарсан хүн юу ч болохгүйд
                     эргэлздэг байв. Мөр нь `admin-row` тул hover дээр
                     дэвсгэрээ сольж, хаана байгаагаа хэлнэ. */
                  <li key={order.id} className="border-b border-line last:border-b-0">
                    <Link
                      href="/admin/orders?status=paid"
                      className="admin-row flex items-center justify-between gap-3 px-5 py-3 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {order.ship_name}
                        {/* Хэдэн хоног хүлээснийг ХЭЛНЭ. Хамгийн удаан
                            хүлээснийг эхэнд гаргадаг тул жагсаалт өөрөө
                            дараалал болно. */}
                        <span
                          className={`ml-2 text-xs tnum ${days >= 2 ? 'font-medium text-warn' : 'text-muted'}`}
                        >
                          {days === 0 ? 'өнөөдөр' : `${days} хоног`}
                        </span>
                      </span>
                      <span className="shrink-0 font-medium tnum">{formatMnt(order.total)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="Дуусаж буй нөөц"
          description="3-аас цөөн ширхэгтэй хувилбарууд"
          actions={
            <Link
              href="/admin/products"
              className="lnk t-meta text-muted hover:text-foreground"
            >
              Бараа →
            </Link>
          }
          flush
        >
          {!lowStock || lowStock.length === 0 ? (
            <EmptyState icon="tag" title="Бүх бараа хангалттай" />
          ) : (
            <ul>
              {lowStock.map((variant) => (
                <li key={variant.id} className="border-b border-line last:border-b-0">
                  <Link
                    href="/admin/products"
                    className="admin-row flex items-center justify-between gap-3 px-5 py-3 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium">
                        {productName.get(variant.product_id)?.name_mn ?? 'Тодорхойгүй бараа'}
                      </span>
                      {/* Хэмжээ, өнгө нь ЯМАР хувилбар дууссаныг хэлнэ. SKU
                          нь ажилтанд утгагүй код — шаардвал Бараа хуудсанд
                          бий. */}
                      {(variant.size || variant.color) && (
                        <span className="ml-2 text-xs text-muted">
                          {[variant.size, variant.color].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </span>
                    <Badge tone={variant.stock_qty === 0 ? 'danger' : 'warn'}>
                      {variant.stock_qty === 0 ? 'Дууссан' : `${variant.stock_qty} ширхэг`}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
