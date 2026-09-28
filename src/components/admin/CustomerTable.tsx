'use client'

import { useRef, useState } from 'react'
import { Badge, Table, Td, Th, type Tone } from './ui'
import { DialogFrame } from './Dialog'
import { formatDate } from '@/lib/format'
import type { UserRole } from '@/lib/supabase/database.types'

export type CustomerRow = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  role: UserRole
  created_at: string
}

const roles: Record<UserRole, string> = {
  customer: 'Хэрэглэгч',
  instructor: 'Багш',
  staff: 'Ажилтан',
  admin: 'Админ',
}

const tones: Record<UserRole, Tone> = {
  customer: 'neutral',
  instructor: 'neutral',
  staff: 'info',
  admin: 'info',
}

/**
 * Хэрэглэгчийн жагсаалт — мөр дээр дарахад дэлгэрэнгүй цонх нээгдэнэ.
 *
 * Имэйл, бүртгэлийн дэлгэрэнгүй нь цонхонд амьдарна — мөр бүрд шахвал
 * хүснэгт нарийсаж, уншихад хэцүү болно.
 *
 * ── Эрх нь энд зөвхөн ХАРАГДАНА ────────────────────────────────────────
 * Урьд нь мөр бүр дээр эрх солих сонголт сууж байв. Тэр нь хоёр асуудалтай:
 * өдөр тутам гүйлгэж хардаг жагсаалт дээр хамгийн ноцтой үйлдэл хамгийн
 * ойрхон зогсож, санамсаргүй дарагдах зай үлдээдэг; мөн эрх олгох нь аль
 * хэдийн ӨӨРИЙН хуудастай (§ admin/access — зөвхөн админд, `grantAccess`).
 * Нэг үйлдэл хоёр газар байвал аль нь үнэн болох нь эргэлзээтэй болно.
 *
 * Форм алга болсноор энэ цонх ЮУ Ч бичихээ больсон — тиймээс хаяг солигдох
 * шалтгаан ч үгүй: `FormDialog` -ийн хаах хамгаалалт энд хэрэггүй
 * (§ CLAUDE.md «Server Action доторх redirect»).
 */
export function CustomerTable({ customers }: { customers: CustomerRow[] }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [selected, setSelected] = useState<CustomerRow | null>(null)

  const open = (customer: CustomerRow) => {
    setSelected(customer)
    ref.current?.showModal()
  }

  return (
    <>
      <Table minWidth={720}>
        <thead>
          <tr>
            <Th>Нэр</Th>
            <Th>Утас</Th>
            <Th>Бүртгүүлсэн</Th>
            <Th align="right">Эрх</Th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              onClick={() => open(customer)}
              className="cursor-pointer"
              // Хулганагүй хүн ч мөрийг нээж чадах ёстой
              tabIndex={0}
              role="button"
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  open(customer)
                }
              }}
            >
              <Td className="font-medium">{customer.name ?? '—'}</Td>
              <Td className="text-foreground-soft" label="Утас">
                {customer.phone ?? '—'}
              </Td>
              <Td className="whitespace-nowrap text-foreground-soft" label="Бүртгүүлсэн">
                {formatDate(customer.created_at, 'mn')}
              </Td>
              <Td align="right" label="Эрх">
                <Badge tone={tones[customer.role]}>{roles[customer.role]}</Badge>
              </Td>
            </tr>
          ))}
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
            title={selected.name ?? 'Нэргүй хэрэглэгч'}
            subtitle={roles[selected.role]}
            onClose={() => ref.current?.close()}
          >
            <dl className="flex flex-col">
              <Row label="Имэйл" value={selected.email} mono />
              <Row label="Утас" value={selected.phone} />
              <Row label="Бүртгүүлсэн" value={formatDate(selected.created_at, 'mn')} />
              <Row label="Эрх" value={roles[selected.role]} />
            </dl>
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
