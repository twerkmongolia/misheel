'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Гүйлтийн хөдөлгөөний ажиглагч.
 *
 * `[data-rv]` тэмдэгтэй элемент харагдах хэсэгт орж ирэхэд `.is-in` нэмнэ —
 * цаашдын бүх хөдөлгөөнийг CSS хийнэ (§ globals.css § 6). Энэ хуваарилалт
 * санаатай: JS нь ХЭЗЭЭ гэдгийг л шийднэ, ЮУ БОЛОХЫГ загварын хуудас
 * шийднэ. Тиймээс хөдөлгөөний хэлийг өөрчлөхөд энэ файл хөндөгдөхгүй.
 *
 * Яагаад `animation-timeline: view()` биш вэ:
 *   · Firefox дээр хараахан ажиллахгүй — хэрэглэгчийн нэлээд хэсэг нь
 *     хөдөлгөөнгүй үлдэнэ.
 *   · Гүйлтийн цагийн хуваарьт ХУГАЦАА гэж байхгүй тул `transition-delay`
 *     ажиллахгүй — торны шатлал (`[data-stagger]`) боломжгүй болно.
 *   · Хэвтээ гүйдэг зам доторх элементүүд хамгийн ойрын гүйлтийн савыг
 *     буруу сонгож, тунгалаг хэвээр гацаж болзошгүй.
 */
export function Reveal() {
  // App Router нь хуудас солиход бүтэн ачаалдаггүй — шинэ DOM гарч ирэхэд
  // дахин ажиглах ёстой. Замын өөрчлөлт нь тэр дохио.
  const pathname = usePathname()

  useEffect(() => {
    const root = document.documentElement

    // Зэвсэглээгүй (JS-гүй эхэлсэн, эсвэл хөдөлгөөн багасгах горим) —
    // агуулга аль хэдийн харагдаж байгаа тул хийх зүйл алга.
    if (!root.classList.contains('rv-on')) return

    const show = (el: Element) => el.classList.add('is-in')

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          show(entry.target)
          observer.unobserve(entry.target)
        }
      },
      {
        // Доод ирмэгээс 8% дээгүүр — элемент бүрэн гарч ирэхээс өмнөхөн
        // эхэлнэ. Яг ирмэг дээр эхлүүлбэл хөдөлгөөн хоцорсон мэт мэдрэгдэнэ.
        rootMargin: '0px 0px -8% 0px',
        // ЯГ 0: өндөр элемент (баатрын зураг гэх мэт) харагдах хэсгээс
        // өндөр байвал хэсэгчилсэн харагдац нь тогтоосон хувийг хэзээ ч
        // давахгүй байж мэднэ. Нэг л пиксел харагдвал хангалттай.
        threshold: 0,
      },
    )

    const targets = () => document.querySelectorAll('[data-rv]:not(.is-in)')
    targets().forEach((el) => observer.observe(el))

    /**
     * Аюулгүйн тор.
     *
     * Ажиглагч ямар ч шалтгаанаар (зураг хожуу ачаалж зохиомж шилжсэн,
     * эхний дуудлага гацсан, элемент нуугдмал эцэгтэй байсан) элементийг
     * алдвал тэр агуулга ҮҮРД харагдахгүй үлдэнэ. Хөдөлгөөн бүтэлгүйтэх нь
     * зүгээр, харин АГУУЛГА алга болох нь болохгүй.
     *
     * Тиймээс ачаалал дуусаад нэг удаа шүүрдэж, харагдах хэсэгт хүрсэн
     * бүхнийг хэмжилтээр нь шууд нээнэ.
     */
    let timer = 0
    const sweep = () => {
      for (const el of targets()) {
        const box = el.getBoundingClientRect()
        if (box.top < window.innerHeight && box.bottom > 0) {
          show(el)
          observer.unobserve(el)
        }
      }
    }

    const arm = () => {
      timer = window.setTimeout(sweep, 400)
    }

    if (document.readyState === 'complete') arm()
    else window.addEventListener('load', arm, { once: true })

    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
      window.removeEventListener('load', arm)
    }
  }, [pathname])

  return null
}
