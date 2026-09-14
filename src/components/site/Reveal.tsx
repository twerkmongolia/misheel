'use client'

import { useEffect } from 'react'

/**
 * Гүйлтийн хөдөлгөөний ажиглагч.
 *
 * `[data-rv]` тэмдэгтэй элемент харагдах хэсэгт орж ирэхэд `.is-in` нэмнэ —
 * цаашдын бүх хөдөлгөөнийг CSS хийнэ (§ globals.css § 6). Энэ хуваарилалт
 * санаатай: JS нь ХЭЗЭЭ гэдгийг л шийднэ, ЮУ БОЛОХЫГ загварын хуудас
 * шийднэ. Тиймээс хөдөлгөөний хэлийг өөрчлөхөд энэ файл хөндөгдөхгүй.
 *
 * ── Яагаад MutationObserver вэ ─────────────────────────────────────────
 * Урьд нь ажиглагч ЗӨВХӨН замын өөрчлөлт дээр дахин зэвсэглэдэг байв
 * (`usePathname`). Гэвч шүүлтүүр нь замыг ӨӨРЧИЛДӨГГҮЙ — зөвхөн асуултыг:
 * `/mn/courses?mode=studio` → `?mode=online`. Карт бүр `key` -тэй тул React
 * тэднийг ДАХИН ашиглахгүй, ШИНЭ элемент үүсгэнэ — шинэ элемент нь
 * `.is-in` -гүй, ажиглагдаагүй, тиймээс `opacity: 0` дээрээ ҮҮРД үлдэнэ.
 * Анги, дэлгүүрийн жагсаалт шүүсний дараа ХООСОН харагдах шалтгаан яг энэ
 * байлаа.
 *
 * Одоо DOM-д шинэ зангилаа орж ирэх бүрд ажиглана. Энэ нь чиглүүлэгчээс
 * ХАМААРАХГҮЙ: шүүлтүүр, хуудаслалт, дараа нэмэгдэх ямар ч динамик агуулга
 * ижилхэн хамрагдана.
 *
 * ── Suspense-ийн ЗӨӨЛТ ────────────────────────────────────────────────
 * Streaming SSR нь бэлэн болоогүй хэсгийг эхлээд `<div hidden>` дотор
 * зурж, дараа нь `$RC` скриптээр байрандаа ЗӨӨДӨГ. Тэр элемент нь
 * НУУГДМАЛ үедээ ажиглагдсан байдаг — огтлолцоогүй, тиймээс нээгдээгүй.
 * Зөөгдөх нь «шинэ зангилаа» биш тул зөвхөн ажиглалт нэмэх нь хүрэхгүй.
 *
 * Тиймээс DOM өөрчлөгдөх бүрд ХАРАГДАХ ХЭСГИЙГ дахин шүүрдэнэ: хэмжилт
 * нь ажиглагчийн дохиог хүлээхгүй, шууд `getBoundingClientRect` дээр
 * тогтоно. Дебаунс нь дараалсан олон мутацийг нэг шүүрдэлт болгоно.
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

    const watch = (el: Element) => {
      if (!el.classList.contains('is-in')) observer.observe(el)
    }

    /** Зангилаа ӨӨРӨӨ ажиглагдах зүйл байж ч болно, дотроо агуулж ч болно. */
    const scan = (node: Element) => {
      if (node.matches('[data-rv]')) watch(node)
      node.querySelectorAll('[data-rv]:not(.is-in)').forEach(watch)
    }

    targets().forEach(watch)

    /* Шинээр орж ирсэн агуулгыг барина (§ файлын толгой). Зөвхөн НЭМЭГДСЭН
       зангилааг шалгана — бүх DOM-ыг дахин шүүрдэх нь мутаци бүр дээр
       давтагдах ба урт жагсаалтад үнэтэй болно. */
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) scan(node as Element)
        }
      }
      // Зөөгдсөн (шинэ биш) элементүүдийг барих — дээрх тайлбарыг үзнэ үү.
      schedule()
    })
    mutations.observe(document.body, { childList: true, subtree: true })

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
        // Өндөр, өргөнгүй элемент нь ХАРАГДАХГҮЙ эцэгтэй (Suspense-ийн
        // нуугдсан сав) — түүнийг нээх нь эрт, ажиглагч барина.
        if (box.width === 0 && box.height === 0) continue
        if (box.top < window.innerHeight && box.bottom > 0) {
          show(el)
          observer.unobserve(el)
        }
      }
    }

    /** Дараалсан мутацуудыг нэг шүүрдэлт болгоно. */
    const schedule = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(sweep, 120)
    }

    if (document.readyState === 'complete') schedule()
    else window.addEventListener('load', schedule, { once: true })

    return () => {
      observer.disconnect()
      mutations.disconnect()
      window.clearTimeout(timer)
      window.removeEventListener('load', schedule)
    }
  }, [])

  return null
}
