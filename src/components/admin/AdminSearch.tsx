'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { AdminIcon, type NavIcon } from './AdminIcon'

/* ───────────────────────────────────────────────────────────────────────────
   ТОЛГОЙ МӨРИЙН ХАЙЛТ

   Удирдлагад «бүх зүйлээс хайдаг» нэг индекс байхгүй — хуудас бүр өөрийн
   `?q=` -тэй. Тиймээс энэ талбар өөрөө хайдаггүй, ХААНА хайхыг санал
   болгоно: «9911» гэж бичихэд «Захиалга дотроос», «Хэрэглэгч дотроос» гэх
   мэт сонголт гарч, дарвал тухайн хуудсыг шүүлттэй нь нээнэ. Ингэснээр
   үр дүн нь хуудасны ӨӨРИЙН хүснэгтэд, өөрийн хуудаслалт, үйлдэлтэйгээ
   гарна — хоёр дахь хайлтын үр дүнгийн дэлгэц бичих шаардлагагүй.

   Хуудасны нэр таарвал түүнийг ч мөн санал болгоно — цэсээр гүйлгэхээс
   «бар» гэж бичээд Enter дарах нь хурдан.
   ─────────────────────────────────────────────────────────────────────── */

/** `?q=` -ийг бодитоор уншдаг хуудсууд. Шинэ хуудас нэмбэл энд бүртгэнэ. */
const SCOPES: { path: string; label: string; icon: NavIcon }[] = [
  { path: '/admin/orders', label: 'Захиалга', icon: 'receipt' },
  { path: '/admin/customers', label: 'Хэрэглэгч', icon: 'person' },
  { path: '/admin/students', label: 'Сурагч', icon: 'check' },
  { path: '/admin/products', label: 'Бараа', icon: 'tag' },
]

type Page = { href: string; label: string; icon: NavIcon }
type Option = { href: string; label: string; hint: string; icon: NavIcon; group: 'page' | 'scope' }

export function AdminSearch({ pages, className = '' }: { pages: Page[]; className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const listId = useId()

  const [term, setTerm] = useState('')
  const [cursor, setCursor] = useState(0)
  /* Нээсэн үеийн зам. Хуудас солигдонгуут жагсаалт өөрөө хаагдана —
     effect-гүйгээр (§ AdminShell-ийн «Цэс» самбартай ижил хээ). */
  const [openAt, setOpenAt] = useState<string | null>(null)

  const query = term.trim()
  const needle = query.toLocaleLowerCase('mn')

  const options: Option[] = [
    ...pages
      .filter((page) => !needle || page.label.toLocaleLowerCase('mn').includes(needle))
      .map((page) => ({ ...page, hint: 'Хуудас', group: 'page' as const })),
    ...(query
      ? SCOPES.map((scope) => ({
          href: `${scope.path}?q=${encodeURIComponent(query)}`,
          label: `«${query}»`,
          hint: `${scope.label} дотроос`,
          icon: scope.icon,
          group: 'scope' as const,
        }))
      : []),
  ]

  const open = openAt === pathname && options.length > 0
  const active = Math.min(cursor, options.length - 1)

  const close = () => {
    setOpenAt(null)
    setCursor(0)
  }

  const go = (option: Option) => {
    close()
    setTerm('')
    router.push(option.href)
  }

  const optionId = (index: number) => `${listId}-${index}`

  return (
    <div
      className={`relative ${className}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close()
      }}
    >
      <label className="admin-search flex h-10 items-center gap-2.5 rounded-md border border-transparent bg-surface-2 px-3 text-muted transition-colors focus-within:border-primary">
        <AdminIcon name="search" className="h-[1.125rem] w-[1.125rem] shrink-0" />
        <span className="sr-only">Хайх</span>
        <input
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open ? optionId(active) : undefined}
          value={term}
          placeholder="Хайх — захиалга, хэрэглэгч, хуудас…"
          className="h-full min-w-0 flex-1 bg-transparent text-[0.875rem] text-foreground placeholder:text-muted"
          onFocus={() => setOpenAt(pathname)}
          onChange={(event) => {
            setTerm(event.target.value)
            setCursor(0)
            setOpenAt(pathname)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              close()
              event.currentTarget.blur()
              return
            }
            if (!options.length) return
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setOpenAt(pathname)
              const step = event.key === 'ArrowDown' ? 1 : -1
              setCursor((active + step + options.length) % options.length)
            }
            if (event.key === 'Enter' && open) {
              event.preventDefault()
              go(options[active]!)
            }
          }}
        />
      </label>

      {open && (
        <div
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-line bg-surface py-1.5 shadow-[var(--shadow-pop)]"
          /* Хулганаар дарахад оролт фокусаа алдаж, жагсаалт ДАРАЛТ хүрэхээс
             өмнө хаагдана (Safari холбоосонд фокус өгдөггүй тул
             `relatedTarget` нь хоосон ирдэг). Фокусыг оролтод үлдээнэ. */
          onMouseDown={(event) => event.preventDefault()}
        >
          <ul id={listId} role="listbox" aria-label="Хайлтын санал" className="admin-scroll max-h-[22rem] overflow-y-auto">
            {options.map((option, index) => {
              const first = index === 0 || options[index - 1]!.group !== option.group
              return (
                <li key={option.href} role="presentation">
                  {first && (
                    <p className="px-4 pt-2 pb-1 text-[0.6875rem] font-medium tracking-[0.06em] text-faint uppercase">
                      {option.group === 'page' ? 'Хуудас' : 'Хайх'}
                    </p>
                  )}
                  <Link
                    id={optionId(index)}
                    href={option.href}
                    role="option"
                    aria-selected={index === active}
                    tabIndex={-1}
                    onClick={close}
                    onMouseEnter={() => setCursor(index)}
                    className={`flex items-center gap-3 px-4 py-2 text-[0.875rem] transition-colors ${
                      index === active ? 'bg-surface-3 text-foreground' : 'text-foreground-soft'
                    }`}
                  >
                    <AdminIcon name={option.icon} className="h-[1.125rem] w-[1.125rem] shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    <span className="shrink-0 text-[0.75rem] text-faint">{option.hint}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
