'use client'

import { useId, useRef, useState } from 'react'
import { DialogFrame } from '../Dialog'
import { Delta } from '../ui'
import { compactMnt, formatMnt } from '@/lib/format'
import { areaPath, monotonePath, niceTicks, type Point } from '@/lib/admin/chart'
import {
  STREAMS,
  STREAM_LABEL,
  axisLabel,
  dayLabel,
  type Bucket,
  type DayRevenue,
  type Range,
  type Stream,
} from '@/lib/admin/revenue'
import { STREAM_COLOR } from './palette'

/* ───────────────────────────────────────────────────────────────────────────
   ОРЛОГЫН ТОЙМ — ЭНЭ ҮЕ БА ӨМНӨХ ҮЕ

   Хоёр шугам: сонгосон цонх (цэнхэр) ба яг ижил урттай ӨМНӨХ цонх (улбар
   шар). Асуулт нь «хэд олсон бэ» биш «өмнөхөөсөө яасан бэ» — ганцаараа
   зогсох муруй нь сайн уу, муу юу гэдгийг хэлж чаддаггүй.

   Өмнөх үе нь баганаараа ЯГ тэгшлэгдсэн (§ revenue.ts `alignPrevious`):
   i дэх цэг нь «өмнөх цонхны i дэх өдөр/долоо хоног».

   ── Яагаад хөвөгч тайлбар (tooltip) БИШ вэ ──────────────────────────────
   Хулганы араас гүйдэг жижиг хайрцаг нь ирмэг дээр таслагдана, хүрэлцээт
   дэлгэц дээр огт гарахгүй, шугамыг халхална. Оронд нь графикийн ДЭЭРХ
   тогтмол уншилт өөрчлөгдөнө — байрлал нь урьдчилан мэдэгдэх тул нүд
   хайхгүй. Сумтай товчоор ч мөн ажиллана.

   ── Зохиомж ─────────────────────────────────────────────────────────────
   Муруй нь `viewBox` -той SVG, `preserveAspectRatio="none"` — өргөн нь
   савныхаа дагуу сунна. Шугамын зузаан `non-scaling-stroke` тул сунахдаа
   бүдүүрэхгүй. Харин ТЕКСТ, ЦЭГ нь SVG-д биш HTML-д (хувиар байрлана):
   сунгасан SVG дотор дугуй зуйван, үсэг хавтгай болдог.
   ─────────────────────────────────────────────────────────────────────── */

const W = 1000
const H = 300

type Totals = Record<Stream, number>

const total = (row: Record<Stream, number>) => STREAMS.reduce((sum, key) => sum + row[key], 0)

