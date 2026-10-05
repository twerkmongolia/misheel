import { AdminIcon, type NavIcon } from '../AdminIcon'
import type { CustomerSegments as Segments } from '@/lib/admin/customers'
import { STREAM_COLOR } from './palette'

/* ───────────────────────────────────────────────────────────────────────────
   ХЭРЭГЛЭГЧИД — БҮРТГЭЛЭЭС ХУДАЛДАН АВАЛТ ХҮРТЭЛ

   Асуулт нь «бүртгүүлсэн хүмүүсийн ХЭД НЬ юу авсан бэ» — өөрөөр хэлбэл
   нэг нийт дотор хэдэн хэсэг. Тиймээс:

     · зүүн тал — нийт (бүртгэлтэй) ба түүний хэдэн хувь нь ямар нэг юм
       авсан, цагиргаар;
     · баруун тал — бүлэг бүр НЭГ ИЖИЛ урттай зам дээр: зам = бүртгэлтэй
       бүх хүн, дүүргэлт = тухайн бүлэг. Гурван зураас шууд харьцуулагдана.

   Бөгж (pie) БИШ: бүлгүүд давхацдаг (нэг хүн анги ч, бараа ч авдаг) тул
   хэсгүүдийн нийлбэр нь 100% биш — бөгжинд зурвал худлаа болно.

   Өнгө нь орлогын урсгалынхтай ИЖИЛ (§ palette.ts `STREAM_COLOR`): онлайн
   цэнхэр, танхим ногоон, дэлгүүр улбар шар. Самбарын бүх график нэг хэлээр
   ярина.

   Сервер бүрэлдэхүүн — hover, төлөв байхгүй, JavaScript илгээхгүй.
   ─────────────────────────────────────────────────────────────────────── */

const R = 52
const CIRCUMFERENCE = 2 * Math.PI * R

const ROWS: { key: 'online' | 'studio' | 'shop'; label: string; icon: NavIcon; color: string }[] = [
  { key: 'online', label: 'Онлайн анги авсан', icon: 'globe', color: STREAM_COLOR.online },
  { key: 'studio', label: 'Танхимын анги авсан', icon: 'layers', color: STREAM_COLOR.studio },
  { key: 'shop', label: 'Онлайн дэлгүүрээс авсан', icon: 'cart', color: STREAM_COLOR.shop },
]

/** Бүртгэлтэй хэрэглэгчийн хэдэн хувь вэ. Тэг рүү хуваахгүй. */
const share = (count: number, of: number) => (of > 0 ? Math.round((count / of) * 100) : 0)

export function CustomerSegments({ stats }: { stats: Segments }) {
  const buyers = share(stats.buyers, stats.registered)

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-12">
      {/* ── Нийт ──
          Торны хүүхэд бүр `min-w-0`: анхдагч `min-width: auto` нь баганыг
          хамгийн урт шошгоороо тэлж, утсан дээр хувийн тоог картын ирмэгээс
          гадагш түлхдэг байв. */}
      <div className="flex min-w-0 items-center gap-6">
        <div className="relative size-36 shrink-0">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="12" />
            {/* `strokeDasharray` -аар — нумыг өнцгөөр (cos/sin) зурвал
                сервер, хөтөч хоёр сүүлийн оронгоороо зөрдөг. */}
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(buyers / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              opacity={stats.buyers > 0 ? 1 : 0}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="t-num text-[1.625rem] tnum">{buyers}%</span>
            <span className="mt-0.5 max-w-[4.5rem] text-[0.6875rem] leading-tight text-muted">худалдан авсан</span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[0.875rem] text-foreground-soft">Бүртгэлтэй хэрэглэгч</p>
          <p className="t-num mt-1 text-[2rem] tnum">{stats.registered.toLocaleString('en-US')}</p>
          <p className="mt-1.5 text-[0.8125rem] text-muted">
            <span className="font-medium text-foreground tnum">{stats.buyers}</span> нь ядаж нэг
            худалдан авалт хийсэн,{' '}
            <span className="tnum">{Math.max(stats.registered - stats.buyers, 0)}</span> нь хараахан
            юу ч аваагүй
          </p>
        </div>
      </div>

      {/* ── Бүлгүүд ── */}
      <div className="flex min-w-0 flex-col gap-5">
        <ul className="flex flex-col gap-5">
          {ROWS.map((row) => {
            const count = stats[row.key]
            const percent = share(count, stats.registered)
            return (
              <li key={row.key}>
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-md"
                    style={{ background: `color-mix(in srgb, ${row.color} 15%, transparent)`, color: row.color }}
                  >
                    <AdminIcon name={row.icon} className="h-[1.125rem] w-[1.125rem]" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[0.9375rem]">{row.label}</span>
                  <span className="shrink-0 text-[1.125rem] font-medium tnum">
                    {count}
                    <span className="ml-1 text-[0.8125rem] font-normal text-muted">хүн</span>
                  </span>
                  <span className="w-12 shrink-0 text-right text-[0.875rem] font-medium tnum" style={{ color: row.color }}>
                    {percent}%
                  </span>
                </div>
                {/* Зам нь БҮРТГЭЛТЭЙ бүх хүн — гурван мөр нэг хэмжүүртэй тул
                    шууд харьцуулагдана. Тэг ч гэсэн жижиг толгой үлдээнэ:
                    «өгөгдөл алга» биш «хэн ч аваагүй». */}
                <div
                  role="meter"
                  aria-label={row.label}
                  aria-valuemin={0}
                  aria-valuemax={stats.registered}
                  aria-valuenow={count}
                  aria-valuetext={`${count} хүн, ${percent}%`}
                  className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-3"
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(percent, count > 0 ? 1 : 0)}%`, background: row.color }}
                  />
                </div>
              </li>
            )
          })}
        </ul>

        {/* Бүлгүүдийн нийлбэр нь худалдан авагчийн тооноос их байж болно —
            яагаад гэдгийг энд хэлнэ, эс бөгөөс тоо буруу мэт харагдана. */}
        {stats.multi > 0 && (
          <p className="text-[0.75rem] text-muted">
            Нэг хүн хэд хэдэн бүлэгт орж болно —{' '}
            <span className="tnum text-foreground-soft">{stats.multi}</span> хүн 2 ба түүнээс олон
            төрлийн зүйл авсан.
          </p>
        )}
      </div>
    </div>
  )
}
