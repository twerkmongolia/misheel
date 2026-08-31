'use client'

/**
 * Харанхуй ⇄ гэрэлтэй горим.
 *
 * Төлөвийг React-д хадгалдаггүй — цорын ганц эх сурвалж нь `<html>` дээрх
 * `data-theme`. Шалтгаан: сервер хэрэглэгчийн горимыг мэдэхгүй тул төлөвийг
 * render-дэх аливаа оролдлого hydration-ы зөрүү, эсвэл буруу дүрсний
 * анивчилт үүсгэнэ. Дүрсийг CSS сонгогч сольдог (`.when-dark` / `.when-light`).
 */
export function ThemeToggle({ label, className = '' }: { label: string; className?: string }) {
  const toggle = () => {
    const root = document.documentElement

    // Сонголт хийгээгүй бол одоо ямар горимд байгааг системээс уншина.
    const current =
      root.dataset.theme ??
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')

    const next = current === 'dark' ? 'light' : 'dark'
    root.dataset.theme = next

    // Хувийн горимд localStorage шидэж болзошгүй — унавал горим нь ажилласан хэвээр.
    try {
      localStorage.setItem('theme', next)
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`icon-btn ${className}`}
    >
      {/* Харанхуйд нар харагдана — дарвал гэрэлтэй болно */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="square"
        className="when-dark h-[17px] w-[17px]"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
      </svg>

      {/* Гэрэлтэйд сар харагдана — дарвал харанхуй болно */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="square"
        strokeLinejoin="miter"
        className="when-light h-[17px] w-[17px]"
        aria-hidden="true"
      >
        <path d="M20 13.4A8.2 8.2 0 0 1 10.6 4a8.2 8.2 0 1 0 9.4 9.4Z" />
      </svg>
    </button>
  )
}
