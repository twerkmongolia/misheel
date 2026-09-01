import { notFound } from 'next/navigation'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { Empty } from '@/components/ui'
import { Media } from '@/components/site/media'
import { getDictionary, isLocale } from '@/lib/i18n'
import { getGallery } from '@/lib/data'
import { PageBanner } from '@/components/site/PageBanner'
import type { GalleryItem } from '@/lib/supabase/database.types'

/**
 * Хавтсанд байгаа зургийн ТАЙЛБАР.
 *
 * Дэлгэц уншигчид зориулсан тул зөвхөн «зураг» гэж хэлэхгүй, юу байгааг
 * хэлнэ. Жагсаалтад байхгүй файл нэмэгдвэл брэндийн нэрээр орлуулна —
 * тайлбаргүй үлдэхээс дээр.
 */
const ALT: Record<string, { mn: string; en: string }> = {
  '01-tailz-egnee': { mn: 'Студид эгнэсэн бүжигчид', en: 'Dancers lined up in the studio' },
  '02-toirog': { mn: 'Тойрог үүсгэн зогсож буй нь', en: 'Dancers standing in a circle' },
  '03-gurvaltsal': { mn: 'Гурван бүжигчин тайзны хувцастай', en: 'Three dancers in stage outfits' },
  '04-shal': { mn: 'Шалан дээрх бүлгийн дасгал', en: 'Floor work with the group' },
  '05-studi-egnee': { mn: 'Студийн эгнээ, хар хувцас', en: 'Studio line-up in black' },
  '06-tailz-uvt': { mn: 'Өдөн хувцастай тайзны тоглолт', en: 'Feathered stage performance' },
  '07-twerk-mongolia': { mn: 'Twerk Mongolia тайзан дээр', en: 'Twerk Mongolia on stage' },
  '08-zunii-zugaa': { mn: 'Зуны зугаа тоглолт', en: 'Summer show performance' },
  '09-studi-egnee-2': { mn: 'Студийн эгнээ, өөр өнцөг', en: 'Studio line-up, another angle' },
  '10-tailz-uzegchid': { mn: 'Тайз, үзэгчдийн дунд', en: 'On stage with the crowd' },
  '11-tailz-urgun': { mn: 'Том тайзны тоглолт', en: 'Performing on a full stage' },
}

/**
 * `public/media/gallery/` доторх зургууд.
 *
 * Өгөгдлийн сангийн `gallery_items` хоосон үед л ажиллана — админаас
 * зураг нэмсэн бол ТЭР давамгайлна. Ингэснээр галерейг хоёр аргаар
 * удирдаж болно: файл хийх (хурдан), эсвэл админ (эрэмбэ, тайлбартай).
 *
 * Дараалал нь ФАЙЛЫН НЭРЭЭР тогтоно. Тиймээс урдаа `01-`, `02-` гэсэн
 * дугаартай — зургийн байрыг солихын тулд нэрийг нь өөрчилнө, код
 * хөндөхгүй.
 */
function localGallery(): GalleryItem[] {
  try {
    return readdirSync(join(process.cwd(), 'public', 'media', 'gallery'))
      .filter((file) => /\.(jpe?g|png|webp|avif)$/i.test(file))
      .sort()
      .map((file, index) => {
        const key = file.replace(/\.[^.]+$/, '')
        const alt = ALT[key]
        return {
          id: file,
          url: `/media/gallery/${file}`,
          alt_mn: alt?.mn ?? 'Twerk Mongolia',
          alt_en: alt?.en ?? 'Twerk Mongolia',
          sort_order: index,
          created_at: '',
        }
      })
  } catch {
    return []
  }
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)

  /* Үрийн өгөгдөл нь `gallery_items` -д `/media/studio-1.svg` … гэсэн
     ЗУРСАН орлуулагчийг байрлуулдаг. Тэдгээр нь гэрэл зураг биш, зөвхөн
     «энд зураг орно» гэж хэлэх зориулалттай — тиймээс тэднийг «дүүрсэн
     галерей» гэж тооцвол жинхэнэ зураг хэзээ ч гарахгүй.

     Дүрэм: галерей бол ГЭРЭЛ ЗУРГИЙН цуглуулга. Вектор (`.svg`) файл
     энд хэзээ ч жинхэнэ агуулга байж чадахгүй тул орлуулагч гэж үзнэ. */
  const fromDb = (await getGallery()).filter((item) => !/\.svg(\?|$)/i.test(item.url))
  const items = fromDb.length > 0 ? fromDb : localGallery()

  return (
    <>
      <PageBanner page="gallery" title={t.nav.gallery} />

      <div className="shell flex flex-col gap-8 pt-10 pb-[var(--bay-sm)] sm:pt-12">
        {items.length === 0 ? (
          <Empty>{t.common.empty}</Empty>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
              <span className="t-label text-muted">{t.about.photosTitle}</span>
              <span className="t-meta text-faint tabular-nums">
                {items.length} {t.shop.itemCount}
              </span>
            </div>

            {/* Тэнцүү нүднүүд нь холбоос хуудас шиг харагдана. Тав дахь
                бүрийг хоёр багана, хэвтээ болгосноор эгнээ таслагдаж, нүд
                хуудсаар аялах ЗАМТАЙ болно — эвлүүлгийн хэмнэл. */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3" data-stagger>
              {items.map((item, index) => {
                const wide = index % 5 === 0
                return (
                  /* `group` — доторх `.card-media` hover дээр томрох
                     нөхцөл (§ globals.css). Галерейн нүд дарагддаггүй ч
                     хөдөлгөөн нь зургийг «амьд» болгоно. */
                  <div
                    key={item.id}
                    data-rv="clip"
                    className={`group overflow-hidden ${wide ? 'col-span-2' : ''}`}
                  >
                    <Media
                      src={item.url}
                      alt={locale === 'en' && item.alt_en ? item.alt_en : item.alt_mn}
                      seed={index}
                      priority={index < 2}
                      ratio={wide ? 'aspect-[16/10]' : 'aspect-[4/5]'}
                      sizes={
                        wide
                          ? '(max-width: 1024px) 100vw, 66vw'
                          : '(max-width: 1024px) 50vw, 33vw'
                      }
                    />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}