export function RevenueArea({
  range,
  buckets,
  previousBuckets,
  days,
  totals,
  previous,
}: {
  range: Range
  buckets: Bucket[]
  previousBuckets: Bucket[]
  days: DayRevenue[]
  totals: Totals
  previous: Totals & { all: number }
}) {
  const [active, setActive] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  /* Градиентийн id нь хуудсанд ДАНГААРАА байх ёстой. `useId` -ийн «:r1:» нь
     `url(#…)` дотор тусгай тэмдэгт тул цэвэрлэнэ. */
  const uid = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  const now = buckets.map(total)
  const before = previousBuckets.map(total)
  const count = now.length

  const ticks = niceTicks(Math.max(...now, ...before, 0))
  const top = ticks[ticks.length - 1] || 1

  const x = (index: number) => (count > 1 ? (index / (count - 1)) * W : W / 2)
  const y = (value: number) => H - (value / top) * H
  const nowPoints: Point[] = now.map((value, index) => [x(index), y(value)])
  const beforePoints: Point[] = before.map((value, index) => [x(index), y(value)])

  const all = total(totals)
  const shownNow = active === null ? all : now[active]!
  const shownBefore = active === null ? previous.all : (before[active] ?? 0)
  const delta = shownBefore > 0 ? Math.round(((shownNow - shownBefore) / shownBefore) * 100) : null

  /* Тэнхлэгт 7 хүртэл шошго. Сүүлийнх нь ҮРГЭЛЖ байна (өнөөдөр), өмнөх
     шошготойгоо хэт ойр бол өмнөхийг нь хасна — хоёр огноо давхцахгүй.
     Утсан дээр хос байрлалынх нь л үлдэнэ (доор `max-sm:hidden`): 350px-д
     долоон «10/15» багтахгүй. */
  const every = Math.max(1, Math.ceil((count - 1) / 6))
  const marks: number[] = []
  for (let index = 0; index < count; index += every) marks.push(index)
  if (count > 0 && marks[marks.length - 1] !== count - 1) {
    if (count - 1 - marks[marks.length - 1]! < every / 2) marks.pop()
    marks.push(count - 1)
  }

  const pick = (clientX: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    return Math.round(ratio * (count - 1))
  }

  const pct = (value: number, of: number) => `${(value / of) * 100}%`

  return (
    <div className="flex flex-col gap-5">
      {/* ── Уншилт + тайлбар ── */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-[0.8125rem] text-muted">
            {active === null ? `${range.of} нийт` : buckets[active]!.label}
          </p>
          <p className="t-num mt-1 text-[1.75rem] tnum">{formatMnt(shownNow)}</p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[0.8125rem] text-muted">
            <Delta value={delta} className="text-[0.8125rem]" />
            <span className="tnum">өмнөх үе {formatMnt(shownBefore)}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <ul className="flex items-center gap-4 text-[0.8125rem] text-muted">
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-2.5 w-5 rounded-[3px] border-2 border-primary" />
              Энэ үе
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="h-2.5 w-5 rounded-[3px] border-2 border-[#FF6A00]" />
              Өмнөх үе
            </li>
          </ul>
          <button type="button" className="btn btn-line btn-sm" onClick={() => dialog.current?.showModal()}>
            Тайлан
          </button>
        </div>
      </div>

      {/* ── График ── */}
      <div className="flex gap-3">
        {/* Y тэнхлэг */}
        <div aria-hidden="true" className="relative h-60 w-12 shrink-0 sm:h-72">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2 text-[0.6875rem] whitespace-nowrap text-faint tnum"
              style={{ top: `${100 - (tick / top) * 100}%` }}
            >
              {compactMnt(tick)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div
            role="group"
            tabIndex={0}
            aria-label={`Орлогын график, ${range.label}. Сумаар үе сонгож, Enter дарж тайлан нээнэ.`}
            className="relative h-60 cursor-crosshair touch-pan-y rounded-sm sm:h-72"
            onPointerMove={(event) => setActive(pick(event.clientX, event.currentTarget))}
            onPointerLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
            onClick={() => dialog.current?.showModal()}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault()
                const step = event.key === 'ArrowLeft' ? -1 : 1
                setActive((current) =>
                  Math.min(Math.max((current ?? (step < 0 ? count : -1)) + step, 0), count - 1),
                )
              }
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                dialog.current?.showModal()
              }
              if (event.key === 'Escape') setActive(null)
            }}
          >
            {/* Хэвтээ тор — тэнхлэгийн шошго бүрийн түвшинд */}
            {ticks.map((tick) => (
              <span
                key={tick}
                aria-hidden="true"
                className="absolute inset-x-0 h-px bg-line"
                style={{ top: `${100 - (tick / top) * 100}%` }}
              />
            ))}

            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              {/* `userSpaceOnUse` нь ЗААВАЛ: анхдагч `objectBoundingBox` нь
                  тэгш хэвтээ шугам (бүх өдөр тэг) дээр 0 өндөртэй хүрээ үүсгэж,
                  градиент огт зурагдахгүй — шугам алга болно. */}
              <defs>
                <linearGradient id={`${uid}-now`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={H}>
                  <stop offset="0" style={{ stopColor: 'var(--primary)', stopOpacity: 0.42 }} />
                  <stop offset="1" style={{ stopColor: 'var(--primary)', stopOpacity: 0 }} />
                </linearGradient>
                <linearGradient id={`${uid}-before`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={H}>
                  <stop offset="0" style={{ stopColor: 'var(--hot-to)', stopOpacity: 0.24 }} />
                  <stop offset="1" style={{ stopColor: 'var(--hot-from)', stopOpacity: 0 }} />
                </linearGradient>
                <linearGradient id={`${uid}-line`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={W} y2="0">
                  <stop offset="0" style={{ stopColor: 'var(--hot-to)' }} />
                  <stop offset="1" style={{ stopColor: 'var(--hot-from)' }} />
                </linearGradient>
              </defs>

              {/* Өмнөх үе ДООР — одоогийнх нь гол дуу хоолой, дээр суух ёстой. */}
              <path d={areaPath(beforePoints, H)} fill={`url(#${uid}-before)`} />
              <path d={areaPath(nowPoints, H)} fill={`url(#${uid}-now)`} />
              <path
                d={monotonePath(beforePoints)}
                fill="none"
                stroke={`url(#${uid}-line)`}
                strokeWidth={2.5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={monotonePath(nowPoints)}
                fill="none"
                stroke="var(--primary)"
                strokeWidth={3}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {active !== null && (
              <>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 w-px bg-foreground/25"
                  style={{ left: pct(x(active), W) }}
                />
                <Dot left={pct(x(active), W)} top={pct(y(before[active] ?? 0), H)} color="#FF6A00" />
                <Dot left={pct(x(active), W)} top={pct(y(now[active]!), H)} color="var(--primary)" />
              </>
            )}

            {all === 0 && previous.all === 0 && (
              <p className="pointer-events-none absolute inset-0 grid place-items-center text-[0.875rem] text-muted">
                Энэ хугацаанд орлого алга
              </p>
            )}
          </div>

          {/* X тэнхлэг. Эхний шошго зүүн ирмэгээс, сүүлийнх баруун ирмэгээс
              эхэлнэ — голлуулбал хагас нь графикийн гадна тайрагдана. */}
          <div aria-hidden="true" className="relative mt-2 h-4 text-[0.6875rem] text-faint">
            {marks.map((index, position) => (
              <span
                key={index}
                className={`absolute top-0 whitespace-nowrap tnum ${
                  index === 0 ? '' : index === count - 1 ? '-translate-x-full' : '-translate-x-1/2'
                } ${position % 2 === 1 && index !== count - 1 ? 'max-sm:hidden' : ''}`}
                style={{ left: pct(x(index), W) }}
              >
                {axisLabel(buckets[index]!.key)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <dialog
        ref={dialog}
        className="admin-dialog"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close()
        }}
      >
        <DialogFrame title="Орлогын тайлан" subtitle={range.label} onClose={() => dialog.current?.close()}>
          <Report range={range} days={days} totals={totals} previous={previous} all={all} />
        </DialogFrame>
      </dialog>
    </div>
  )
}

function Dot({ left, top, color }: { left: string; top: string; color: string }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface"
      style={{ left, top, background: color }}
    />
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   ТАЙЛАН

   Товч байх нь зорилго: ажилтны асуулт «юу болов, өмнөхөөсөө яасан бэ»
   гэдэг хоёрхон зүйл. Тиймээс мөр бүр ХАРЬЦУУЛАЛТ авч явна — ганцаараа
   зогсох тоо нь сайн уу, муу юу гэдгийг хэлж чаддаггүй.
   ─────────────────────────────────────────────────────────────────────── */
function Report({
  range,
  days,
  totals,
  previous,
  all,
}: {
  range: Range
  days: DayRevenue[]
  totals: Totals
  previous: Totals & { all: number }
  all: number
}) {
  const withTotals = days.map((day) => ({ day: day.day, total: total(day) }))
  const best = withTotals.reduce((top, row) => (row.total > top.total ? row : top), { day: '', total: 0 })
  const active = withTotals.filter((row) => row.total > 0).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="t-num text-[1.875rem] tnum">{formatMnt(all)}</p>
        <p className="flex items-baseline gap-2 text-[0.8125rem] text-muted">
          <Delta value={percent(all, previous.all)} className="text-[0.8125rem]" />
          өмнөх {range.from}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <Cell label="Өдрийн дундаж" value={formatMnt(Math.round(all / Math.max(days.length, 1)))} />
        <Cell
          label="Орлоготой өдөр"
          value={`${active} / ${days.length}`}
          hint={active === 0 ? 'Нэг ч борлуулалт алга' : undefined}
        />
        <Cell
          label="Хамгийн өндөр өдөр"
          value={best.total > 0 ? formatMnt(best.total) : '—'}
          hint={best.total > 0 ? dayLabel(best.day, range.group === 'month') : undefined}
        />
        <Cell
          label="Өмнөх үе"
          value={formatMnt(previous.all)}
          hint={previous.all === 0 ? 'Тэр үед борлуулалт байгаагүй' : undefined}
        />
      </dl>

      <div className="flex flex-col gap-2 border-t border-line pt-5">
        <h3 className="text-[0.8125rem] font-medium text-muted">Урсгал тус бүрээр</h3>
        <ul className="flex flex-col">
          {STREAMS.map((key) => (
            <li key={key} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: STREAM_COLOR[key] }} />
              <span className="min-w-0 flex-1 truncate text-[0.875rem] font-medium">{STREAM_LABEL[key]}</span>
              <span className="shrink-0 text-right">
                <span className="block text-[0.875rem] font-medium tnum">{formatMnt(totals[key])}</span>
                <span className="block text-[0.6875rem] text-muted tnum">
                  {all > 0 ? `${Math.round((totals[key] / all) * 100)}%` : '—'}
                </span>
              </span>
              <span className="w-16 shrink-0 text-right">
                <Delta value={percent(totals[key], previous[key])} className="text-[0.8125rem]" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Өмнөх нь тэг бол хувь тооцох боломжгүй — `null` (§ ui.tsx `Delta`). */
function percent(now: number, before: number): number | null {
  return before > 0 ? Math.round(((now - before) / before) * 100) : null
}

function Cell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-line bg-surface-2 px-4 py-3">
      <dt className="text-[0.75rem] text-muted">{label}</dt>
      <dd className="text-[1rem] font-medium tnum">{value}</dd>
      {hint && <dd className="text-[0.6875rem] text-faint">{hint}</dd>}
    </div>
  )
}
