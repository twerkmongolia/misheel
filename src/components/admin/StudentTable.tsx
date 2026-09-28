'use client'

import { useRef, useState } from 'react'
import { Badge, Table, Td, Th, type Tone } from './ui'
import { DialogFrame } from './Dialog'
import { formatDate, formatMnt } from '@/lib/format'
import type { EnrollmentStatus } from '@/lib/supabase/database.types'

export type StudentEnrollment = {
  id: string
  course: string
  online: boolean
  status: EnrollmentStatus
  price_paid: number | null
  created_at: string
}

export type StudentRow = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  created_at: string
  /** Шинэ нь эхэнд — хамгийн сүүлд юу авсныг эхлээд хардаг. */
  enrollments: StudentEnrollment[]
}

const statuses: Record<EnrollmentStatus, string> = {
  pending_payment: 'Төлбөр хүлээж буй',
  active: 'Идэвхтэй',
  completed: 'Дууссан',
  cancelled: 'Цуцлагдсан',
}

const tones: Record<EnrollmentStatus, Tone> = {
  pending_payment: 'warn',
  active: 'good',
  completed: 'neutral',
  cancelled: 'danger',
}

/**
 * Сурагчдын жагсаалт — хичээл авсан хүн бүр НЭГ мөр.
 *
 * ── Яагаад элсэлт биш ХҮН мөр эзэлдэг вэ ───────────────────────────────
 * Элсэлтээр жагсаавал гурван анги авсан хүн гурван мөр эзэлж, «хэдэн
 * сурагчтай вэ» гэдэг асуултад хүснэгт өөрөө худал хариулна. Асуулт нь
 * үргэлж хүнээр эхэлдэг — «энэ хүн юу авсан бэ» — тиймээс хүн нэг мөр,
 * авсан зүйл нь цонхон дотор.
 *
 * ── Төлөв нь ХУРААНГУЙГААР харагдана ───────────────────────────────────
 * Мөр дээр зөвхөн идэвхтэйн тоо гарна: ажилтны хайдаг зүйл нь «одоо хэд нь
 * явж байна» гэдэг. Цуцлагдсан, дууссаныг нь цонх дотор бүтнээр нь үзнэ.
 */
export function StudentTable({ students }: { students: StudentRow[] }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [selected, setSelected] = useState<StudentRow | null>(null)

  const open = (student: StudentRow) => {
    setSelected(student)
    ref.current?.showModal()
  }

  return (
    <>
      <Table minWidth={760}>
        <thead>
          <tr>
            <Th>Нэр</Th>
            <Th>Утас</Th>
            <Th>Анги</Th>
            <Th align="right">Сүүлд авсан</Th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const live = student.enrollments.filter(
              (item) => item.status === 'active' || item.status === 'completed',
            ).length
            const pending = student.enrollments.filter(
              (item) => item.status === 'pending_payment',
            ).length

            return (
              <tr
                key={student.id}
                onClick={() => open(student)}
                className="cursor-pointer"
                // Хулганагүй хүн ч мөрийг нээж чадах ёстой
                tabIndex={0}
                role="button"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    open(student)
                  }
                }}
              >
                <Td className="font-medium">{student.name ?? '—'}</Td>
                <Td className="text-foreground-soft" label="Утас">
                  {student.phone ?? '—'}
                </Td>
                <Td label="Анги">
                  {/* Хүлээгдэж буй төлбөрийг ИЛ нэрлэнэ. Урьд нь «0 / 2» гэж
                      бичдэг байсан нь хоёр дахь тоо юу болохыг тайлбаргүй
                      орхиж, «төлбөр хүлээгдэж байна» гэсэн ХАМГИЙН чухал
                      мэдээлэл алга болдог байв — яг тэр хүн рүү залгах
                      шаардлагатай байдаг. */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tabular-nums">{live}</span>
                    {pending > 0 && <Badge tone="warn">{pending} хүлээгдэж буй</Badge>}
                  </div>
                </Td>
                <Td align="right" className="whitespace-nowrap text-foreground-soft" label="Сүүлд авсан">
                  {student.enrollments[0]
                    ? formatDate(student.enrollments[0].created_at, 'mn')
                    : '—'}
                </Td>
              </tr>
            )
          })}
        </tbody>
      </Table>

      <dialog
        ref={ref}
        className="admin-dialog"
        onClick={(event) => {
          // Бүрхүүл дээр дарахад хаана — `<dialog>` дэвсгэрээ ч өөртөө тооцдог
          if (event.target === ref.current) ref.current?.close()
        }}
      >
        {selected && (
          <DialogFrame
            title={selected.name ?? 'Нэргүй сурагч'}
            subtitle={`${selected.enrollments.length} анги`}
            onClose={() => ref.current?.close()}
          >
            <div className="flex flex-col gap-5">
              <dl className="flex flex-col">
                <Row label="Имэйл" value={selected.email} mono />
                <Row label="Утас" value={selected.phone} />
                <Row label="Бүртгүүлсэн" value={formatDate(selected.created_at, 'mn')} />
              </dl>

              <div className="flex flex-col gap-2 border-t border-line pt-4">
                <h3 className="text-xs font-semibold tracking-[0.01em] text-muted">
                  Авсан анги
                </h3>

                {selected.enrollments.length === 0 ? (
                  <p className="text-sm text-muted">Одоогоор анги аваагүй байна.</p>
                ) : (
                  <ul className="flex flex-col">
                    {selected.enrollments.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line py-2.5 last:border-b-0"
                      >
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-sm font-medium">{item.course}</span>
                          <span className="text-xs text-muted">
                            {item.online ? 'Онлайн' : 'Танхим'} ·{' '}
                            {formatDate(item.created_at, 'mn')}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {/* Төлсөн дүн нь элсэлтийн мөрөнд ХАДГАЛАГДСАН
                              байдаг — ангийн одоогийн үнээс биш тэндээс
                              уншина: үнэ хожим өөрчлөгдсөн ч хүн юу төлснөө
                              харах ёстой. */}
                          {item.price_paid !== null && (
                            <span className="text-xs tabular-nums text-foreground-soft">
                              {formatMnt(item.price_paid)}
                            </span>
                          )}
                          <Badge tone={tones[item.status]}>{statuses[item.status]}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </DialogFrame>
        )}
      </dialog>
    </>
  )
}

function Row({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <dt className="shrink-0 text-xs font-semibold tracking-[0.01em] text-muted">{label}</dt>
      <dd className={`min-w-0 text-right text-sm break-all ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </dd>
    </div>
  )
}
