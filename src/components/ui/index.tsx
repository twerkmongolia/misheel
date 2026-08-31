import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════
   БҮРДЭЛ

   Хэв нь энд БИШ, `globals.css` -д амьдарна. Энэ файл зөвхөн семантик
   тавина: аль бүрдэл ямар үүрэгтэй, ямар хувилбартай вэ. Ингэснээр
   загварыг өөрчлөхөд React файл хөндөгдөхгүй, харин үүргийг өөрчлөхөд
   загвар хөндөгдөхгүй.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Сум ──────────────────────────────────────────────────────────────────
   Товч, холбоос бүрд давтагдана. Зурсан зураас нь `→` тэмдэгтээс тогтвортой:
   үсгийн фонт солигдоход хэмжээ, суурь нь хөвөхгүй. */

export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      className={`ico h-3.5 w-3.5 shrink-0 ${className}`}
    >
      <path d="M2 8h11M9 4l4 4-4 4" />
    </svg>
  )
}

/* ── Товч ─────────────────────────────────────────────────────────────────
   Дөрвөн үүрэг. Нэрс нь ХУУЧНААР үлдэв — 20 гаруй дуудлагын газрыг
   дэмий хөдөлгөхгүйн тулд. Харагдах байдал нь бүхэлдээ шинэ. */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  // Дүүрсэн. Хуудсанд ГАНЦ л байна — hover дээр дүүргэлт эргэнэ.
  primary: 'btn-solid',
  // Хүрээтэй. Hover дээр дүүрч, үндсэн товч болж хувирна.
  secondary: 'btn-line',
  // Хүрээгүй. Гуравдагч үйлдэл — анхаарал бараг татахгүй.
  ghost: 'btn-bare',
  // Тасархай хүрээ. Санамсаргүй дарахаас ХЭЛБЭРЭЭРЭЭ сэргийлнэ.
  danger: 'btn-risk',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return <button className={`btn ${variants[variant]} ${className}`} {...props} />
}

export function ButtonLink({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`btn ${variants[variant]} ${className}`} {...props} />
}

/* ── Шошго ба гарчиг ──────────────────────────────────────────────────── */

/**
 * Хэсгийн шошго. Богино зураас дагалдана — эйброу ганцаараа хөвж байвал
 * гарчгийн блок хаанаас эхэлж байгаа нь тодорхойгүй үлддэг.
 */
export function Eyebrow({ children, plain = false }: { children: ReactNode; plain?: boolean }) {
  if (plain) return <span className="t-label text-muted">{children}</span>

  return (
    <span className="flex items-center gap-3 text-muted">
      <span aria-hidden className="h-px w-6 shrink-0 bg-line-strong" />
      <span className="t-label">{children}</span>
    </span>
  )
}

/**
 * Хэсэг.
 *
 * Гарчиг ба үйлдэл нэг шугам дээр сууна: шугам нь хоёрыг ХОЛБОНО. Шугам
 * өөрөө гүйлтэд татагдана — хэсэг эхэлж байгааг хөдөлгөөн зарлана.
 */
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
    <section className={`flex flex-col gap-9 ${className}`}>
      {(title || action) && (
        <div className="flex flex-col gap-5">
          {eyebrow && (
            <div data-rv>
              <Eyebrow>{eyebrow}</Eyebrow>
            </div>
          )}
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4" data-rv>
            {title && <h2 className="t-h2">{title}</h2>}
            {action}
          </div>
          <div className="hr hr-draw" data-rv="line" />
        </div>
      )}
      {children}
    </section>
  )
}

/**
 * Хуудасны толгой.
 *
 * Гарчиг нь дэлгэцийн өргөнөөс хамаарч 2.25rem-4.25rem хооронд урсана.
 * Тайлбар нь гарчгийн ДООР биш, ХАЖУУД сууна — уншигч гарчгийг уншаад
 * шууд доош үргэлжлүүлэх бус, хажуу тийш нүдээ шилжүүлнэ. Ингэснээр
 * толгой хэсэг хуудсыг битүүлэхгүй, зөвхөн нээнэ.
 */
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
    <header className="flex flex-col gap-7 pb-4">
      {eyebrow && (
        <div data-rv>
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
      )}
      <div className="g12 items-end gap-y-6">
        <h1 className="t-h1 col-span-12 lg:col-span-7" data-rv>
          {title}
        </h1>
        {lead && (
          <p className="t-lead col-span-12 text-foreground-soft lg:col-span-4 lg:col-start-9" data-rv>
            {lead}
          </p>
        )}
      </div>
      <div className="hr hr-draw" data-rv="line" />
    </header>
  )
}

