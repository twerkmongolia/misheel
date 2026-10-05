'use client'

import { useState } from 'react'
import { Delta } from '../ui'
import { compactMnt, formatMnt } from '@/lib/format'
import { niceTicks } from '@/lib/admin/chart'
import { STREAMS, STREAM_LABEL, type Stream } from '@/lib/admin/revenue'

/* ───────────────────────────────────────────────────────────────────────────
   ОРЛОГО УРСГАЛААР — ГРАДИЕНТ БАГАНА

   Дөрвөн урсгал (онлайн анги, танхим анги, ганц хичээл, дэлгүүр), тус бүр
   НЭГ багана. Хажуугийн муруй нь «хэзээ», энэ нь «юунаас» гэдгийг хэлнэ —
   хоёулаа ижил цонхыг харуулдаг тул нэг дор харахад орлого юунаас, ямар
   хэмнэлээр орж ирснийг уншина.

   Багана бүгд НЭГ градиенттай: урсгалыг шошго нэрлэнэ, өнгө нь энд утга
   биш хэмжээг онцолно. Дөрвөн өөр өнгө нь хажуугийн муруйн өнгөтэй
   (цэнхэр = «энэ үе») мөргөлдөж, «цэнхэр багана = энэ үе» гэсэн худал
   холбоо үүсгэнэ.
   ─────────────────────────────────────────────────────────────────────── */

type Totals = Record<Stream, number>

export function StreamBars({ totals, previous }: { totals: Totals; previous: Totals }) {
  const [active, setActive] = useState<Stream | null>(null)

  const ticks = niceTicks(Math.max(...STREAMS.map((key) => totals[key]), 0))
  const top = ticks[ticks.length - 1] || 1

  const all = STREAMS.reduce((sum, key) => sum + totals[key], 0)
  const allBefore = STREAMS.reduce((sum, key) => sum + previous[key], 0)

  const value = active ? totals[active] : all
  const before = active ? previous[active] : allBefore
  const delta = before > 0 ? Math.round(((value - before) / before) * 100) : null

  return (
    <div className="flex flex-col gap-5">
      <div className="min-w-0">
        <p className="truncate text-[0.8125rem] text-muted">
          {active ? STREAM_LABEL[active] : 'Бүх урсгал'}
          {active && all > 0 && <span className="tnum"> · {Math.round((value / all) * 100)}%</span>}
        </p>
        <p className="t-num mt-1 text-[1.75rem] tnum">{formatMnt(value)}</p>
        <p className="mt-1 flex items-baseline gap-2 text-[0.8125rem] text-muted">
          <Delta value={delta} className="text-[0.8125rem]" />
          <span>өмнөх үеэс</span>
        </p>
      </div>

      <div className="flex gap-3">
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
          <div className="relative h-60 sm:h-72" onMouseLeave={() => setActive(null)}>
            {ticks.map((tick) => (
              <span
                key={tick}
                aria-hidden="true"
                className="absolute inset-x-0 h-px bg-line"
                style={{ top: `${100 - (tick / top) * 100}%` }}
              />
            ))}

            <div className="absolute inset-0 flex">
              {STREAMS.map((key) => {
                const amount = totals[key]
                const dim = active !== null && active !== key
                return (
                  /* Багана бүр `button`: хулганагүй хүн Tab-аар явахад ч
                     дээрх уншилт солигдоно. */
                  <button
                    key={key}
                    type="button"
                    aria-label={`${STREAM_LABEL[key]} — ${formatMnt(amount)}`}
                    className="flex h-full min-w-0 flex-1 cursor-default items-end justify-center rounded-sm"
                    onMouseEnter={() => setActive(key)}
                    onFocus={() => setActive(key)}
                    onBlur={() => setActive(null)}
                  >
                    {amount > 0 ? (
                      /* Цагаан хүрээ нь баганыг торны шугамаас ТАСАЛЖ авна —
                         градиентийн бараан ёроол нь эс бөгөөс дэвсгэртэй
                         уусдаг. */
                      <span
                        className="block w-5 rounded-t-full transition-opacity duration-150 sm:w-6"
                        style={{
                          height: `${Math.max((amount / top) * 100, 2)}%`,
                          background: 'linear-gradient(to top, var(--hot-to), var(--hot-from))',
                          boxShadow: '0 0 0 1.5px rgb(255 255 255 / 0.85)',
                          opacity: dim ? 0.35 : 1,
                        }}
                      />
                    ) : (
                      <span className="block h-0.5 w-5 rounded-full bg-surface-3 sm:w-6" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div aria-hidden="true" className="mt-2 flex">
            {STREAMS.map((key) => (
              <span
                key={key}
                className={`min-w-0 flex-1 px-0.5 text-center text-[0.6875rem] leading-tight transition-colors ${
                  active === key ? 'text-foreground' : 'text-faint'
                }`}
              >
                {STREAM_LABEL[key]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
