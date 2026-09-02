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

/**
 * Товч нь НИЙТИЙН САЙТЫН товч (§ globals.css `.btn`). Өмнө нь удирдлага
 * өөрийн гэсэн дугуйрсан, ногоон, сүүдэртэй товчтой байв — өөр өнгө, өөр
 * хэлбэр нь хоёр өөр програм мэт мэдрүүлдэг.
 *
 * Hover дээр дүүргэлт доороос дээш ЭРГЭНЭ: цагаан товч хар болж, хар товч
 * цагаан болно. Монохром системд боломжтой цорын ганц жинхэнэ өөрчлөлт.
 */
const variants: Record<Variant, string> = {
  primary: 'btn-solid',
  secondary: 'btn-line',
  ghost: 'btn-bare',
  // Тасархай хүрээ — санамсаргүй дарахаас ХЭЛБЭРЭЭРЭЭ сэргийлнэ.
  danger: 'btn-risk',
}

const sizes: Record<Size, string> = {
  sm: 'btn-sm',
  md: '',
}

const buttonBase = 'btn'

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
    <header className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          {/* Гарчиг нь serif — нийтийн сайттай нэг дуу хоолой. Тайлбар нь
              чимэг биш: «энэ дэлгэц юу хийдэг вэ» гэдгийг шинэ ажилтанд
              зааж өгнө. */}
          <h1 className="t-h2">{title}</h1>
          {description && <p className="t-small mt-2 max-w-[68ch] text-muted">{description}</p>}
        </div>
        {/* Утсан дээр үйлдэл нь БҮТЭН ӨРГӨН болно. Гарчгийн хажууд шахагдсан
            жижиг товч нь хамгийн олон дардаг зүйл байтал хамгийн бага бай
            болдог — 44px хүрэлцээний доод хэмжээнд ч хүрэхгүй. */}
        {actions && (
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            {actions}
          </div>
        )}
      </div>
      <div className="hr" />
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
    <section className={`flex flex-col ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line pb-3.5">
          <div className="min-w-0">
            {/* Хуудсанд ГУРВАН түвшний эрэмбэ байх ёстой:
                  хуудасны нэр  → `t-h2`, serif, 28-44px
                  хэсгийн нэр   → `t-h3`, sans, 17-21px   ← энэ
                  баганын нэр   → `t-label`, 11px
                Эхний оролдлогод хэсгийн нэрийг 11px шошго болгосон нь
                дунд түвшинг бүхэлд нь алгасаж, гарчиг ба хүснэгтийн толгой
                хоёрыг ижил жинтэй болгож байв. */}
            {title && <h2 className="t-h3">{title}</h2>}
            {description && <p className="t-meta mt-1.5 text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
        </div>
      )}
      <div className={flush ? '' : 'pt-5'}>{children}</div>
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
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-[var(--r)] border border-line text-foreground ${
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
  /* Тоо нь serif — нийтийн сайтын «том тоо» -той нэг дуу хоолой (§ `.t-num`).
     Хайрцаг байхгүй: дээд шугам нь үзүүлэлтүүдийг тусгаарлана. Дөрвөн
     сүүдэртэй карт зэрэгцэхээс илүү тайван, өгөгдөл нь илүү тод. */
  const body = (
    <>
      <span className="t-label flex items-center gap-2 text-muted">
        <AdminIcon name={icon} className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
      <span className="t-num mt-3 block text-[2rem] sm:text-[2.5rem]">{value}</span>
      <span className="t-meta mt-2 block h-4 text-muted">{hint}</span>
    </>
  )

  /* Дөрвөн блок ЗЭРЭГЦЭХ тул тус бүрдээ дээд зураастай байвал дөрвөн
     тасархай зураас болж, эвдэрсэн шугам мэт харагдана. Оронд нь блокууд
     нь хоорондоо БОСОО зураасаар тусгаарлагдаж, гадна талаараа нэг бүтэн
     зурвас үүсгэнэ (§ `StatRow` доор). */
  const shell = 'group block px-4 py-4 transition-colors sm:px-5 sm:py-5'

  return href ? (
    <Link href={href} className={`${shell} hover:bg-surface`}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  )
}

/**
 * Үзүүлэлтийн зурвас — `StatCard` -уудыг багтаана.
 *
 * Хуваарийн хуудасны долоо хоногийн зурваст ашигласан хэв: гадна талаараа
 * дээд, доод шугам, дотроо босоо тусгаарлагч. Дөрвөн тусдаа карт биш НЭГ
 * хэрэгсэл мэт уншигдана.
 */
export function StatRow({ children }: { children: ReactNode }) {
  return (
    /* `divide-y` -г ХЭРЭГЛЭЖ БОЛОХГҮЙ: тэр нь DOM дараалалд тулгуурлан
       ЭХНИЙХЭЭС бусад бүх хүүхдэд дээд хүрээ нэмдэг. Хоёр баганат торонд
       хоёр дахь нүд нь мөрийн БАРУУН талд суудаг ч дээрээ зураастай болж,
       эхний нүдтэйгээ зөрнө. Тиймээс хүрээг байрлалаар нь өгнө:

         утас  (1 багана)  — эхнийхээс бусад бүгд дээрээ зураастай
         sm    (2 багана)  — 3 дахиас хойш дээрээ, тэгш нүд зүүн талдаа
         lg    (4 багана)  — хэвтээ зураас алга, эхнийхээс бусад зүүн талдаа */
    <div
      className="grid border-y border-line [&>*+*]:border-t [&>*+*]:border-line
                 sm:grid-cols-2 sm:[&>*+*]:border-t-0 sm:[&>*:nth-child(2n)]:border-l sm:[&>*:nth-child(n+3)]:border-t
                 lg:grid-cols-4 lg:[&>*+*]:border-l lg:[&>*:nth-child(n+3)]:border-t-0"
    >
      {children}
    </div>
  )
}

/* ── Төлөв ─────────────────────────────────────────────────────────────── */

export type Tone = 'neutral' | 'good' | 'warn' | 'danger' | 'info'

/**
 * Төлөвийн шошго.
 *
 * Монохром систем дээр өнгө байхгүй тул ялгааг ХЭЛБЭР үүсгэнэ — нийтийн
 * сайттай яг ижил дүрэм (§ globals.css `.tag`):
 *
 *   good    → дүүрсэн        · баталгаажсан, дууссан
 *   info    → бүдэг дүүргэлт · явцад буй
 *   warn    → тод хүрээ      · анхаарал шаардсан
 *   danger  → тасархай хүрээ · цуцлагдсан, боломжгүй
 *   neutral → бүдэг дүүргэлт · энгийн мэдээлэл
 *
 * Өнгө дангаараа мэдээлэл дамжуулж БОЛОХГҮЙ (WCAG 1.4.1) — энд өнгө огт
 * байхгүй тул текст ба хэлбэр хоёулаа ажиллана.
 */
const badgeTones: Record<Tone, string> = {
  neutral: 'tag-mute',
  good: 'tag-fill',
  warn: 'tag-line',
  danger: 'tag-dash',
  info: 'tag-mute',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`tag ${badgeTones[tone]}`}>{children}</span>
}

/** Ялгаа нь зүүн ирмэгийн ХЭВ болон текстийн жинд — өнгөнд биш. */
const alertTones: Record<Tone, { box: string; icon: NavIcon }> = {
  neutral: { box: 'border-line text-foreground-soft', icon: 'info' },
  good: { box: 'border-foreground text-foreground', icon: 'success' },
  warn: { box: 'border-line-strong border-dashed text-foreground-soft', icon: 'alert' },
  danger: { box: 'border-foreground border-l-[3px] font-medium text-foreground', icon: 'alert' },
  info: { box: 'border-line text-foreground-soft', icon: 'info' },
}

export function Alert({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  const { box, icon } = alertTones[tone]
  return (
    <div className={`t-small flex items-start gap-3 border-l-2 bg-surface px-5 py-4 ${box}`} role="status">
      <AdminIcon name={icon} className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </div>
  )
}

export function EmptyState({ icon, title, hint }: { icon: NavIcon; title: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 border border-dashed border-line px-5 py-14 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full border border-dashed border-line-strong text-muted">
        <AdminIcon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <div>
        <p className="t-small font-medium">{title}</p>
        {hint && <p className="t-small mt-1 max-w-[42ch] text-muted">{hint}</p>}
      </div>
    </div>
  )
}

/* ── Формын элементүүд ─────────────────────────────────────────────────── */

/* Хайрцаг биш ШУГАМ — фокуслахад доод шугам зүүнээс баруун тийш татагдана
   (§ globals.css `.ctl`). Нийтийн сайтын формтой яг ижил. */
const control = 'ctl'

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
      <span className="t-label text-muted">{label}</span>
      {children}
      {hint && <span className="t-meta text-faint">{hint}</span>}
    </label>
  )
}

export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return <input className={`${control} ${className}`} {...props} />
}

export function Select({ className = '', ...props }: ComponentProps<'select'>) {
  return <select className={`${control} ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }: ComponentProps<'textarea'>) {
  return <textarea className={`${control} ${className}`} rows={3} {...props} />
}

export { FileInput } from './FileInput'

/** Формын доод мөр — үндсэн үйлдэл баруун талд, тусгаарлах зураастай. */
export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5">
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
      /* Нийтийн сайтын шүүлтийн чиптэй ижил (§ globals.css `.chip`).
         Сонгогдсон нь ЭРГЭНЭ — дугуй бөмбөлөг биш, 3px булантай. */
      className={`chip ${active ? 'chip-on' : ''}`}
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
        className="admin-table t-small [&_tbody_tr:hover]:bg-surface [&_tbody_tr:last-child>td]:border-b-0"
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
      /* Дэвсгэргүй. Хүснэгтийн толгойг өнгөөр биш ШУГАМААР тусгаарлана —
         саарал зурвас нь хүснэгтийг хайрцаг болгодог. */
      className={`t-label border-b border-line-strong px-4 py-3 text-muted ${
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
      className={`border-b border-line px-4 py-3.5 align-middle ${
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
