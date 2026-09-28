'use client'

import { useRef, useState } from 'react'
import { DialogFrame } from '../Dialog'
import { formatMnt } from '@/lib/format'
import {
  STREAMS,
  STREAM_LABEL,
  dayLabel,
  type Bucket,
  type DayRevenue,
  type Range,
  type Stream,
} from '@/lib/admin/revenue'
import { STREAM_COLOR } from './palette'

/* ───────────────────────────────────────────────────────────────────────────
   ОРЛОГО — ДАВХАРЛАСАН БАГАНА

   ── Яагаад хөвөгч тайлбар (tooltip) БИШ вэ ──────────────────────────────
   Хулганы араас гүйдэг жижиг хайрцаг нь өөрөө асуудлын үүр: ирмэг дээр
   таслагдана, хүрэлцээт дэлгэц дээр огт гарахгүй, доод баганыг халхална.
   Оронд нь ГРАФИКИЙН ДЭЭР тогтмол мөр байна — багана дээр хулгана очиход
   тэр мөр өөрчлөгдөнө. Байрлал нь урьдчилан мэдэгдэх тул нүд хайхгүй.

   Хулганагүй хүнд ч ажиллана: багана бүр `button` тул Tab-аар явахад
   мөн уншигдана.

   ── Яагаад SVG биш DIV вэ ───────────────────────────────────────────────
   Давхарласан багана нь өндрийг ХУВИАР илэрхийлдэг — яг тэр нь CSS-ийн
   уугуул хэл. SVG бол `viewBox` -ын тоо бодох, өргөн өөрчлөгдөхөд дахин
   бодох ажил нэмнэ; энд түүний хариуд авах зүйл алга.
   ─────────────────────────────────────────────────────────────────────── */

type Totals = Record<Stream, number>

