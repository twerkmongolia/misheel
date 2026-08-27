'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Цэсний холбоос — одоо байгаа хуудсаа тэмдэглэнэ.
 *
 * Өнгөгүй систем тул идэвхтэй төлөвийг бүдэг дүүргэлт болон текстийн
 * тодролоор заана. Хэрэглэгч хаана байгаагаа мэдэхгүй байх нь навигацийн
 * хамгийн түгээмэл дутагдал.
 */
export function NavLink({
  href,
  children,
  className = '',
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  const pathname = usePathname()

  // `/mn` нь зөвхөн яг тэр хуудсанд, бусад нь дэд замуудад ч идэвхтэй
  const segments = href.split('/').filter(Boolean)
  const isHome = segments.length === 1
  const active = isHome ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`${className} ${
        active ? 'nav-active' : 'text-foreground-soft hover:bg-surface-2 hover:text-foreground'
      }`}
    >
      {children}
    </Link>
  )
}
