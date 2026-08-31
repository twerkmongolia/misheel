import Image from 'next/image'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * `/media/...` зам байгаа файлыг заасан эсэх.
 *
 * Зургийн замууд өгөгдлийн санд бичигдэнэ — тэнд файл байгаа эсэхийг хэн ч
 * шалгадаггүй. Байхгүй файл заасан үед `next/image` эвдэрсэн зураг үлдээдэг:
 * зохиомол орлуулагчаас ХАМААГҮЙ муу. Тиймээс серверт нэг `stat` хийж,
 * байхгүй бол `null` буцаана — доорх орлуулагч ажиллана.
 *
 * Зөвхөн ЛОКАЛ `/media/**` -ийг шалгана. Supabase Storage болон бусад
 * гадаад URL нь энэ файлын системд байхгүй тул хөндөхгүй өнгөрнө.
 *
 * `Media` -г зөвхөн серверийн бүрэлдэхүүн хэсгүүд дууддаг (`'use client'`
 * файл ганц ч байхгүй) тул `node:fs` энд аюулгүй.
 */
function localMissing(src: string): boolean {
  if (!src.startsWith('/media/')) return false

  // Демо горимд `?v=<mtime>` залгадаг — шалгахын өмнө тайрна
  const path = src.split('?')[0]
  return !existsSync(join(process.cwd(), 'public', path))
}

/**
 * Зураг, эсвэл түүнгүй үед орлуулагч.
 *
 * Монохром систем тул орлуулагч нь зөвхөн саарлын шатлалаар зурагдана.
 * `seed` -ээс хамаарч зураасны өнцөг болон гэрлийн эх үүсвэрийн байрлал
 * өөрчлөгдөх тул зэрэгцээ хайрцгууд ялгаатай харагдана — өнгө нэмэлгүйгээр.
 */
export function Media({
  src,
  alt,
  ratio = 'aspect-[4/3]',
  className = '',
  seed = 0,
  priority = false,
}: {
  src?: string | null
  alt: string
  ratio?: string
  className?: string
  seed?: number
  priority?: boolean
}) {
  if (src && !localMissing(src)) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-line bg-surface-2 ${ratio} ${className}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="card-media object-cover"
        />
        {/* Доод талын бараан уналт — зураг дээр текст тавихад уншигдана */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
      </div>
    )
  }

  // Гурван тэнхлэгээр л хувирна: зураасны өнцөг, гэрлийн байрлал, түүний өндөр.
  const angle = 20 + (seed % 6) * 26
  const lightX = 15 + (seed % 4) * 24
  const lightY = (seed % 3) * 14

  return (
    <div
      aria-hidden
      className={`overflow-hidden rounded-2xl border border-line ${ratio} ${className}`}
      style={{
        background:
          `repeating-linear-gradient(${angle}deg, var(--media-hatch) 0 1px, transparent 1px 10px), ` +
          `radial-gradient(115% 95% at ${lightX}% ${lightY}%, var(--media-sheen), transparent 62%), ` +
          `radial-gradient(90% 80% at 100% 100%, var(--media-sheen), transparent 70%), ` +
          `var(--media-base)`,
      }}
    />
  )
}
