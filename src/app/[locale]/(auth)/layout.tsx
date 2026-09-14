import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { mediaExists } from '@/components/site/media'
import { getDictionary, isLocale } from '@/lib/i18n'
import { defaultLocale } from '@/lib/i18n/config'

/* Нэвтрэх, бүртгүүлэх, нууц үг сэргээх — индексэд орох агуулга биш. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Зүүн самбарын зураг — эхний ОЛДСОНЫГ нь авна.
 *
 * `public/media/auth.*` нь жагсаалтын эхэнд: тэр файлыг солиход л нэвтрэх
 * хуудас шинэ төрхтэй болно — код засах, серверээ дахин асаах хэрэггүй
 * (§ site/PageBanner.tsx дээрх ижил зарчим).
 */
const ART = ['/media/auth.png', '/media/auth.jpg', '/media/tsstark-logo.png']

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = getDictionary(isLocale(locale) ? locale : defaultLocale)
  const art = ART.find(mediaExists) ?? null

  return (
    <div className="shell pt-8 sm:pt-12">
      {/* ── Хоёр хуваасан самбар ──────────────────────────────────────────
          Зүүнд брэнд, баруунд маягт. Хуудсын голд дүүжлэгдсэн нарийн багана
          нь «энэ бол саад» гэж уншигддаг; зүүн тал нь тэр саадыг ГАЗАР
          болгоно — хүн маягт бөглөж байгаа биш, нэг өрөө рүү орж байгаа
          мэт болно.

          Зүүн тал нь зөвхөн 1024px-ээс дээш гарна. Утсан дээр дэлгэцийн
          хагасыг зураг эзэлбэл маягт нугалаасны доор үлдэж, эхний үйлдэл
          нь гүйлгэх болно — нэвтрэх хуудсанд тэр бол ялагдал. */}
      <div
        /* Доод өндөр нь ЗӨВХӨН зүүн талын төлөө: нууц үг сэргээх зэрэг
           богино маягт дээр самбар хэт нимгэрч, брэнд нь зурвас болно. */
        className="panel grid overflow-hidden rounded-[var(--r-xl)] lg:min-h-[32rem] lg:grid-cols-[1.05fr_1fr]"
      >
        {/* ── Брэндийн тал ────────────────────────────────────────────────
            `object-contain` — `cover` БИШ. Лого бол гэрэл зураг биш: хажуу
            талаас нь тайрахад тэр нь «дүүргэсэн» болохоос илүү «эвдэрсэн»
            харагдана. Тиймээс зураг бүтнээрээ сууж, үлдсэн зайг гадарга
            дүүргэнэ.

            ⚠️ Дэвсгэрийн өнгө нь ТОКЕН БИШ, ЗУРГИЙН өөрийнх: `auth.png` нь
            ил тод биш, өөрийн гэсэн #292929 суурьтай. Самбарыг токеноор
            будвал зургийн тэгш өнцөгт ирмэг нь тод зааг болж харагдана —
            лого нь самбар дээр НААЛТ мэт. Хоёр өнгө таарсан үед зураг
            хаана дуусахыг нүд олохгүй.

            Зураг солих бол: шинэ файлынхаа буланг сэмлээд энэ утгыг тааруул
            (эсвэл ил тод дэвсгэртэй PNG ашигла — тэгвэл энэ утга ямар ч
            байсан ажиллана). */}
        <div className="relative hidden place-items-center overflow-hidden bg-[#292929] p-12 lg:grid">
          {art && (
            <Link
              href={`/${locale}`}
              aria-label={t.brand}
              className="relative block w-full max-w-[24rem] transition-opacity duration-300 hover:opacity-80"
            >
              <Image
                src={art}
                alt={t.brand}
                width={920}
                height={587}
                sizes="(max-width: 1024px) 0px, 26rem"
                priority
                className="h-auto w-full object-contain"
              />
            </Link>
          )}

          {/* Захаараа бууруулсан гэрэл. Хавтгай талбайг ГАДАРГА болгож,
              лого руу нүдийг татна. Зураг дээгүүр ч давхарлана — тиймээс
              зургийн ирмэг үлдсэн ялимгүй зөрүү ч уусна. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 90% at 50% 40%, transparent 40%, rgb(0 0 0 / 0.32) 100%)',
            }}
          />
        </div>

        {/* Маягтын багана. Босоо зай нь самбарын өндрийг ТОДОРХОЙЛНО —
            зүүн талд тогтмол өндөр өгвөл агуулга урт хуудсууд (бүртгүүлэх)
            дээр брэнд тасарна. */}
        <div className="flex items-center justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
          <div className="flex w-full max-w-[24rem] flex-col gap-7">{children}</div>
        </div>
      </div>
    </div>
  )
}
