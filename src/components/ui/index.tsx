import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

/* ── Товч ──────────────────────────────────────────────────────────────────
   Дугуй хэлбэр (pill) — хайрцгуудын том радиустай нийцэж, стандарт
   `rounded-lg` төрхөөс салгаж өгнө. */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  // Дүүрсэн цагаан = үндсэн үйлдэл. Хуудас бүрд ганц л байх ёстой.
  primary: 'bg-button text-button-ink hover:brightness-88',
  // Хүрээтэй = хоёрдогч. Дүүргэлтгүй тул анхаарал бага татна.
  secondary: 'border border-line-strong text-foreground hover:border-foreground hover:bg-surface-2',
  ghost: 'text-foreground-soft hover:bg-surface-2 hover:text-foreground',
  // Устгах/цуцлах — бүдэг эхэлж, hover дээр л тодорно. Санамсаргүй дарахаас сэргийлнэ.
  danger:
    'border border-line-strong text-muted hover:border-foreground hover:text-foreground hover:bg-surface-2',
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold ' +
  'transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ' +
  // Hover дээр өчүүхэн өргөгдөж, дарахад суух — хуруунд хариу мэдрэгдэнэ.
  // Идэвхгүй товч хөдлөх ёсгүй: дарагдахгүй гэдгээ хөдөлгөөнөөрөө ч хэлнэ.
  'hover:-translate-y-px active:translate-y-0 active:scale-[0.97] ' +
  'disabled:transform-none disabled:hover:translate-y-0'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}

export function ButtonLink({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />
}

/* ── Гарчиг, хэсэг ─────────────────────────────────────────────────────── */

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="font-display text-[11px] font-medium tracking-[0.22em] text-muted uppercase">
      {children}
    </span>
  )
}

export function Section({
  title,
  eyebrow,
  action,
  children,
  className = '',
}: {
  title?: ReactNode
  eyebrow?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`flex flex-col gap-7 ${className}`}>
      {(title || action) && (
        <div className="flex flex-col gap-3.5">
          {/* Эйброуг богино зураас дагалдана — гарчгийн блок хаанаас
              эхэлж байгааг нүд шууд олно. */}
          {eyebrow && (
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-px w-7 shrink-0 bg-line-strong" />
              <Eyebrow>{eyebrow}</Eyebrow>
            </div>
          )}
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            {title && <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>}
            {action}
          </div>
          <div className="rule" />
        </div>
      )}
      {children}
    </section>
  )
}

export function PageHeader({
  title,
  lead,
  eyebrow,
}: {
  title: ReactNode
  lead?: ReactNode
  eyebrow?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-4 pb-2">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
      {lead && <p className="max-w-[58ch] text-lg text-foreground-soft">{lead}</p>}
      <div className="rule mt-2" />
    </header>
  )
}

/* ── Хайрцаг ───────────────────────────────────────────────────────────── */

export function Card({
  children,
  className = '',
  interactive = false,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
}) {
  return (
    <div className={`card p-6 ${interactive ? 'card-link' : ''} ${className}`}>{children}</div>
  )
}

/**
 * Төлөвийн шошго.
 *
 * Монохром систем дээр өнгө байхгүй тул ялгааг ХЭЛБЭР үүсгэнэ:
 *   good    → дүүрсэн цагаан  · баталгаажсан, эерэг
 *   warn    → тод хүрээ       · анхаарал шаардсан
 *   danger  → тасархай хүрээ  · боломжгүй, цуцлагдсан
 *   neutral → бүдэг дүүргэлт  · энгийн мэдээлэл
 */
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'good' | 'warn' | 'danger'
}) {
  const tones = {
    neutral: 'bg-surface-3 text-foreground-soft',
    accent: 'bg-foreground text-background',
    good: 'bg-foreground text-background',
    warn: 'border border-line-strong text-foreground',
    danger: 'border border-dashed border-line-strong text-muted',
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

/**
 * Мэдэгдэл. Ялгаа нь зүүн ирмэгийн хэв болон текстийн жинд.
 *   good   → тод цагаан ирмэг, цагаан текст
 *   warn   → тасархай ирмэг, бүдэг текст
 *   danger → зузаан цагаан ирмэг, тод текст
 */
export function Alert({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'good' | 'warn' | 'danger'
  children: ReactNode
}) {
  const tones = {
    neutral: 'bg-surface-2 text-foreground-soft',
    good: 'bg-surface-2 text-foreground border-l-2 border-foreground',
    warn: 'bg-surface-2 text-foreground-soft border-l-2 border-dashed border-line-strong',
    danger: 'bg-surface-2 text-foreground font-medium border-l-[3px] border-foreground',
  }
  return <div className={`rounded-2xl px-5 py-4 text-sm ${tones[tone]}`}>{children}</div>
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line px-6 py-20 text-center">
      {/* Хоосон байдлыг ХЭЛБЭРЭЭР заана — тасархай тойрог, дотор нь зураас */}
      <span
        aria-hidden
        className="grid h-10 w-10 place-items-center rounded-full border border-dashed border-line-strong text-muted"
      >
        <span className="h-px w-3.5 bg-current" />
      </span>
      <span className="max-w-[40ch] text-sm text-muted">{children}</span>
    </div>
  )
}

/* ── Формын элементүүд ─────────────────────────────────────────────────── */

const controlClass =
  'w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-foreground ' +
  'placeholder:text-muted transition-colors focus:border-foreground focus:outline-none'

export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold tracking-wide text-foreground-soft uppercase">
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return <input className={`${controlClass} ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }: ComponentProps<'textarea'>) {
  return <textarea className={`${controlClass} ${className}`} rows={4} {...props} />
}

export function Select({ className = '', ...props }: ComponentProps<'select'>) {
  return <select className={`${controlClass} ${className}`} {...props} />
}

/* ── Хүснэгт ───────────────────────────────────────────────────────────── */

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">{children}</table>
    </div>
  )
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={`border-b border-line px-5 py-3 text-left text-[11px] font-semibold tracking-[0.14em] text-muted uppercase ${className}`}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className = '',
  colSpan,
}: {
  children?: ReactNode
  className?: string
  colSpan?: number
}) {
  return (
    <td colSpan={colSpan} className={`border-b border-line/50 px-5 py-4 align-top ${className}`}>
      {children}
    </td>
  )
}
