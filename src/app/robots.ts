import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * Хайлтын роботод зориулсан дүрэм.
 *
 * `disallow` нь ХАМГААЛАЛТ БИШ — жинхэнэ хаалт нь `proxy.ts` ба RLS дээр.
 * Энэ нь зөвхөн «эдгээрийг индекслэх утга алга» гэсэн зөвлөмж: нэвтрэлт
 * шаардсан хуудсууд хайлтын үр дүнд гарвал хэрэглэгч дандаа login руу
 * шидэгдэж, сайтын чанарын үнэлгээ л буурна.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api/',
        '/auth/',
        '/dev/',
        '/mock-pay/',
        // Хоёр хэл тус бүрд
        '/mn/account',
        '/en/account',
        '/mn/cart',
        '/en/cart',
        '/mn/checkout',
        '/en/checkout',
        '/mn/order/',
        '/en/order/',
        '/mn/login',
        '/en/login',
        '/mn/signup',
        '/en/signup',
        '/mn/forgot-password',
        '/en/forgot-password',
        '/mn/reset-password',
        '/en/reset-password',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
