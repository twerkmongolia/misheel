'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Select, Table, Td, Th, type Tone } from './ui'
import { DialogFrame } from './Dialog'
import { setUserRole } from '@/actions/admin'
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
 * Мөр бүрд имэйл, утас, эрх засах хэсгийг шахаж багтаавал хүснэгт нарийсаж,
 * уншихад хэцүү болно. Тиймээс мөр нь ХАРАХ (нэр, утас, эрх), цонх нь бүрэн
 * мэдээлэл ба ЗАСАХ үүрэгтэй.
 */
export function CustomerTable({
  customers,
  canEdit,
  openId,
}: {
  customers: CustomerRow[]
  canEdit: boolean
  /** Эрх хадгалсны дараа цонх байсан газраа эргэж нээгдэнэ. */
  openId?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [selected, setSelected] = useState<CustomerRow | null>(
    () => customers.find((customer) => customer.id === openId) ?? null,
  )

  useEffect(() => {
    if (openId && ref.current && !ref.current.open) ref.current.showModal()
  }, [openId])

  const open = (customer: CustomerRow) => {
    setSelected(customer)
    ref.current?.showModal()
  }

  return (
    <>
      <Table minWidth={640}>
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

      <dialog ref={ref} className="admin-dialog" onClick={(event) => {
          // Бүрхүүл дээр дарахад хаана — `<dialog>` дэвсгэрээ ч өөртөө тооцдог
          if (event.target === ref.current) ref.current?.close()
        }}>
        {selected && (
          <DialogFrame
            title={selected.name ?? 'Нэргүй хэрэглэгч'}
            subtitle={roles[selected.role]}
            onClose={() => ref.current?.close()}
          >
            <div className="flex flex-col gap-5">
              <dl className="flex flex-col">
                <Row label="Имэйл" value={selected.email} mono />
                <Row label="Утас" value={selected.phone} />
                <Row label="Бүртгүүлсэн" value={formatDate(selected.created_at, 'mn')} />
                <Row label="Эрх" value={roles[selected.role]} />
              </dl>

              {canEdit ? (
                <form
                  action={setUserRole}
                  className="flex flex-wrap items-end justify-end gap-2 border-t border-line pt-4"
                >
                  <input type="hidden" name="user_id" value={selected.id} />
                  <label className="flex flex-1 flex-col gap-1.5 sm:flex-none">
                    <span className="text-xs font-medium text-foreground-soft">Эрх солих</span>
                    <Select name="role" defaultValue={selected.role} className="sm:w-40">
                      {(Object.keys(roles) as UserRole[]).map((role) => (
                        <option key={role} value={role}>
                          {roles[role]}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <Button type="submit" variant="primary">
                    Хадгалах
                  </Button>
                </form>
              ) : (
                <p className="border-t border-line pt-4 text-sm text-muted">
                  Эрх өөрчлөх боломж зөвхөн админд нээлттэй.
                </p>
              )}
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
      <dt className="shrink-0 text-xs font-semibold tracking-[0.06em] text-muted uppercase">
        {label}
      </dt>
      <dd className={`min-w-0 text-right text-sm break-all ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </dd>
    </div>
  )
}
