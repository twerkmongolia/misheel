import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { AdminIcon, type NavIcon } from './AdminIcon'

/**
 * Удирдлагын дизайн систем.
 *
 * Яагаад `@/components/ui` -г дахин ашиглаагүй вэ: нийтийн сайт МОНОХРОМ
 * бөгөөд төлөвийг хэлбэрээр (дүүрсэн / хүрээтэй / тасархай) заадаг. Тэр
 * шийдэл маркетингийн хуудсанд зөв ч, удирдлагад алдаа болдог — «Төлөгдсөн»
 * ба «Цуцлагдсан» хоёр яг ижил хар бөмбөлөг болж, хүснэгтийг гүйлгэж
 * харахад ялгагдахаа больдог. Энд өнгө бол чимэг биш, МЭДЭЭЛЭЛ.
 *
 * Хэмжээсийн систем (нягтрал):
 *   радиус  — карт 14px, товч/оролт 8px  (сайт 20px — тэр нь агуулгын хуудас)
 *   өндөр   — товч 36px, жижиг товч 30px, хүснэгтийн мөр ~44px
 *   зай     — хэсэг хооронд 24px, хэсэг доторх 12-16px
 */

/* ── Товч ──────────────────────────────────────────────────────────────── */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-brand-ink hover:brightness-110 active:brightness-95 shadow-[var(--shadow-card)]',
  secondary: 'border border-line-strong bg-surface text-foreground hover:bg-surface-2 hover:border-foreground-soft',
  ghost: 'text-foreground-soft hover:bg-surface-2 hover:text-foreground',
  // Устгал — бүдгээр эхэлж, hover дээр л улаан болно. Санамсаргүй дарахаас сэргийлнэ.
  danger: 'border border-line text-muted hover:border-danger hover:bg-danger-soft hover:text-danger',
}

const sizes: Record<Size, string> = {
  sm: 'h-[30px] gap-1.5 rounded-lg px-2.5 text-xs',
  md: 'h-9 gap-2 rounded-lg px-3.5 text-sm',
}

const buttonBase =
  // `admin-btn` — утсан дээр хуруунд тохирсон өндөр (§ globals.css)
  'admin-btn inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap ' +
  'transition-[background-color,border-color,color,filter] duration-150 ' +
  'disabled:pointer-events-none disabled:opacity-40'

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: Variant; size?: Size }) {
  return (
    <button className={`${buttonBase} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />
  )
}

export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return (
    <Link className={`${buttonBase} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />
  )
}

/* ── Хуудасны толгой ───────────────────────────────────────────────────── */

/**
 * Хуудас бүр ижил бүтэцтэй эхэлнэ: нэр → нэг мөр тайлбар → үйлдэл.
 * Тайлбар нь чимэг биш — «энэ дэлгэц юу хийдэг вэ» гэдгийг шинэ ажилтанд
 * зааж өгнө.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] leading-tight font-semibold">{title}</h1>
        {description && <p className="mt-1.5 max-w-[68ch] text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/* ── Хайрцаг ───────────────────────────────────────────────────────────── */

export function Panel({
  title,
  description,
  actions,
  children,
  flush = false,
  className = '',
}: {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  /** Хүснэгт өөрөө ирмэг хүртэл дүүрэх үед доторх зайг авна. */
  flush?: boolean
  className?: string
}) {
  return (
    <section className={`admin-card overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  )
}

/**
 * Хумигддаг хэсэг — «шинээр нэмэх» формуудад.
 *
 * Өмнө нь хуудас бүр задгай формоор эхэлж, ажилтны ХАРАХ гэж ирсэн өгөгдөл
 * дэлгэцээс доош түлхэгддэг байв. Нэмэх нь ховор, харах нь байнга — тиймээс
 * форм анхдагчаар хумигдсан. `<details>` тул JS шаардахгүй.
 */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  icon = 'plus',
  flush = false,
}: {
  summary: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  /** `plus` нь нээгдэхдээ × болж эргэнэ; бусад дүрс хөдөлгөөнгүй. */
  icon?: NavIcon
  flush?: boolean
}) {
  return (
    <details open={defaultOpen} className="admin-card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-5 py-3.5 text-sm font-semibold transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-soft text-brand ${
            icon === 'plus' ? 'transition-transform duration-200 group-open:rotate-45' : ''
          }`}
        >
          <AdminIcon name={icon} className="h-3.5 w-3.5" />
        </span>
        {summary}
      </summary>
      <div className={`border-t border-line ${flush ? '' : 'p-5'}`}>{children}</div>
    </details>
  )
}

/* ── Үзүүлэлт ──────────────────────────────────────────────────────────── */

export function StatCard({
  icon,
  label,
  value,
  hint,
  href,
}: {
  icon: NavIcon
  label: string
  value: string | number
  hint?: ReactNode
  href?: string
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted">{label}</span>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-foreground-soft">
          <AdminIcon name={icon} className="h-[17px] w-[17px]" />
        </span>
      </div>
      {/* Утсан дээр тоо, тайлбар нэг мөрөнд — 4 карт багана болж
          дэлгэцийг эзлэхгүй. Дэлгэцэн дээр урьдын адил доошоо. */}
      <div className="mt-2 flex items-baseline justify-between gap-2 sm:mt-3 sm:block">
        <span className="text-[26px] leading-none font-semibold tracking-[-0.02em] tnum sm:block sm:text-[30px]">
          {value}
        </span>
        <span className="text-xs text-muted tnum sm:mt-2 sm:block sm:h-4">{hint}</span>
      </div>
    </>
  )

  const shell = 'admin-card p-4 transition-colors sm:p-5'

  return href ? (
    <Link href={href} className={`${shell} block hover:border-line-strong hover:bg-surface-2/40`}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  )
}

/* ── Төлөв ─────────────────────────────────────────────────────────────── */

export type Tone = 'neutral' | 'good' | 'warn' | 'danger' | 'info'

const badgeTones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted ring-line',
  good: 'bg-good-soft text-good ring-good/20',
  warn: 'bg-warn-soft text-warn ring-warn/20',
  danger: 'bg-danger-soft text-danger ring-danger/20',
  info: 'bg-info-soft text-info ring-info/20',
}

