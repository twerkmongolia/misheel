'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

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
  const params = useSearchParams()

  /* Хаяг нь ШҮҮЛТҮҮР агуулж болно: `/mn/courses?mode=studio`. Тийм
     холбоос нь зөвхөн зам таарахад БИШ, шүүлтүүр нь ч таарахад идэвхтэй
     байх ёстой — эс бөгөөс «Танхимын анги», «Онлайн анги» хоёр яг нэг
     замтай тул хоёулаа зэрэг доогуур зураастай болно.

     Шүүлтүүрийг `href` -ээс өөрөөс нь уншина. Тусдаа `query` prop болговол
     дуудлагын газар бүр хаягаа хоёр удаа — нэг нь холбоост, нэг нь
     таарахад — бичих ёстой болж, хоёр нь салах боломж нээгдэнэ. */
  const [path, queryString = ''] = href.split('?')

  // `/mn` нь зөвхөн яг тэр хуудсанд, бусад нь дэд замуудад ч идэвхтэй
  const segments = path.split('/').filter(Boolean)
  const isHome = segments.length === 1
  const pathActive = isHome || exact ? pathname === path : pathname.startsWith(path)

  const queryActive = [...new URLSearchParams(queryString)].every(
    ([key, value]) => params.get(key) === value,
  )

  const active = pathActive && queryActive

  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={className}>
      {children}
    </Link>
  )
}
