/**
 * Доод самбарын табын хэв — `BottomNav` болон цэсний товч хоёулаа хэрэглэнэ.
 *
 * Идэвхтэйг ӨНГӨӨР биш ДЭЭД ШУГАМААР заана: таб бүрийн дээд ирмэг дээр нэг
 * пикселийн зураас гарч ирнэ. Дүүрсэн бөмбөлөг нь самбарыг товчны эгнээ
 * болгодог бол зураас нь «энэ багана идэвхтэй» гэж заана — дээд навбарын
 * `.nav-item` -тэй яг НЭГ дүрэм (§ globals.css).
 */
export const TAB =
  // `min-w-0` ЗААВАЛ: flex элементийн анхдагч `min-width: auto` нь агшихыг
  // зөвшөөрдөггүй тул урт шошготой таб самбараас халина.
  'relative flex min-w-0 flex-1 flex-col items-center gap-1.5 px-1 pt-3 pb-2 ' +
  'text-[9px] font-semibold uppercase tracking-[0.08em] leading-none ' +
  'transition-colors duration-200 ' +
  "before:absolute before:inset-x-2 before:top-0 before:h-px before:origin-left before:bg-foreground " +
  "before:transition-transform before:duration-300 before:ease-out before:content-['']"

export const TAB_LABEL = 'block w-full truncate text-center'

export const TAB_IDLE = 'text-faint before:scale-x-0 active:text-foreground-soft'

export const TAB_ACTIVE = 'text-foreground before:scale-x-100'
