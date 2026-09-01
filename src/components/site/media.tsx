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
 * `Media` -г зөвхөн серверийн бүрэлдэхүүн хэсгүүд дууддаг тул `node:fs`
 * энд аюулгүй.
 */
export function mediaExists(src?: string | null): boolean {
  if (!src) return false
  // Гадаад URL -ийг шалгах боломжгүй тул «байгаа» гэж үзнэ
  if (!src.startsWith('/media/')) return true

  // Демо горимд `?v=<mtime>` залгадаг — шалгахын өмнө тайрна
  const path = src.split('?')[0]!
  return existsSync(join(process.cwd(), 'public', path))
}

function localMissing(src: string): boolean {
  return !mediaExists(src)
}

/**
 * Локал зурагт `?v=<файлын өөрчлөгдсөн хугацаа>` залгана.
 *
 * ── Яагаад ─────────────────────────────────────────────────────────────
 * `next/image` нь `/_next/image?url=…&w=…` гэсэн хаягаар зураг гаргадаг ба
 * түүндээ урт хугацааны кэшийн толгой тавьдаг. Файлыг нь ИЖИЛ НЭРЭЭР дарж
 * хуулахад хаяг өөрчлөгддөггүй тул хөтөч хуучин зургаа л үзүүлсээр байна —
 * гаднаас нь харахад «зураг солигдохгүй байна» гэж мэдрэгдэнэ. Диск дээрх
 * файл шинэ, дэлгэц дээрх зураг хуучин.
 *
 * Файлын `mtime` -ийг хаягт залгаснаар файл өөрчлөгдөх бүрд хаяг өөрчлөгдөж,
 * хөтөч шинээр татна. Өөрчлөгдөөгүй үед хаяг хэвээр тул кэш ажилласаар байна.
 */
function versioned(src: string): string {
  if (!src.startsWith('/media/')) return src

  try {
    const path = src.split('?')[0]!
    const { mtimeMs } = statSync(join(process.cwd(), 'public', path))
    return `${path}?v=${Math.round(mtimeMs)}`
  } catch {
    return src
  }
}

/**
 * Зураг.
 *
 * Хайрцагт хийгддэггүй — зураг ӨӨРӨӨ хайрцаг. Тиймээс хүрээ, сүүдэр
 * байхгүй: зөвхөн зүсэлт, 3px булан, доторх хөдөлгөөн.
 *
 * `overlay` нь ЗӨВХӨН дээр нь текст суух үед. Бүх зурагт уналт нэмэх нь
 * барааны гэрэл зургийг шалтгаангүй харлуулна — уналт бол уншигдацын
 * хэрэгсэл, хэв маягийн чимэг биш.
 */
export function Media({
  src,
  alt,
  ratio = 'aspect-[4/3]',
  className = '',
  seed = 0,
  priority = false,
  overlay = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: {
  src?: string | null
  alt: string
  ratio?: string
  className?: string
  seed?: number
  priority?: boolean
  overlay?: boolean
  sizes?: string
}) {
  if (src && !localMissing(src)) {
    return (
      <div className={`media ${ratio} ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="card-media object-cover"
        />
        {overlay && <div aria-hidden className="scrim pointer-events-none absolute inset-0" />}
      </div>
    )
  }

  // ── Орлуулагч ───────────────────────────────────────────────────────────
  // Өнгөгүй систем тул зөвхөн саарлын шатлал. `seed` нь зураасны өнцөг,
  // гэрлийн эх үүсвэрийн байрлалыг л сольж, ӨНГИЙГ огт хөнддөггүй —
  // зэрэгцээ хайрцгууд ялгаатай ч нэг гэр бүлийн харагдана.
  const angle = 20 + (seed % 6) * 26
  const lightX = 15 + (seed % 4) * 24
  const lightY = (seed % 3) * 14

  return (
    <div
      aria-hidden
      className={`media ${ratio} ${className}`}
      style={{
        background:
          `repeating-linear-gradient(${angle}deg, var(--media-hatch) 0 1px, transparent 1px 10px), ` +
          `radial-gradient(115% 95% at ${lightX}% ${lightY}%, var(--media-sheen), transparent 62%), ` +
          `radial-gradient(90% 80% at 100% 100%, var(--media-sheen), transparent 70%), ` +
          `var(--media-base)`,
      }}
    >
      {overlay && <div aria-hidden className="scrim pointer-events-none absolute inset-0" />}
    </div>
  )
}
