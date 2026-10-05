import Link from 'next/link'
import { Alert, EmptyState, FilterChip, Panel, PageHeader, StatCard } from '@/components/admin/ui'
import { RevenueArea } from '@/components/admin/charts/RevenueArea'
import { StreamBars } from '@/components/admin/charts/StreamBars'
import { InstructorDonut } from '@/components/admin/charts/InstructorDonut'
import { CustomerSegments } from '@/components/admin/charts/CustomerSegments'
import { RANGES, STREAMS, dayRange, toRange } from '@/lib/admin/revenue'
import { EARNED_ORDER, loadRevenue } from '@/lib/admin/revenue-query'
import { loadCustomerSegments } from '@/lib/admin/customers-query'
import { addDays, dayKey, formatMnt } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { getProfile, requireStaff } from '@/lib/auth/dal'
import { isSupabaseConfigured } from '@/lib/supabase/env'

/* ───────────────────────────────────────────────────────────────────────────
   ХЯНАЛТЫН САМБАР

   Гурван давхар, дээрээс доош «мөнгө → хэмжүүр → хүмүүс»:

     1. Орлого — хугацаагаар (муруй, өмнөх үетэй) ба урсгалаар (багана).
        Хоёулаа хаяган дахь `?range=` цонхыг дагана.
     2. Багшаар (бөгж) + зургаан үзүүлэлт. Үзүүлэлтүүд нь цонхноос
        ХАМААРАХГҮЙ: үргэлж «сүүлийн 7 хоног vs өмнөх 7 хоног», доор нь
        30 өдрийн жижиг график. Цонх солих бүрд эдгээр нь үсэрвэл ажилтан
        «өнөөдөр хэр байна» гэдэг тогтмол хэмжүүрээ алдана.
     3. Хэрэглэгчид — бүртгэлтэй хүмүүсийн хэд нь юу худалдаж авсан бэ.

   «Бэлтгэх захиалга», «Дуусаж буй нөөц» жагсаалтууд энд БАЙХГҮЙ: тэдний
   тоо нь үзүүлэлтийн карт, толгой мөрийн тоолуур хоёрт аль хэдийн бий
   бөгөөд дарвал бүтэн жагсаалт руу хөтөлнө. Самбар дээрх таван мөрийн
   хуулбар нь мэдээлэл нэмдэггүй, зөвхөн байр эзэлдэг байв.
   ─────────────────────────────────────────────────────────────────────── */

