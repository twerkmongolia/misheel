'use client'

import { useRef, useState } from 'react'
import { DialogFrame } from '../Dialog'
import { Table, Td, Th } from '../ui'
import { formatMnt } from '@/lib/format'
import type { InstructorRevenue, Range } from '@/lib/admin/revenue'
import { seriesColor, seriesInk } from './palette'

/* ───────────────────────────────────────────────────────────────────────────
   ТАНХИМЫН ОРЛОГО БАГШААР

   Асуулт нь «хэн хэдийг авчирсан бэ» — өөрөөр хэлбэл ХУВЬ. Бөгж нь түүнийг
   шууд харуулна: нэг хүн талыг эзэлж байвал тэр нүдэнд шууд ил.

   ── Өнгө нь хоёр газар, НЭГ утгатай ─────────────────────────────────────
   Бөгжний нум ба тайлбар дээрх дугуй нь ижил өнгөтэй. Тиймээс «аль нь аль
   вэ» гэсэн асуулт огт үүсэхгүй — дарж шалгах шаардлагагүй. Дарах нь
   нэмэлт: аль ч талыг нь идэвхжүүлэхэд нөгөө тал нь хамт тодорно, бөгжний
   голд тухайн багшийн дүн гарна.

   ── Багш ЗУРГААС олон бол ───────────────────────────────────────────────
   Палитр долоон өнгөтэй, дараа нь эргэнэ (§ palette.ts). Найм дахь багш
   эхнийхтэй ижил өнгөтэй болно — тиймээс тайлбар нь нэрийг ҮРГЭЛЖ бичнэ,
   өнгө нь ганц тулгуур биш.
   ─────────────────────────────────────────────────────────────────────── */

/* Бөгжний хэмжээс (`viewBox` 200). Хана нь 26 нэгж — диаметрийн ~13%:
   нимгэн бол өнгө нь шугам болж ялгагдахгүй, зузаан бол голын уншилт
   багтахгүй. Идэвхтэй нум нь гадагшаа `POP` -оор тэлнэ. */
const C = 100
const OUTER = 88
const INNER = 62
const POP = 7

/**
 * Цагийн зүүний дагуу, оройгоос (-90°) эхэлсэн өнцгийн цэг.
 *
 * ⚠️ ЗААВАЛ дугуйруулна. `Math.cos/sin` нь IEEE-гээр яг тодорхойлогдоогүй
 * (нэмэх, хуваах шиг биш) — Node, хөтөч хоёр сүүлийн оронгоороо зөрж
 * (`99.99999999999999` ба `100`), `d` атрибут нь hydration дээр таарахгүй
 * болно. Аравтын хоёр орон нь 224px-ийн бөгжинд пикселийн 1/100.
 */
function polar(radius: number, turn: number): [number, number] {
  const angle = turn * 2 * Math.PI - Math.PI / 2
  const round = (value: number) => Math.round(value * 100) / 100
  return [round(C + radius * Math.cos(angle)), round(C + radius * Math.sin(angle))]
}

/**
 * Цагираган хэсэг — нумаар хүрээлэгдсэн ДҮҮРГЭЛТ (зураас биш).
 *
 * Өмнө нь нум бүр зузаан `stroke` -той тойрог байв. Тэр нь хэсэг бүрийг
 * цагаан хүрээгээр тойруулах боломжгүй (зураасны зураас гэж үгүй) — хөрш
 * өнгөнүүд хоорондоо уусна. Дүүргэлт нь өөрийн хүрээтэй.
 */
function sector(from: number, to: number, outer: number): string {
  // Ганц багш = бүтэн цагираг. Нэг нум 0 → 1 эргэлт хийвэл эхлэл, төгсгөл
  // нь давхцаж SVG юу ч зурахгүй — хоёр тойргийг `evenodd` -оор хасна.
  if (to - from >= 0.9999) {
    return (
      `M${C - outer},${C}a${outer},${outer} 0 1,1 ${outer * 2},0a${outer},${outer} 0 1,1 ${-outer * 2},0Z` +
      `M${C - INNER},${C}a${INNER},${INNER} 0 1,0 ${INNER * 2},0a${INNER},${INNER} 0 1,0 ${-INNER * 2},0Z`
    )
  }
  const large = to - from > 0.5 ? 1 : 0
  const [ax, ay] = polar(outer, from)
  const [bx, by] = polar(outer, to)
  const [cx, cy] = polar(INNER, to)
  const [dx, dy] = polar(INNER, from)
  return `M${ax},${ay}A${outer},${outer} 0 ${large},1 ${bx},${by}L${cx},${cy}A${INNER},${INNER} 0 ${large},0 ${dx},${dy}Z`
}

