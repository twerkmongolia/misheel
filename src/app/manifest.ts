import type { MetadataRoute } from 'next'

/**
 * Web App Manifest.
 *
 * Гар утсанд «Дэлгэцэд нэмэх» хийхэд сайт нэр, өнгөө авна — эс бөгөөс
 * хаягийн мөр цагаанаар гарч, дүрсний доор бүтэн URL бичигдэнэ.
 *
 * Өнгө нь `app/layout.tsx` -ийн `themeColor` -той ижил байх ЁСТОЙ: хоёр нь
 * зөрвөл програм нээгдэх агшинд өнгө нэг удаа үсэрнэ.
 *
 * `lang: 'mn'` — анхдагч хэл (§ i18n/config). Manifest нь ганц утга л
 * авдаг тул хэрэглэгчийн сонголтыг дагахгүй; `start_url` мөн монголоор
 * нээгдээд, хэлээ сольсон хүнийг cookie нь дараагийн даралтад засна.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Twerk Mongolia',
    short_name: 'Twerk MN',
    description: 'Улаанбаатар дахь twerk бүжгийн студи — анги, хуваарь, дэлгүүр.',
    lang: 'mn',
    start_url: '/mn',
    scope: '/',
    display: 'standalone',
    background_color: '#0D0D0D',
    theme_color: '#0D0D0D',
    icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
  }
}
