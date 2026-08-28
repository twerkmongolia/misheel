import Image from 'next/image'

/**
 * Зураг, эсвэл түүнгүй үед орлуулагч.
 *
 * Монохром систем тул орлуулагч нь зөвхөн саарлын шатлалаар зурагдана.
 * `seed` -ээс хамаарч гэрлийн өнцөг, тодрол өөрчлөгдөх тул зэрэгцээ
 * хайрцгууд ялгаатай харагдана.
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
  if (src) {
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

  const hues = [340, 300, 265, 205, 25, 160]
  const hue = hues[seed % hues.length]

  return (
    <div
      aria-hidden
      className={`overflow-hidden rounded-2xl border border-line ${ratio} ${className}`}
      style={{
        background:
          `radial-gradient(120% 100% at 20% 0%, oklch(0.42 0.17 ${hue} / 0.9), transparent 60%), ` +
          `radial-gradient(90% 90% at 90% 100%, oklch(0.34 0.12 ${(hue + 55) % 360} / 0.85), transparent 65%), ` +
          `var(--media-base)`,
      }}
    />
  )
}
