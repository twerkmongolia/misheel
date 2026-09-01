import { PageHeader } from '@/components/ui'
import { Media, mediaExists } from './media'
import type { ReactNode } from 'react'

/**
 * Хуудасны ТУУЗ — гарчиг зураг дээрээ суусан толгой хэсэг.
 *
 * ── Зураг БАЙХГҮЙ бол юу ч эвдэрэхгүй ──────────────────────────────────
 * Файл байхгүй үед хуудас өмнөх `PageHeader` -ээ хэвээр хэрэглэнэ. Хийсвэр
 * саарал орлуулагчийг тууз болгож тавих нь ХАМААГҮЙ дор: агуулгагүй том
 * зурвас нь хуудсыг нээхийн оронд хааж, «энд ямар нэг зүйл ачаалагдаагүй»
 * гэж хэлдэг. Тиймээс тууз нь ЗӨВХӨН жинхэнэ гэрэл зурагтай үедээ гарна.
 *
 * Ингэснээр ажлын урсгал маш энгийн болно: `public/media/banners/` дотор
 * зөв нэртэй файл хийхэд тухайн хуудас туузтай болно. Код засах, серверээ
 * дахин асаах шаардлагагүй.
 *
 * ── Яагаад гарчиг нь ЗҮҮН ДООД буланд вэ ───────────────────────────────
 * Сайт бүхэлдээ зүүн зэрэгцүүлэлттэй, 12 баганат тортой (§ `PageHeader`).
 * Гарчгийг зургийн голд тавих нь тухайн нэг дэлгэц дээр гоё харагдах ч
 * доор нь эхлэх агуулгатайгаа босоо тэнхлэгээ алддаг — уншигч гарчгийг
 * голоос уншаад, дараагийн мөрөө зүүн захаас хайх ёстой болно. Доод
 * зүүн булан нь тэр шугамыг хадгална: гарчиг ба доорх текст НЭГ босоо
 * шугамаас эхэлнэ.
 *
 * Уналт (`overlay`) нь хоёр горимд ч БАРААН — цайвар горимд `--foreground`
 * хар болдог тул зураг дээрх текст уншигдахаа болино. Тиймээс энд өнгө нь
 * токеноос биш, тогтмол цагаанаас ирнэ.
 */
export function PageBanner({
  page,
  title,
  lead,
  eyebrow,
  fallbackSrc,
}: {
  /** `public/media/banners/<page>.jpg` — файлын нэр. */
  page: string
  title: ReactNode
  lead?: ReactNode
  eyebrow?: ReactNode
  /**
   * Хуудсанд аль хэдийн өөрийн гэсэн нээлтийн зураг байсан бол түүнийг
   * заана — тууз нь `banners/<page>.jpg` олдоогүй үед түүн рүү буцна.
   * Ингэснээр шинэ файл хийхээс өмнө ч хуудас зурагтайгаа үлдэнэ.
   */
  fallbackSrc?: string
}) {
  const preferred = `/media/banners/${page}.jpg`
  const src = mediaExists(preferred) ? preferred : (fallbackSrc ?? null)

  if (!mediaExists(src)) {
    return (
      <div className="shell pt-12 sm:pt-16">
        <PageHeader title={title} lead={lead} eyebrow={eyebrow} />
      </div>
    )
  }

  return (
    <header className="relative isolate">
      {/* Өндөр нь ХАРЬЦААГААР биш ХЭМЖЭЭГЭЭР тогтоно. 21:9 харьцаа нь өргөн
          дэлгэцэд зөв ч утсан дээр 3см өндөр зурвас болж хувирдаг —
          зураг биш зураас. `clamp` нь хоёр туйлыг хоёуланг нь барина. */}
      <Media
        src={src!}
        alt=""
        ratio=""
        className="h-[clamp(15rem,34vw,26rem)] rounded-none"
        sizes="100vw"
        priority
        overlay
      />

      <div className="shell absolute inset-x-0 bottom-0 flex flex-col gap-4 pb-8 sm:pb-11">
        {eyebrow && (
          <span className="flex items-center gap-3 text-white/70" data-rv>
            <span aria-hidden className="h-px w-6 shrink-0 bg-white/40" />
            <span className="t-label">{eyebrow}</span>
          </span>
        )}
        <h1 className="t-h1 max-w-[18ch] text-white" data-rv>
          {title}
        </h1>
        {lead && (
          <p className="t-lead max-w-[46ch] text-white/80" data-rv>
            {lead}
          </p>
        )}
      </div>
    </header>
  )
}