export function InstructorDonut({ rows, range }: { rows: InstructorRevenue[]; range: Range }) {
  const [active, setActive] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  const shown = rows.filter((row) => row.studio > 0)
  const total = shown.reduce((sum, row) => sum + row.studio, 0)

  if (total === 0) return null

  /* Нум бүрийн эхлэл нь өмнөх бүгдийн нийлбэр. Хуримтлуулагч хувьсагчаар
     биш, ӨӨРӨӨС нь тооцно: рендерийн дотор хувьсагч өөрчлөх нь React-ийн
     хөрвүүлэгчийн хувьд зөвшөөрөгдөхгүй бөгөөд шалтгаан нь бодитой —
     жагсаалт хэсэгчлэн дахин зурагдвал хуримтлал гажина.

     Квадрат зардал нь энд утгагүй: багш нарын тоо аравны нэгжээр
     хэмжигдэнэ. */
  const arcs = shown.map((row, index) => {
    const from = shown.slice(0, index).reduce((sum, before) => sum + before.studio, 0) / total
    return {
      row,
      index,
      from,
      to: from + row.studio / total,
      color: seriesColor(index),
      ink: seriesInk(index),
    }
  })

  const selected = arcs.find((arc) => arc.row.id === active) ?? null

  return (
    // Бүхэлдээ дарагдана — § RevenueArea -тай нэг зан үйл.
    <div className="flex cursor-pointer flex-col items-center gap-6" onClick={() => dialog.current?.showModal()}>
      {/* ── Бөгж ── */}
      <div className="relative shrink-0">
        <svg viewBox="0 0 200 200" className="size-56 overflow-visible" role="img" aria-label="Танхимын орлогын хуваарилалт">
          {arcs.map((arc) => {
            const on = arc.row.id === active
            return (
              <path
                key={arc.row.id}
                d={sector(arc.from, arc.to, on ? OUTER + POP : OUTER)}
                fill={arc.color}
                fillRule="evenodd"
                /* Цагаан хүрээ нь хөрш хоёр өнгийг ТАСАЛНА — ногоон, шар
                   зэрэг гэрэлтэй өнгө зэрэгцэхэд хил нь эс бөгөөс уусна. */
                stroke="#F1F3F5"
                strokeWidth={1.75}
                strokeLinejoin="round"
                className="cursor-pointer transition-opacity duration-200"
                opacity={active !== null && !on ? 0.35 : 1}
                onMouseEnter={() => setActive(arc.row.id)}
                onMouseLeave={() => setActive(null)}
              />
            )
          })}
        </svg>

        {/* Голын уншилт. Хоосон байх нь боломж алдсан хэрэг — юу ч
            сонгоогүй үед НИЙТ дүн сууна. Өргөн нь цоорхойн (124/200)
            дотор: нэр урт бол тайрагдана, нумын дээгүүр гарахгүй. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
          <span className="max-w-full truncate text-[1.0625rem] font-medium">
            {selected ? selected.row.name : 'Нийт'}
          </span>
          <span className="mt-0.5 text-[0.875rem] text-foreground-soft tnum">
            {formatMnt(selected ? selected.row.studio : total)}
          </span>
          {selected && (
            <span className="text-[0.75rem] text-muted tnum">
              {Math.round((selected.row.studio / total) * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* ── Тайлбар ── */}
      {/* Самбарын дотоод зайг (`p-5`) буцааж татна — мөрийн hover, хуваах
          зураас нь картын ирмэгээс ирмэг хүртэл үргэлжилнэ. */}
      <ul className="-mx-5 -mb-5 flex w-[calc(100%+2.5rem)] min-w-0 flex-col border-t border-line">
        {arcs.map((arc) => (
          <li key={arc.row.id} className="border-b border-line last:border-b-0">
            <button
              type="button"
              className="admin-row flex w-full items-center gap-3 px-5 py-3 text-left outline-none"
              onMouseEnter={() => setActive(arc.row.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(arc.row.id)}
              onBlur={() => setActive(null)}
            >
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full transition-transform duration-200"
                style={{
                  background: arc.color,
                  transform: arc.row.id === active ? 'scale(1.5)' : 'scale(1)',
                }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.9375rem]">{arc.row.name}</span>
                {/* Ганц хичээлийн орлого нь ТАНХИМЫН КУРСээс тусдаа мөнгө —
                    бөгжинд ордоггүй тул энд ил хэлж өгнө, эс бөгөөс энэ
                    багшийн жинхэнэ хувь нэмэр дутуу уншигдана. */}
                {arc.row.session > 0 && (
                  <span className="block truncate text-[0.75rem] text-faint">
                    + {formatMnt(arc.row.session)} ганц хичээл
                  </span>
                )}
              </span>
              <span className="shrink-0 text-[0.875rem] font-medium tnum">{formatMnt(arc.row.studio)}</span>
              {/* Хувь нь нумынхаа ӨНГӨТЭЙ бөмбөлөг — жагсаалт, бөгж хоёрыг
                  нүдээр холбоно. */}
              <span
                className="w-12 shrink-0 rounded-full py-0.5 text-center text-[0.75rem] font-medium tnum"
                style={{ background: arc.color, color: arc.ink }}
              >
                {Math.round((arc.row.studio / total) * 100)}%
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        className="admin-dialog"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close()
        }}
      >
        <DialogFrame
          title="Багш нарын тайлан"
          subtitle={range.label}
          onClose={() => dialog.current?.close()}
        >
          <Report rows={rows} studioTotal={total} />
        </DialogFrame>
      </dialog>
    </div>
  )
}

/**
 * Тайлан нь бөгжөөс ИЛҮҮ зүйл хэлнэ: бөгж нь зөвхөн танхимын курсыг
 * харуулдаг (тэр нь асуулт байсан), харин хүснэгт нь багш бүрийн БҮХ
 * хувь нэмрийг — ганц хичээл оруулаад — нэг дор жагсаана. Тиймээс зөвхөн
 * ганц хичээл зааж байсан багш ч энд гарч ирнэ.
 */
function Report({ rows, studioTotal }: { rows: InstructorRevenue[]; studioTotal: number }) {
  const grand = rows.reduce((sum, row) => sum + row.total, 0)
  const sessionTotal = rows.reduce((sum, row) => sum + row.session, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-0.5 rounded-lg border border-line bg-surface-2 px-4 py-3">
          <span className="text-[0.75rem] text-muted">Танхимын анги</span>
          <span className="text-[1rem] font-medium tnum">{formatMnt(studioTotal)}</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-lg border border-line bg-surface-2 px-4 py-3">
          <span className="text-[0.75rem] text-muted">Ганц хичээл</span>
          <span className="text-[1rem] font-medium tnum">{formatMnt(sessionTotal)}</span>
        </div>
      </div>

      <Table minWidth={460}>
        <thead>
          <tr>
            <Th>Багш</Th>
            <Th align="right">Танхим анги</Th>
            <Th align="right">Ганц хичээл</Th>
            <Th align="right">Нийт</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <Td className="font-medium">
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    /* Өнгө нь бөгжнийхтэй таарах ёстой. Бөгж нь `studio > 0`
                       -ээр шүүгдсэн жагсаалтыг зурдаг тул зөвхөн ганц хичээл
                       зааж байсан багшид нум байхгүй — өнгө нь ч утгагүй. */
                    style={{ background: row.studio > 0 ? seriesColor(index) : 'var(--faint)' }}
                  />
                  {row.name}
                </span>
              </Td>
              <Td align="right" label="Танхим анги" className="tnum">
                {row.studio > 0 ? formatMnt(row.studio) : '—'}
              </Td>
              <Td align="right" label="Ганц хичээл" className="tnum">
                {row.session > 0 ? formatMnt(row.session) : '—'}
              </Td>
              <Td align="right" label="Нийт" className="font-medium tnum">
                {formatMnt(row.total)}
                <span className="ml-2 text-[0.6875rem] text-muted">
                  {grand > 0 ? `${Math.round((row.total / grand) * 100)}%` : ''}
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
