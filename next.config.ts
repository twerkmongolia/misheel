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
     * Демо горимд барааны зургийн URL-д `?v=<mtime>` залгадаг (шинэ файлыг
     * хуучин кэшнээс салгах). Next 16-д локал зурагт query string ашиглах бол
     * заавал эндээс зөвшөөрөх ёстой. Зөвхөн энэ нэг зам нээлттэй.
     */
    localPatterns: [{ pathname: '/media/products/**' }, { pathname: '/media/**', search: '' }],

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