export function RevenueBars({
  range,
  buckets,
  days,
  totals,
  previous,
}: {
  range: Range
  buckets: Bucket[]
  days: DayRevenue[]
  totals: Totals
  previous: Totals & { all: number }
}) {
  const [active, setActive] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  const sums = buckets.map((bucket) => STREAMS.reduce((acc, key) => acc + bucket[key], 0))
  /* Хамгийн өндөр багана нь талбайгаа ДҮҮРГЭНЭ. Тогтмол дээд хязгаар
     тавибал багавтар долоо хоногт бүх багана ёроолд наалдаж, ялгаа нь
     алга болно. */
  const peak = Math.max(...sums, 1)

  const shown = active === null ? null : buckets[active]
  const all = STREAMS.reduce((acc, key) => acc + totals[key], 0)

  return (
    <div className="flex flex-col gap-5">
      {/* ── Уншилт ── */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-2xl font-semibold tnum">
          {formatMnt(shown ? sums[active!]! : all)}
        </p>
        <p className="text-xs text-muted">{shown ? shown.label : `${range.of} нийт`}</p>
      </div>

      {/* ── Багана ──
          Бүхэлдээ дарагдана: чиглэл нь «графикийг дарвал дэлгэрэнгүй». Мөр
          дэх багана бүр өөрөө `button` тул тэднийг дарсан ч энд хүрч ирнэ. */}
      <div
        className="flex h-48 items-end gap-px sm:h-56"
        onMouseLeave={() => setActive(null)}
        onClick={() => dialog.current?.showModal()}
      >
        {buckets.map((bucket, index) => {
          const total = sums[index]!
          const on = active === index

          return (
            <button
              key={bucket.key}
              type="button"
              // Хоосон өдөр ч ӨРГӨНӨӨ эзэлнэ — тэгэхгүй бол долоо хоногийн
              // хэмнэл гажиж, «чимээгүй өдөр» гэдэг мэдээлэл алга болно.
              className="group relative flex h-full flex-1 cursor-pointer flex-col justify-end outline-none"
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              aria-label={`${bucket.label} — ${formatMnt(total)}`}
            >
              {/* ⚠️ Энд БҮТЭН ӨНДӨР дэвсгэр тавьж болохгүй.
                  Эхний хувилбарт идэвхтэй баганын ард `bg-surface-3` тууз
                  байсан бөгөөд тэр нь графикийн дээд хүртэл сунаж, өөрөө
                  БАГАНА мэт уншигдаж байв — «энэ өдөр хамгийн өндөр» гэсэн
                  худал мэдээлэл. Хаана байгааг ёроолын нэг пиксел хэлнэ,
                  бусдын бүдгэрэлт баталгаажуулна. */}
              <span
                aria-hidden
                className={`absolute inset-x-0 -bottom-1.5 h-px transition-opacity duration-150 ${
                  on ? 'bg-foreground opacity-100' : 'opacity-0'
                }`}
              />

              <span
                className="relative flex w-full flex-col justify-end overflow-hidden rounded-[2px]"
                style={{ height: `${Math.max((total / peak) * 100, total > 0 ? 1.5 : 0)}%` }}
              >
                {/* Дараалал нь тайлбартай ижил байх ёстой — эс бөгөөс нүд
                    дээрээс доош уншаад тайлбараас өөр дарааллыг олно. */}
                {STREAMS.map((key) =>
                  bucket[key] > 0 ? (
                    <span
                      key={key}
                      className="w-full transition-opacity duration-150"
                      style={{
                        height: `${(bucket[key] / total) * 100}%`,
                        background: STREAM_COLOR[key],
                        opacity: active === null || on ? 1 : 0.4,
                      }}
                    />
                  ) : null,
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Тэнхлэг ── */}
      <div className="flex items-center justify-between border-t border-line pt-2 text-[0.6875rem] text-faint">
        <span>{buckets[0]?.label ?? ''}</span>
        <span>{buckets[buckets.length - 1]?.label ?? ''}</span>
      </div>

      {/* ── Тайлбар ──
          Урсгал бүрийн дүн нь ҮРГЭЛЖ харагдана. Зөвхөн өнгө, нэр хоёрыг
          холбосон тайлбар нь «хэд вэ» гэсэн дараагийн асуултыг хариултгүй
          үлдээдэг. Багана дээр хулгана очиход ТЭР баганын дүн рүү солигдоно. */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-4">
        {STREAMS.map((key) => (
          <div key={key} className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ background: STREAM_COLOR[key] }}
            />
            <div className="flex min-w-0 flex-col">
              <dt className="truncate text-[0.6875rem] text-muted">{STREAM_LABEL[key]}</dt>
              <dd className="text-sm font-medium tnum">
                {formatMnt(shown ? shown[key] : totals[key])}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      <dialog
        ref={dialog}
        className="admin-dialog"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close()
        }}
      >
        <DialogFrame
          title="Орлогын тайлан"
          subtitle={range.label}
          onClose={() => dialog.current?.close()}
        >
          <Report range={range} days={days} totals={totals} previous={previous} all={all} />
        </DialogFrame>
      </dialog>
    </div>
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
  const withTotals = days.map((day) => ({
    day: day.day,
    total: STREAMS.reduce((acc, key) => acc + day[key], 0),
  }))
  const best = withTotals.reduce(
    (top, row) => (row.total > top.total ? row : top),
    { day: '', total: 0 },
  )
  const active = withTotals.filter((row) => row.total > 0).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-3xl font-semibold tnum">{formatMnt(all)}</p>
        <Delta now={all} before={previous.all} suffix={`өмнөх ${range.from}`} />
      </div>

      <dl className="grid grid-cols-2 gap-4">
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
        <h3 className="text-xs font-semibold tracking-[0.01em] text-muted">Урсгал тус бүрээр</h3>
        <ul className="flex flex-col">
          {STREAMS.map((key) => (
            <li
              key={key}
              className="flex items-center gap-3 border-b border-line py-3 last:border-b-0"
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ background: STREAM_COLOR[key] }}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {STREAM_LABEL[key]}
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-medium tnum">{formatMnt(totals[key])}</span>
                <span className="block text-[0.6875rem] text-muted tnum">
                  {all > 0 ? `${Math.round((totals[key] / all) * 100)}%` : '—'}
                </span>
              </span>
              <span className="w-24 shrink-0 text-right">
                <Delta now={totals[key]} before={previous[key]} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Cell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[3px] border border-line bg-surface-2 px-4 py-3">
      <span className="text-[0.6875rem] text-muted">{label}</span>
      <span className="text-base font-semibold tnum">{value}</span>
      {hint && <span className="text-[0.6875rem] text-faint">{hint}</span>}
    </div>
  )
}

/**
 * Өсөлт.
 *
 * ⚠️ Өмнөх нь ТЭГ бол хувь тооцох боломжгүй — «∞%» эсвэл «+100%» гэж
 * бичих нь хоёулаа худал. Тийм үед юу болсныг үгээр хэлнэ.
 */
function Delta({ now, before, suffix }: { now: number; before: number; suffix?: string }) {
  if (before === 0) {
    return <span className="text-xs text-muted">{now > 0 ? 'Өмнөх үе хоосон' : '—'}</span>
  }

  const percent = Math.round(((now - before) / before) * 100)
  return (
    <span className={`text-xs tnum ${percent >= 0 ? 'text-foreground-soft' : 'text-muted'}`}>
      {percent >= 0 ? '+' : ''}
      {percent}% {suffix}
    </span>
  )
}
