'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Төлбөр баталгаажихыг хүлээж, хуудсаа өөрөө шинэчилнэ.
 *
 * ── Яагаад хэрэгтэй вэ ─────────────────────────────────────────────────
 * Хэрэглэгч Bonum дээр төлөөд буцаж ирэх нь webhook ирэхээс ХУРДАН байж
 * болно: хөтөч шууд буцдаг бол webhook нь сүлжээгээр явж, гарын үсгээ
 * шалгуулж, өгөгдлийн сан руу бичнэ. Тэр хэдэн секундэд захиалга
 * «Төлбөр хүлээгдэж буй» гэж харагдана — дөнгөж төлсөн хүнд энэ нь
 * «мөнгө минь хаачив» гэсэн айдас төрүүлнэ.
 *
 * Хуудас нь серверт зурагддаг тул шинэ төлөвийг харахын тулд дахин
 * ачаалах ёстой. `router.refresh()` нь яг үүнийг хийнэ — бүтэн ачаалалтгүй,
 * гүйлтийн байрлал, формын утга хэвээр.
 *
 * ── Яагаад ХЯЗГААРТАЙ вэ ───────────────────────────────────────────────
 * Мөнхийн давталт нь webhook огт ирэхгүй тохиолдолд (Bonum дээр хаяг
 * бүртгэгдээгүй, төлбөр цуцлагдсан) сервер рүү эцэс төгсгөлгүй хүсэлт
 * илгээнэ. Хоёр минутын дараа зогсоод, гараар шинэчлэхийг санал болгоно:
 * тэр үед асуудал нь хүлээж засрахгүй нь тодорхой болсон байна.
 */
const EVERY_MS = 3000
const TRIES = 40 // ≈ 2 минут

export function PaymentWatch({ label, timeoutLabel }: { label: string; timeoutLabel: string }) {
  const router = useRouter()
  const [left, setLeft] = useState(TRIES)

  useEffect(() => {
    if (left <= 0) return

    const timer = window.setTimeout(() => {
      router.refresh()
      setLeft((n) => n - 1)
    }, EVERY_MS)

    return () => window.clearTimeout(timer)
  }, [left, router])

  return (
    <p className="t-small flex items-center gap-2.5 text-muted">
      {left > 0 && (
        <span aria-hidden className="spinner animate-spin motion-reduce:animate-none" />
      )}
      {left > 0 ? label : timeoutLabel}
    </p>
  )
}
