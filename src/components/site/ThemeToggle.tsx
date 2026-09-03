'use client'

/**
 * Гэрэлтэй / харанхуй горим солих товч.
 *
 * ── Төлөв хаана байдаг вэ ──────────────────────────────────────────────
 * `<html data-theme>` дээр. `localStorage` нь зөвхөн ХАДГАЛАЛТ — уншиж
 * тавих ажлыг зурагдахаас өмнө ажилладаг мөрийн скрипт хийнэ
 * (§ app/layout.tsx `bootScript`). Энэ бүрдэл рендерийн дараа л ажилладаг
 * тул түүнийг хүлээвэл хуудас эхлээд буруу горимоор нэг анивчина.
 *
 * ── Дүрсийг яагаад JS-ээр сонгохгүй вэ ─────────────────────────────────
 * Нар, сар хоёулаа зурагдаад аль нэг нь CSS-ээр нуугддаг
 * (§ globals.css `.theme-sun`). Сервер нь хэрэглэгчийн системийн
 * тохиргоог мэдэх боломжгүй тул JS-ээр сонговол эхний зурагт буруу дүрс
 * гараад дараа нь солигдоно.
 *
 * Дүрс нь ОДОО байгаа горимыг биш, ДАРАХАД болох горимыг заана: харанхуй
 * дээр нар харагдана — «эндээс гэрэлтэй рүү».
 */
export function ThemeToggle({ label, className = '' }: { label: string; className?: string }) {
  const flip = () => {
    const root = document.documentElement
    const chosen = root.dataset.theme
    const shown =
      chosen ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    const next = shown === 'light' ? 'dark' : 'light'

    root.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Хувийн горимд бичих боломжгүй — горим нь энэ хуудсанд ажиллана,
      // зөвхөн санагдахгүй. Товчийг эвдэх шалтгаан биш.
    }
  }

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={label}
      title={label}
      className={`icon-btn ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
        className="theme-sun h-[18px] w-[18px]"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="theme-moon h-[18px] w-[18px]"
      >
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
      </svg>
    </button>
  )
}
