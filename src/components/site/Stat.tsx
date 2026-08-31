'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Тоолуур.
 *
 * Үзүүлэлт харагдах хэсэгт орж ирэхэд тэг рүүгээ буцаж, дээшээ тоолно.
 * Шалтгаан: «10 000 сурагч» гэдэг зүгээр л бичсэн үедээ БАРИМТ, харин
 * тоологдох үедээ ХЭМЖЭЭ болно. Уншигч эхлэлээс төгсгөл хүртэлх замыг
 * нүдээрээ туулна.
 *
 * Утга нь админаас ирдэг чөлөөт текст («10 000+», «4», «18») тул тоог нь
 * л ялгаж авч тоолоод, өмнөх ба хойд хэсгийг хэвээр үлдээнэ.
 *
 * Хөдөлгөөн багасгах горимд эцсийн утга шууд зурагдана — хөдөлгөөнгүй ч
 * мэдээлэл бүрэн.
 */
export function Stat({ value }: { value: string }) {
  const match = /^(\D*)([\d\s ]+)(.*)$/.exec(value)
  const digits = match ? Number(match[2].replace(/[\s ]/g, '')) : NaN

  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState<number | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node || !Number.isFinite(digits)) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        observer.disconnect()

        const duration = 1100
        const start = performance.now()

        const step = (now: number) => {
          const progress = Math.min(1, (now - start) / duration)
          // Хурдан эхэлж, удаан суух — `--ease` -тэй ижил зан
          const eased = 1 - Math.pow(1 - progress, 4)
          setShown(Math.round(digits * eased))
          if (progress < 1) requestAnimationFrame(step)
        }

        requestAnimationFrame(step)
      },
      { threshold: 0.4 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [digits])

  // Тоо олдоогүй, эсвэл тоолол эхлээгүй — эх утгыг хэвээр
  if (!match || !Number.isFinite(digits) || shown === null) {
    return <span ref={ref}>{value}</span>
  }

  return (
    <span ref={ref}>
      {match[1]}
      {shown.toLocaleString('mn-MN').replace(/,/g, ' ')}
      {match[3]}
    </span>
  )
}