/** Жижиг графикийн урт — өдрөөр. */
const SPARK_DAYS = 30

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

  /* «Өнөөдөр» нь УЛААНБААТАРЫН өдөр. `toISOString().slice(0, 10)` нь UTC
     өдөр өгдөг тул шөнийн 00:00–08:00 хооронд өчигдрийн хуваарийг
     «өнөөдрийнх» гэж харуулдаг байв. */
  const todayStart = new Date(`${dayKey(now.toISOString())}T00:00:00+08:00`)
  const todayEnd = addDays(todayStart, 1)

  const sparkDays = dayRange(SPARK_DAYS)
  const sparkSince = new Date(`${sparkDays[0]}T00:00:00+08:00`).toISOString()

  /* Үзүүлэлтийн орлого нь 30 хоногийн тайлангаас. Сонгосон цонх нь 30
     (анхдагч) бол ДАХИН татахгүй — нэг тайлан хоёр газар үйлчилнэ. */
  const monthRange = toRange('30')

  const [
    { data: todaySessions },
    { data: windowOrders },
    { data: windowProfiles },
    { data: paidOrders },
    { count: lowCount },
    { count: soldOut },
    report,
    monthReport,
    customers,
    profile,
  ] = await Promise.all([
    supabase
      .from('class_sessions')
      .select('*')
      .gte('starts_at', todayStart.toISOString())
      .lt('starts_at', todayEnd.toISOString())
      .order('starts_at'),
    supabase.from('orders').select('created_at').in('status', EARNED_ORDER).gte('created_at', sparkSince),
    supabase.from('profiles').select('created_at').gte('created_at', sparkSince),
    /* ── ТӨЛӨГДСӨН захиалга ──────────────────────────────────────────
       Төлбөр хүлээж буй захиалга бол зүгээр л ОРХИГДСОН сагс: төлбөр
       онлайн болсон тул хүн төлөх эсвэл төлөхгүй, дунд төлөв гэж үгүй.
       Ажилтанд хэрэгтэй нь: мөнгө нь ОРСОН, одоо бэлтгэх ёстой захиалга.
       Тоо + хамгийн ЭРТ төлөгдсөн мөр — хүлээлт нь хамгийн урт нь тэр.
       Ангийн захиалга доор ХАСАГДАНА: тэр нь төлөгдмөгц элсэлт өөрөө
       идэвхждэг, бэлтгэх юм алга (§ admin/orders «АНГИЙН захиалга өөр»). */
    supabase
      .from('orders')
      .select('id, created_at')
      .eq('status', 'paid')
      .order('created_at', { ascending: true })
      .limit(500),
    supabase.from('product_variants').select('id', { count: 'exact', head: true }).lte('stock_qty', 3),
    supabase.from('product_variants').select('id', { count: 'exact', head: true }).eq('stock_qty', 0),
    loadRevenue(range),
    range.key === monthRange.key ? null : loadRevenue(monthRange),
    loadCustomerSegments(),
    getProfile(),
  ])

  /* ── 30 өдрийн цуваа ────────────────────────────────────────────────
     Орлого нь тайлангаас (ганц хичээл, анги, дэлгүүр — бүгд, давхар
     тоололгүй, § revenue-query.ts). Тоо ширхэг нь мөрийг өдрөөр тоолно. */
  const month = monthReport ?? report
  const revenueDaily = month.days.map((day) => STREAMS.reduce((sum, key) => sum + day[key], 0))
  const perDay = (rows: { created_at: string }[] | null) => {
    const counts = new Map<string, number>()
    for (const row of rows ?? []) {
      const key = dayKey(row.created_at)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return sparkDays.map((day) => counts.get(day) ?? 0)
  }
  const ordersDaily = perDay(windowOrders)
  const usersDaily = perDay(windowProfiles)

  /** Сүүлийн 7 хоног ба түүний өмнөх 7 хоног — цуваанаас. */
  const week = (series: number[]) => {
    const sum = (part: number[]) => part.reduce((acc, value) => acc + value, 0)
    const current = sum(series.slice(-7))
    const before = sum(series.slice(-14, -7))
    return { current, delta: before > 0 ? Math.round(((current - before) / before) * 100) : null }
  }
  const revenueWeek = week(revenueDaily)
  const ordersWeek = week(ordersDaily)
  const usersWeek = week(usersDaily)

  const seats = (todaySessions ?? []).reduce(
    (acc, session) => ({
      taken: acc.taken + session.booked_count,
      capacity: acc.capacity + session.capacity,
    }),
    { taken: 0, capacity: 0 },
  )
  const occupancy = seats.capacity > 0 ? Math.round((seats.taken / seats.capacity) * 100) : 0

  const waitedDays = (iso: string) =>
    Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000))
  const { data: classItems } = await supabase
    .from('order_items')
    .select('order_id')
    .not('course_id', 'is', null)
    .limit(2000)
  const classOrders = new Set((classItems ?? []).map((item) => item.order_id))
  const toPrepareRows = (paidOrders ?? []).filter((order) => !classOrders.has(order.id))
  const toPrepare = toPrepareRows.length
  const longestWait = toPrepareRows[0] ? waitedDays(toPrepareRows[0].created_at) : 0

  // Анхаарал шаардсан зүйлс — мэндчилгээний доор нэг өгүүлбэрээр
  const waiting = (toPrepare ?? 0) + (lowCount ?? 0)

  return (
    <>
      <PageHeader
        title={`Сайн байна уу, ${profile?.full_name ?? 'Админ'}`}
        description={
          waiting > 0
            ? `${waiting} зүйл таны шийдвэрийг хүлээж байна.`
            : 'Шийдвэр хүлээсэн зүйл алга. Өнөөдрийн байдал доор.'
        }
      />

      {/* ── 1 · Орлого ── */}
      <div className="grid gap-6 xl:grid-cols-12">
        <Panel
          className="xl:col-span-8"
          title="Орлогын тойм"
          /* Цонх нь ХАЯГАНД үлдэнэ (`?range=`) тул сэргээх, буцах, хуваалцах
             гурвуулаа ажиллана — JavaScript-гүй ч сонголт солигдоно. */
          actions={
            <div className="flex flex-wrap gap-1.5">
              {RANGES.map((row) => (
                <FilterChip key={row.key} href={`/admin?range=${row.key}`} active={row.key === range.key}>
                  {row.label}
                </FilterChip>
              ))}
            </div>
          }
        >
          <RevenueArea
            range={range}
            buckets={report.buckets}
            previousBuckets={report.previousBuckets}
            days={report.days}
            totals={report.totals}
            previous={report.previous}
          />
        </Panel>

        <Panel className="xl:col-span-4" title="Урсгалаар" description={range.label}>
          <StreamBars totals={report.totals} previous={report.previous} />
        </Panel>
      </div>

      {/* ── 2 · Багш + үзүүлэлт ── */}
      <div className="grid gap-6 xl:grid-cols-12">
        <Panel className="xl:col-span-5" title="Багшаар" description={`Танхимын анги · ${range.label}`}>
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

        <section aria-label="Үзүүлэлт" className="admin-card p-5 xl:col-span-7">
          <div className="grid h-full gap-4 sm:grid-cols-2">
            <StatCard
              icon="wallet"
              tone="danger"
              label="Орлого · 7 хоног"
              value={formatMnt(revenueWeek.current)}
              spark={revenueDaily}
              delta={revenueWeek.delta}
            />
            <StatCard
              icon="cart"
              tone="primary"
              label="Төлсөн захиалга · 7 хоног"
              value={ordersWeek.current}
              spark={ordersDaily}
              delta={ordersWeek.delta}
              href="/admin/orders"
            />
            <StatCard
              icon="userPlus"
              tone="good"
              label="Шинэ хэрэглэгч · 7 хоног"
              value={usersWeek.current}
              spark={usersDaily}
              delta={usersWeek.delta}
              href="/admin/customers"
            />
            <StatCard
              icon="calendar"
              tone="warn"
              label="Өнөөдрийн хичээл"
              value={todaySessions?.length ?? 0}
              progress={occupancy}
              aside={`${occupancy}%`}
              hint={
                seats.capacity > 0 ? `${seats.taken}/${seats.capacity} суудал дүүрсэн` : 'Өнөөдөр хичээл алга'
              }
              href="/admin/schedule"
            />
            <StatCard
              icon="box"
              tone="info"
              label="Бэлтгэх захиалга"
              value={toPrepare ?? 0}
              hint={
                !toPrepare ? (
                  'Бүгд бэлтгэгдсэн'
                ) : (
                  /* Хоёр хоногоос удаан хүлээсэн бол ШАР — хүргэлтийн амлалт
                     зөрөх дөхсөн гэсэн үг. */
                  <span className={longestWait >= 2 ? 'text-warn' : undefined}>
                    {longestWait === 0 ? 'Хамгийн эртнийх нь өнөөдөр төлөгдсөн' : `Хамгийн удаан нь ${longestWait} хоног хүлээж байна`}
                  </span>
                )
              }
              href="/admin/orders?status=paid"
            />
            <StatCard
              icon="tag"
              tone="orange"
              label="Дуусаж буй нөөц"
              value={lowCount ?? 0}
              hint={
                !lowCount
                  ? 'Бүх бараа хангалттай'
                  : soldOut
                    ? <span className="text-danger">{soldOut} хувилбар бүр мөсөн дууссан</span>
                    : '3 ба түүнээс цөөн ширхэгтэй хувилбар'
              }
              href="/admin/products"
            />
          </div>
        </section>
      </div>

      {/* ── 3 · Хэрэглэгчид ── */}
      <Panel
        title="Хэрэглэгчид"
        description="Бүртгэлтэй хүмүүсийн хэд нь юу худалдаж авсан бэ · бүх хугацаанд"
        actions={
          <Link href="/admin/customers" className="lnk text-[0.8125rem] text-primary">
            Бүгд →
          </Link>
        }
      >
        {customers.registered > 0 ? (
          <CustomerSegments stats={customers} />
        ) : (
          <EmptyState icon="users" title="Бүртгэлтэй хэрэглэгч алга" />
        )}
      </Panel>
    </>
  )
}