/* ── Гадарга ──────────────────────────────────────────────────────────── */

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
    <div className={`card p-7 ${interactive ? 'card-link' : ''} ${className}`}>{children}</div>
  )
}

/**
 * Төлөвийн шошго.
 *
 * Монохром систем дээр өнгө байхгүй тул ялгааг ХЭЛБЭР үүсгэнэ:
 *   good    → дүүрсэн       · баталгаажсан, эерэг
 *   accent  → дүүрсэн       · онцолсон
 *   warn    → тод хүрээ     · анхаарал шаардсан
 *   danger  → тасархай хүрээ · боломжгүй, цуцлагдсан
 *   neutral → бүдэг дүүргэлт · энгийн мэдээлэл
 */
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'good' | 'warn' | 'danger'
}) {
  const tones = {
    neutral: 'tag-mute',
    accent: 'tag-fill',
    good: 'tag-fill',
    warn: 'tag-line',
    danger: 'tag-dash',
  }
  return <span className={`tag ${tones[tone]}`}>{children}</span>
}

/**
 * Мэдэгдэл. Ялгаа нь зүүн ирмэгийн хэв болон текстийн жинд — өнгөнд биш.
 */
export function Alert({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'good' | 'warn' | 'danger'
  children: ReactNode
}) {
  const tones = {
    neutral: 'border-line text-foreground-soft',
    good: 'border-foreground text-foreground',
    warn: 'border-line-strong border-dashed text-foreground-soft',
    danger: 'border-foreground border-l-[3px] font-medium text-foreground',
  }
  return (
    <div className={`t-small border-l-2 bg-surface px-5 py-4 ${tones[tone]}`} role="status">
      {children}
    </div>
  )
}

/**
 * Хоосон төлөв. «Юу ч алга» гэдгийг ҮГЭЭР биш ХЭЛБЭРЭЭР эхэлж хэлнэ:
 * тасархай тойрог, дотор нь ганц зураас.
 */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 border border-dashed border-line px-6 py-24 text-center">
      <span
        aria-hidden
        className="grid h-11 w-11 place-items-center rounded-full border border-dashed border-line-strong text-muted"
      >
        <span className="h-px w-4 bg-current" />
      </span>
      <span className="t-small max-w-[42ch] text-muted">{children}</span>
    </div>
  )
}

/* ── Форм ─────────────────────────────────────────────────────────────────
   Хайрцаг биш ШУГАМ. Фокуслахад доод шугам зүүнээс баруун тийш татагдана
   (§ globals.css `.ctl`) — хүрээ өнгө солихоос хамаагүй тодорхой дохио. */

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
    <label className="flex flex-col gap-1.5">
      <span className="t-label text-muted">{label}</span>
      {children}
      {hint && <span className="t-meta text-faint">{hint}</span>}
    </label>
  )
}

export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return <input className={`ctl ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }: ComponentProps<'textarea'>) {
  return <textarea className={`ctl ${className}`} rows={4} {...props} />
}

export function Select({ className = '', ...props }: ComponentProps<'select'>) {
  return <select className={`ctl ${className}`} {...props} />
}

/* ── Хүснэгт ──────────────────────────────────────────────────────────────
   Хүрээгүй. Мөрүүдийг зөвхөн хэвтээ шугам тусгаарлана — босоо шугам
   нэмбэл хүснэгт тор болж, уншилтын урсгал таслагдана. */

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="t-small w-full min-w-[560px] border-collapse">{children}</table>
    </div>
  )
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={`t-label border-b border-line-strong px-0 py-3 pr-6 text-left text-muted last:pr-0 ${className}`}
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
    <td
      colSpan={colSpan}
      className={`border-b border-line px-0 py-5 pr-6 align-top last:pr-0 ${className}`}
    >
      {children}
    </td>
  )
}
