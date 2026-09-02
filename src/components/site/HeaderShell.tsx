'use client'

import { useChromeScroll } from './useChromeScroll'

/**
 * Навбарын бүрхүүл.
 *
 * Гурван төлөв:
 *   · дээд талд   — тунгалаг, хүрээгүй. Баатрын зураг навбарын ард
 *                   үргэлжилнэ: хуудас навбараас эхэлдэггүй, түүнийг
 *                   ДАМЖИЖ өнгөрдөг.
 *   · гүйлгэсэн   — бүдгэрсэн дэвсгэр, доод хүрээ. Агуулга дороо
 *                   өнгөрөх тул тусгаарлагч хэрэгтэй болно.
 *   · доош гүйж   — бүрэн ухарна. Уншиж байгаа хүнд навбар хэрэггүй.
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
        data-lifted={lifted}
        className={`pointer-events-auto relative border-b transition-[transform,background-color,border-color] duration-500 ease-out ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        } ${
          lifted
            ? 'border-line bg-background/86 backdrop-blur-xl backdrop-saturate-150'
            : 'border-transparent bg-transparent'
        }`}
      >
        {children}

        {/*
          Гүйлтийн явц — навбарын доод ирмэг дээрх нэг пикселийн шугам.
          JS-гүй: `animation-timeline: scroll()` нь явцыг баримтын гүйлтэд
          шууд уяна (§ globals.css `.progress`). Дэмжигдээгүй хөтөч дээр
          `scaleX(0)` тул огт харагдахгүй — дутуу зүйл үлдэхгүй.
        */}
        <div
          aria-hidden
          className={`progress absolute inset-x-0 -bottom-px h-px origin-left bg-foreground transition-opacity duration-500 ${
            lifted ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </header>
  )
}