/**
 * Төлөвийн шошго — цэг + текст.
 *
 * Цэг нь өнгө ялгаж чаддаггүй хүнд ч байрлалаараа ялгарах нэмэлт дохио
 * (өнгө дангаараа мэдээлэл дамжуулж БОЛОХГҮЙ — WCAG 1.4.1).
 */
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${badgeTones[tone]}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
      {children}
    </span>
  )
}

const alertTones: Record<Tone, { box: string; icon: NavIcon }> = {
  neutral: { box: 'bg-surface-2 text-foreground-soft border-line', icon: 'info' },
  good: { box: 'bg-good-soft text-good border-good/25', icon: 'success' },
  warn: { box: 'bg-warn-soft text-warn border-warn/25', icon: 'alert' },
  danger: { box: 'bg-danger-soft text-danger border-danger/25', icon: 'alert' },
  info: { box: 'bg-info-soft text-info border-info/25', icon: 'info' },
}

export function Alert({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  const { box, icon } = alertTones[tone]
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${box}`}>
      <AdminIcon name={icon} className="mt-px h-4 w-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </div>
  )
}

export function EmptyState({ icon, title, hint }: { icon: NavIcon; title: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-faint">
        <AdminIcon name={icon} className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      </div>
    </div>
  )
}

/* ── Формын элементүүд ─────────────────────────────────────────────────── */

const control =
  'w-full rounded-lg border border-line bg-surface px-3 text-sm text-foreground ' +
  'placeholder:text-faint transition-colors hover:border-line-strong ' +
  'focus:border-brand focus:outline-none disabled:opacity-50'

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-foreground-soft">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return <input className={`${control} h-9 ${className}`} {...props} />
}

export function Select({ className = '', ...props }: ComponentProps<'select'>) {
  return <select className={`${control} h-9 ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }: ComponentProps<'textarea'>) {
  return <textarea className={`${control} py-2 ${className}`} rows={3} {...props} />
}

/** Файл сонгогч — хөтчийн анхдагч төрх бусад оролтоос эрс тусгаардаг. */
export function FileInput({ className = '', ...props }: ComponentProps<'input'>) {
  return (
    <input
      type="file"
      className={
        'h-9 cursor-pointer rounded-lg border border-line bg-surface px-2 py-[5px] text-xs ' +
        'text-muted transition-colors hover:border-line-strong ' +
        'file:mr-2.5 file:cursor-pointer file:rounded-md file:border-0 file:bg-surface-3 ' +
        `file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-foreground ${className}`
      }
      {...props}
    />
  )
}

/** Формын доод мөр — үндсэн үйлдэл баруун талд, тусгаарлах зураастай. */
export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
      {children}
    </div>
  )
}

/* ── Шүүлтүүр ──────────────────────────────────────────────────────────── */

export function FilterChip({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors ${
        active
          ? 'border-transparent bg-brand text-brand-ink'
          : 'border-line bg-surface text-muted hover:border-line-strong hover:text-foreground'
      }`}
    >
      {children}
    </Link>
  )
}

/* ── Хүснэгт ───────────────────────────────────────────────────────────── */

/**
 * Мөр дээгүүр гүйлгэхэд тодрох (hover) нь урт мөрийг нүдээр дагахад тусална.
 * Сүүлийн мөрийн доод зураасыг авна — картын хүрээтэй давхацдаг.
 */
export function Table({ children, minWidth = 640 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table
        // `admin-table` нь жижиг дэлгэц дээр мөрийг карт болгож задална
        // (§ globals.css «Утасны төрх»). `--tbl-min` нь зөвхөн md-ээс дээш.
        className="admin-table text-sm [&_tbody_tr:hover]:bg-surface-2/60 [&_tbody_tr:last-child>td]:border-b-0"
        style={{ '--tbl-min': `${minWidth}px` } as React.CSSProperties}
      >
        {children}
      </table>
    </div>
  )
}

export function Th({
  children,
  className = '',
  align = 'left',
}: {
  children?: ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  return (
    <th
      className={`border-b border-line bg-surface-2/50 px-4 py-2.5 text-[11px] font-semibold tracking-[0.06em] text-muted uppercase ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className}`}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className = '',
  colSpan,
  align = 'left',
  label,
}: {
  children?: ReactNode
  className?: string
  colSpan?: number
  align?: 'left' | 'right'
  /**
   * Утсан дээр энэ нүдний өмнө гарах шошго — багана хаана байсныг орлоно.
   * Мөрийн гарчиг (эхний нүд) болон үйлдлийн нүдэнд ӨГӨХГҮЙ: тэдгээр нь
   * шошгогүйгээр өөрсдөө ойлгогдоно.
   */
  label?: string
}) {
  return (
    <td
      colSpan={colSpan}
      data-label={label}
      className={`border-b border-line px-4 py-2.5 align-middle ${
        align === 'right' ? 'text-right' : ''
      } ${className}`}
    >
      {children}
    </td>
  )
}

/** Хүснэгт доторх хоёрдогч мөр — жишээ нь утас, хаяг нэрийн доор. */
export function Sub({ children }: { children: ReactNode }) {
  return <span className="mt-0.5 block text-xs text-muted">{children}</span>
}
