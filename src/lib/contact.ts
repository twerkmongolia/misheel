import type { Dictionary } from '@/lib/i18n/dictionaries'

/**
 * Шууд холбогдох сувгууд.
 *
 * Энэ жагсаалтыг ХОЁР газар зурдаг: холбоо барих хуудас, «Холбоо барих» цонх.
 * Хоёуланд нь тус тусад нь барих нь эрт орой хэзээ нэгэн цагт зөрөх болно —
 * нэг газар нь Facebook нэмэгдээд нөгөөд нь нэмэгдэхгүй үлдэнэ. Тиймээс
 * бүтэц нь энд, ганц эх сурвалжид.
 *
 * `icon` нь бүрдэл БИШ мөр: энэ өгөгдөл серверээс клиент цонх руу дамждаг
 * тул JSON болж хувирах ёстой. Дүрсийг зурах талдаа сонгоно.
 */
export type ChannelIcon = 'phone' | 'instagram' | 'facebook' | 'mail' | 'map'

export type Channel = {
  label: string
  value: string
  href: string
  icon: ChannelIcon
  /** Шинэ таб — зөвхөн сайтаас гарах холбоост. */
  external?: boolean
}

/**
 * Дараалал нь ХУРДААР эрэмбэлэгдэнэ: утас хамгийн шууд, и-мэйл хамгийн удаан.
 * `site_content` дээр бөглөөгүй талбар огт мөр эзлэхгүй.
 */
export function contactChannels(info: Record<string, unknown>, t: Dictionary): Channel[] {
  const phone = String(info.phone ?? '')
  const email = String(info.email ?? '')
  const instagram = String(info.instagram ?? '')
  const facebook = String(info.facebook ?? '')

  return [
    phone && {
      label: t.auth.phone,
      value: phone,
      href: `tel:${phone.replace(/\s/g, '')}`,
      icon: 'phone' as const,
    },
    instagram && {
      label: 'Instagram',
      value: `@${instagram}`,
      href: `https://instagram.com/${instagram}`,
      external: true,
      icon: 'instagram' as const,
    },
    facebook && {
      label: 'Facebook',
      value: 'Twerk Mongolia',
      href: facebook,
      external: true,
      icon: 'facebook' as const,
    },
    email && {
      label: t.auth.email,
      value: email,
      href: `mailto:${email}`,
      icon: 'mail' as const,
    },
  ].filter(Boolean) as Channel[]
}
