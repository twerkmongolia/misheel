import { GoogleMark } from '@/components/ui'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

/**
 * «Google-ээр үргэлжлүүлэх» — нэвтрэх, бүртгүүлэх ХОЁУЛАНД нэг товч.
 *
 * ── Яагаад хоёуланд ижил үг вэ ────────────────────────────────────────────
 * Google талд «нэвтрэх» ба «бүртгүүлэх» гэсэн ялгаа БАЙХГҮЙ: ижил урсгал
 * бөгөөд хаяг нь эхний удаад шинэ бүртгэл үүсгэж, дараа нь тэр бүртгэл рүү
 * нэвтэрнэ. Товчийг «Google-ээр бүртгүүлэх» гэвэл аль хэдийн бүртгэлтэй хүн
 * зайлсхийж, «Google-ээр нэвтрэх» гэвэл шинэ хүн зайлсхийнэ. «Үргэлжлүүлэх»
 * нь хоёуланд нь үнэн.
 *
 * ── Яагаад `<a>`, `<Link>` БИШ вэ ─────────────────────────────────────────
 * Очих газар нь хуудас биш Route Handler (§ app/auth/google/route.ts) бөгөөд
 * тэр нь Google руу чиглүүлнэ. `next/link` нь дотоод шилжилт хийхийг оролдож,
 * хуудасны оронд чиглүүлэлт хүлээж авахад төөрнө. Энэ товч нь сайтаас
 * ГАДАГШ гарах тул бүтэн шилжилт л зөв.
 */
export function GoogleButton({
  t,
  locale,
  next,
}: {
  t: Dictionary
  locale: Locale
  next?: string
}) {
  const params = new URLSearchParams({ locale })
  if (next) params.set('next', next)

  return (
    <div className="flex flex-col gap-5">
      <a href={`/auth/google?${params}`} className="btn btn-line w-full">
        <GoogleMark />
        {t.auth.google}
      </a>

      {/* Хоёр аргын ХООРОНДЫН зааг. Шугам нь «энэ хоёр нь адил зэрэгтэй,
          зүгээр л өөр зам» гэдгийг хэлнэ — доогуур нь жижиг бичих нь
          хоёр дахь аргыг нь хоёрдогч болгож харагдуулна. */}
      <div className="flex items-center gap-4" aria-hidden>
        <span className="hr flex-1" />
        <span className="t-label text-faint">{t.auth.or}</span>
        <span className="hr flex-1" />
      </div>
    </div>
  )
}
