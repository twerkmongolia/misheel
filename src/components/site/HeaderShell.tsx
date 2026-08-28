'use client'

import { useChromeScroll } from './useChromeScroll'

/**
 * Гүйлгэхэд ухардаг навбар — утасны апп-уудын нийтлэг зан.
 *
 * Доош гүйлгэх = хэрэглэгч контент уншиж байна → навбар замаас зайлна.
 * Дээш гүйлгэх = хэрэглэгч ямар нэг зүйл хайж байна → навбар шууд гарч ирнэ.
 *
 * `<header>` өөрөө хувиргалтгүй (transform) үлдэж, зөвхөн дотоод мөр нь
 * гулсана. Ингэснээр цэсний `fixed` самбар харагдах хэсгээр биш, header-ийн
 * хайрцгаар хэмжигдэх алдаа гарахгүй.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const { hidden, lifted } = useChromeScroll()

  return (
    <header className="pointer-events-none sticky top-0 z-40">
      <div
        className={`pointer-events-auto border-b transition-[transform,background-color,border-color] duration-300 ease-out ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        } ${
          lifted
            ? 'border-line/70 bg-background/80 backdrop-blur-xl'
            : 'border-transparent bg-background/40 backdrop-blur-md'
        }`}
      >
        {children}
      </div>
    </header>
  )
}
