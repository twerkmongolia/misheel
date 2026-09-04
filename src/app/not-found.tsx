import { defaultLocale, getDictionary } from '@/lib/i18n'

/**
 * Үндэсийн 404.
 *
 * Хэзээ ажиллах вэ: `[locale]/layout.tsx` ӨӨРӨӨ `notFound()` шидсэн үед
 * (буруу хэлний segment — `/xx/shop`). Layout нь унасан тул түүний доторх
 * `[locale]/not-found.tsx` -ийг зурах боломжгүй, Next нэг шат дээш гарна.
 *
 * Тиймээс энд навбар, хөл БАЙХГҮЙ бөгөөд хэл нь мэдэгдэхгүй — зам дахь
 * segment нь яг л буруу байсан учраас энд ирсэн. Анхдагч хэлээр ярьж,
 * ажиллаж байгаа хаяг руу нэг товчоор буцаана.
 */
export default function RootNotFound() {
  const t = getDictionary(defaultLocale)

  return (
    <div className="shell flex flex-1 flex-col justify-center gap-8 py-24">
      <span className="t-label text-muted">{t.errorPage.notFoundCode}</span>
      <h1 className="t-h1 max-w-[16ch]">{t.errorPage.notFoundTitle}</h1>
      <p className="t-lead max-w-[52ch] text-foreground-soft">{t.errorPage.notFoundBody}</p>

      {/* `next/link` БИШ: `/mn` нь өөр layout модонд байгаа тул бүтэн
          ачаалал хэрэгтэй. */}
      <div className="pt-2">
        <a href={`/${defaultLocale}`} className="btn btn-solid">
          {t.errorPage.home}
        </a>
      </div>
    </div>
  )
}
