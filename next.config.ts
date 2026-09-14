import type { NextConfig } from 'next'

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined

const nextConfig: NextConfig = {
  /*
   * `next dev` ба `next build` хоёр анхдагчаар нэг `.next` хавтсыг хуваалцдаг.
   * Тиймээс сервер асаалттай байхад build ажиллуулбал dev сервер унадаг.
   * NEXT_DIST_DIR -ээр build-ыг өөр хавтас руу чиглүүлж, хоёулаа зэрэг
   * ажиллах боломжтой болгов.
   */
  distDir: process.env.NEXT_DIST_DIR || '.next',

  images: {
    /*
     * Локал зургийн URL-д `?v=<mtime>` залгадаг — файлыг ижил нэрээр дарж
     * хуулахад хаяг өөрчлөгдөж, хөтөч хуучин кэшээ хаяна (§ media.tsx
     * `versioned`). Next 16-д локал зурагт query string ашиглах бол заавал
     * эндээс зөвшөөрөх ёстой.
     *
     * Урьд нь зөвхөн `/media/products/**` нээлттэй, бусад нь `search: ''`
     * буюу query-гүй байхыг ШААРДдаг байв. Тиймээс тууз, багш, хичээлийн
     * зураг солиход хуучин зураг үлдэж, `?v=` нэмэх гэсэн оролдлого нь
     * «Invalid src prop» алдаа өгдөг байлаа. Одоо `/media/**` бүхэлдээ
     * хувилбартай байж чадна.
     */
    localPatterns: [{ pathname: '/media/**' }],

    remotePatterns: [
      // YouTube бичлэгийн зураг
      { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' },
      // Supabase Storage-оос ирэх зургууд
      ...(supabaseHost
        ? ([
            {
              protocol: 'https' as const,
              hostname: supabaseHost,
              pathname: '/storage/v1/object/public/**',
            },
          ])
        : []),
    ],
  },

  /**
   * Аюулгүйн толгой — ЗӨВХӨН `/api/*`.
   *
   * Сайтын бусад бүх зам нь `proxy.ts` -ээр дамждаг ба толгойнууд тэнд
   * тавигдана (§ `SECURITY_HEADERS`). Шалтгаан нь CSP: түүний `nonce` нь
   * хүсэлт бүрд шинээр үүсэх ёстой тул статик тохиргоонд бичих боломжгүй.
   *
   * `/api` нь proxy-ийн matcher-аас ЗОРИУДААР хасагдсан (webhook нь өөрийн
   * гарын үсгээр хамгаалагдана) — тиймээс тэнд толгой огт очихгүй байв.
   * Энэ блок тэр цоорхойг л нөхнө. Хоёр газарт давхардуулбал зарим толгой
   * хоёр удаа илгээгдэж, хөтөч аль нэгийг нь үл тоомсорлоно.
   */
  /**
   * Server Action -ы биеийн хязгаар.
   *
   * ── Яагаад анхдагч 1MB хүрэхгүй байсан бэ ───────────────────────────────
   * Админ дээрх БҮХ зураг (бараа, багш, курсын нүүр) Server Action -аар
   * дамжин `multipart/form-data` хэлбэрээр илгээгддэг. Next -ийн анхдагч
   * хязгаар 1MB бөгөөд утсаар авсан ердийн зураг 2-5MB байдаг: хүсэлт нь
   * үйлдэл рүү ХҮРЭЛГҮЙ, хүсэлт задлах давхаргад унана.
   *
   * Тэр уналт нь `MAX_IMAGE_BYTES` (5MB) шалгалтаас ӨМНӨ болдог тул
   * ажилтан «5MB-аас хэтэрсэн» гэсэн ойлгомжтой мессежийн оронд
   * «Алдаа гарлаа» гэсэн хоосон хуудас хардаг байв (§ actions/admin.ts
   * `uploadImage`).
   *
   * ── Яагаад 5MB вэ ───────────────────────────────────────────────────────
   * Хязгаар нь ЗӨВХӨН админд биш БҮХ Server Action -д (нэвтрэх, бүртгүүлэх
   * зэрэг нийтийн үйлдэлд ч) үйлчилдэг тул том тоо нь санах ойг дэмий
   * зарцуулах гадаргууг нээнэ.
   *
   * ⚠️ НЭГ зургийн хязгаар нь үүнээс ДООГУУР байх ёстой (4MB —
   * § lib/uploads.ts): multipart нь файл бүрд хилийн мөр, толгой нэмэх ба
   * формын бусад талбарууд мөн энэ биед явна. Хоёр тоо тэнцүү бол
   * зөвшөөрөгдсөн дээд хэмжээтэй зураг ҮРГЭЛЖ унана.
   */
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          // API нь хэзээ ч зурагдахгүй тул бүх эх сурвалжийг хаана.
          { key: 'Content-Security-Policy', value: "default-src 'none'; frame-ancestors 'none'" },
        ],
      },
    ]
  },
}

export default nextConfig
