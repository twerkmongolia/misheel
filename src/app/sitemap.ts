import type { MetadataRoute } from 'next'
import { locales } from '@/lib/i18n/config'
import { SITE_URL } from '@/lib/seo'
import { getClassTypes, getCourses, getInstructors, getProducts } from '@/lib/data'

/* ───────────────────────────────────────────────────────────────────────────
   SITEMAP

   Хоёр хэл × бүх нийтийн хуудас. Оруулга бүр `alternates.languages` -ээр
   нөгөө хэл рүүгээ заана: hreflang нь `<head>` дээр байхаас гадна sitemap
   дотор ч байх нь Google-ийн зөвлөмж — хоёр газраас баталгаажсан холбоос
   нь илүү найдвартай уншигдана.

   Хувийн хэсгүүд (сагс, төлбөр, бүртгэл, удирдлага) энд ОРОХГҮЙ — тэдгээр
   нь `robots.ts` дээр ч хаалттай.
   ─────────────────────────────────────────────────────────────────────── */

/**
 * ⚠️ Хүсэлт бүрд шинээр — урьдчилан бүтээхгүй.
 *
 * Өгөгдлийн сангийн client нь `cookies()` уншдаг (§ supabase/server.ts).
 * Next үүнийг build үед статикаар зурах гэж оролдоод «Dynamic server
 * usage» алдаа шиднэ; доорх `try/catch` тэр алдааг залгих ба үр дүнд нь
 * ЗӨВХӨН статик замуудтай sitemap бүтээгдэн ҮҮРД хөлдөнө — анги, бараа,
 * багш нарын хуудсууд хэзээ ч индексэд орохгүй.
 *
 * `force-dynamic` нь тэр хавхыг хаана. Sitemap-ыг зөвхөн робот татдаг тул
 * хүсэлт бүрд тооцоолох нь зохистой үнэ.
 */
export const dynamic = 'force-dynamic'

/** Хэлнээс хамаарахгүй, үргэлж байдаг замууд. */
const STATIC_PATHS = [
  '',
  '/about',
  '/classes',
  '/courses',
  '/schedule',
  '/instructors',
  '/gallery',
  '/shop',
  '/faq',
  '/contact',
] as const

function entry(path: string, changeFrequency: 'daily' | 'weekly' | 'monthly', priority: number) {
  return locales.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: {
      languages: Object.fromEntries(
        locales.map((other) => [other, `${SITE_URL}/${other}${path}`]),
      ),
    },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = STATIC_PATHS.flatMap((path) =>
    entry(path, path === '' || path === '/schedule' ? 'daily' : 'weekly', path === '' ? 1 : 0.8),
  )

  /**
   * Өгөгдлийн сан унасан ч sitemap ГАРНА.
   *
   * Хэрэв энэ дуудлага шидвэл бүтэн sitemap 500 буцаана — өөрөөр хэлбэл
   * түр зуурын саатал нь СТАТИК хуудсуудыг ч хайлтын системээс нуух юм.
   * Динамик хэсэг нь нэмэлт, урьдчилсан нөхцөл биш.
   */
  let dynamicEntries: MetadataRoute.Sitemap = []
  try {
    const [courses, classTypes, instructors, products] = await Promise.all([
      getCourses(),
      getClassTypes(),
      getInstructors(),
      getProducts(),
    ])

    dynamicEntries = [
      ...courses.flatMap((row) => entry(`/courses/${row.slug}`, 'weekly', 0.7)),
      ...classTypes.flatMap((row) => entry(`/classes/${row.slug}`, 'monthly', 0.6)),
      ...instructors.flatMap((row) => entry(`/instructors/${row.slug}`, 'monthly', 0.6)),
      ...products.flatMap((row) => entry(`/shop/${row.slug}`, 'weekly', 0.6)),
    ]
  } catch (error) {
    console.error('[sitemap] динамик хэсэг алгаслаа:', error)
  }

  return [...staticEntries, ...dynamicEntries]
}
