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
}

export default nextConfig
