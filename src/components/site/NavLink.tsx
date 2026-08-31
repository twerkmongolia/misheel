'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Цэсний холбоос — одоо байгаа хуудсаа тэмдэглэнэ.
 *
 * Идэвхтэйг ДҮҮРГЭЛТЭЭР биш ЗУРААСААР заана (§ globals.css `.nav-item`).
 * Дүүргэлт нь навбарыг товчны эгнээ мэт харагдуулдаг; доогуур зураас нь
 * «та энд байна» гэдгийг хэлээд, hover дээр баруунаас зүүн тийш татагдаж
 * ирснээр чиглэл ч бас өгнө.
 */
export function NavLink({
  href,
  children,
  className = '',
  exact = false,
}: {
  href: string
  children: React.ReactNode
  className?: string
  /** Дэд замуудыг идэвхтэйд тооцохгүй — эцэг таб дээр хэрэгтэй. */
  exact?: boolean
}) {
  const pathname = usePathname()

  // `/mn` нь зөвхөн яг тэр хуудсанд, бусад нь дэд замуудад ч идэвхтэй
  const segments = href.split('/').filter(Boolean)
  const isHome = segments.length === 1
  const active = isHome || exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={className}>
      {children}
    </Link>
  )
}
