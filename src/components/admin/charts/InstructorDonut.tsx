'use client'

import { useRef, useState } from 'react'
import { DialogFrame } from '../Dialog'
import { Table, Td, Th } from '../ui'
import { formatMnt } from '@/lib/format'
import type { InstructorRevenue, Range } from '@/lib/admin/revenue'
import { seriesColor } from './palette'

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
   Палитр зургаан өнгөтэй, дараа нь эргэнэ (§ palette.ts). Долоо дахь багш
   эхнийхтэй ижил өнгөтэй болно — тиймээс тайлбар нь нэрийг ҮРГЭЛЖ бичнэ,
   өнгө нь ганц тулгуур биш.
   ─────────────────────────────────────────────────────────────────────── */

const R = 54
const CIRCUMFERENCE = 2 * Math.PI * R
/** Нумуудын хоорондох завсар (нэгжээр). Хоёр зэргэлдээ өнгө нийлэхээс сэргийлнэ. */
const GAP = 2

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
  const arcs = shown.map((row, index) => ({
    row,
    index,
    length: (row.studio / total) * CIRCUMFERENCE,
    offset:
      (shown.slice(0, index).reduce((sum, before) => sum + before.studio, 0) / total) *
      CIRCUMFERENCE,
    color: seriesColor(index),
  }))

  const selected = arcs.find((arc) => arc.row.id === active) ?? null

  return (
    // Бүхэлдээ дарагдана — § RevenueBars -тай нэг зан үйл.
    <div
      className="flex cursor-pointer flex-col items-center gap-8 md:flex-row md:items-center md:gap-10"
      onClick={() => dialog.current?.showModal()}
    >
      {/* ── Бөгж ── */}
      <div className="relative shrink-0">
        <svg viewBox="0 0 140 140" className="size-40 -rotate-90 sm:size-44" role="img" aria-label="Танхимын орлогын хуваарилалт">
          {arcs.map((arc) => {
            const dim = active !== null && arc.row.id !== active
            return (
              <circle
                key={arc.row.id}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={arc.color}
                strokeWidth={arc.row.id === active ? 20 : 15}
                strokeDasharray={`${Math.max(arc.length - GAP, 0.5)} ${CIRCUMFERENCE}`}
                strokeDashoffset={-arc.offset}
                className="cursor-pointer transition-[opacity,stroke-width] duration-200"
                opacity={dim ? 0.28 : 1}
                onMouseEnter={() => setActive(arc.row.id)}
                onMouseLeave={() => setActive(null)}
              />
            )
          })}
        </svg>

        {/* Голын уншилт. Хоосон байх нь боломж алдсан хэрэг — юу ч
            сонгоогүй үед НИЙТ дүн сууна. */}
        {/* `px-7` нь дурын тоо биш: бөгжний ЦООХОН нь ойролцоогоор 106px
            (гадна 160px, хана 15). Дүн нь түүнээс хэтэрвэл нумын дээгүүр
            гарч, хоёулаа уншигдахаа болино. Хоёр оронтой саяыг ч багтаахын
            тулд үсгийн хэмжээ утсан дээр нэг шат жижиг. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-7 text-center">
          <span className="truncate text-[0.6875rem] text-muted">
            {selected ? selected.row.name : 'Нийт'}
          </span>
          <span className="text-base font-semibold tnum leading-tight sm:text-lg">
            {formatMnt(selected ? selected.row.studio : total)}
          </span>
          {selected && (
            <span className="text-[0.6875rem] text-faint tnum">
              {Math.round((selected.row.studio / total) * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* ── Тайлбар ── */}
      <ul className="flex w-full min-w-0 flex-col">
        {arcs.map((arc) => (
          <li key={arc.row.id} className="border-b border-line last:border-b-0">
            <button
              type="button"
              className="admin-row flex w-full items-center gap-3 py-2.5 text-left outline-none"
              onMouseEnter={() => setActive(arc.row.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(arc.row.id)}
              onBlur={() => setActive(null)}
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full transition-transform duration-200"
                style={{
                  background: arc.color,
                  transform: arc.row.id === active ? 'scale(1.5)' : 'scale(1)',
                }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{arc.row.name}</span>
                {/* Ганц хичээлийн орлого нь ТАНХИМЫН КУРСээс тусдаа мөнгө —
                    бөгжинд ордоггүй тул энд ил хэлж өгнө, эс бөгөөс энэ
                    багшийн жинхэнэ хувь нэмэр дутуу уншигдана. */}
                {arc.row.session > 0 && (
                  <span className="block truncate text-[0.6875rem] text-faint">
                    + {formatMnt(arc.row.session)} ганц хичээл
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-medium tnum">{formatMnt(arc.row.studio)}</span>
                <span className="block text-[0.6875rem] text-muted tnum">
                  {Math.round((arc.row.studio / total) * 100)}%
                </span>
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
        <div className="flex flex-col gap-0.5 rounded-[3px] border border-line bg-surface-2 px-4 py-3">
          <span className="text-[0.6875rem] text-muted">Танхимын анги</span>
          <span className="text-base font-semibold tnum">{formatMnt(studioTotal)}</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-[3px] border border-line bg-surface-2 px-4 py-3">
          <span className="text-[0.6875rem] text-muted">Ганц хичээл</span>
          <span className="text-base font-semibold tnum">{formatMnt(sessionTotal)}</span>
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
