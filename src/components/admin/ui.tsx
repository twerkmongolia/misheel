import Link from 'next/link'
import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { AdminIcon, type NavIcon } from './AdminIcon'

/**
 * Удирдлагын дизайн систем.
 *
 * Яагаад `@/components/ui` -г дахин ашиглаагүй вэ: нийтийн сайт МОНОХРОМ
 * бөгөөд төлөвийг хэлбэрээр (дүүрсэн / хүрээтэй / тасархай) заадаг. Тэр
 * шийдэл маркетингийн хуудсанд зөв ч, удирдлагад алдаа болдог — хүснэгтийг
 * гүйлгэж харахад «Төлөгдсөн», «Цуцлагдсан» хоёрыг үгийг нь уншиж байж л
 * салгана. Энд өнгө бол чимэг биш, МЭДЭЭЛЭЛ (§ globals.css «Удирдлагын
 * хэсэг»).
 *
 * Хэмжээсийн систем (нягтрал):
 *   радиус  — карт 10px, товч/оролт 6px, шошго бөмбөлөг
 *   өндөр   — товч 38px, жижиг товч 32px, хүснэгтийн мөр ~46px
 *   зай     — карт хооронд 24px, карт доторх 20px
 */

/* ── Товч ──────────────────────────────────────────────────────────────── */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

/**
 * Товч нь нийтийн сайтын `.btn` класс — удирдлага дотор л 38px, 6px булан,
 * цэнхэр болж дахин хэлбэржинэ (§ globals.css `.admin-shell .btn`). Нэг
 * класс, хоёр орчин: хуудсууд гараар бичсэн `btn btn-solid` -ээ ч сольж
 * бичих шаардлагагүй.
 */
const variants: Record<Variant, string> = {
  primary: 'btn-solid',
  secondary: 'btn-line',
  ghost: 'btn-bare',
  // Улаан хүрээ — hover дээр л дүүрнэ.
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
 *
 * Доод зураас хасагдсан: доор нь шууд КАРТ эхэлдэг бөгөөд картын ирмэг
 * аль хэдийн тусгаарлаж байна. Зураас + картын ирмэг = хоёр давхар хил.
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
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="min-w-0">
        <h1 className="t-h2">{title}</h1>
        {description && <p className="mt-1 max-w-[72ch] text-[0.875rem] text-muted">{description}</p>}
      </div>
      {/* Утсан дээр үйлдэл нь БҮТЭН ӨРГӨН болно. Гарчгийн хажууд шахагдсан
          жижиг товч нь хамгийн олон дардаг зүйл байтал хамгийн бага бай
          болдог — 44px хүрэлцээний доод хэмжээнд ч хүрэхгүй. */}
      {actions && (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {actions}
        </div>
      )}
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
    /* Карт нь ХИЛ өгнө: нэг дэлгэц дээр 3-5 самбар зэрэгцэн суудаг бөгөөд
       заримд нь хүснэгт, заримд нь форм байдаг. Гадарга нь дэвсгэрээс нэг
       шат ялгарч, доторх бүх зүйл нэг биетийн эд анги болж уншигдана.

       `overflow-hidden` нь ЗААВАЛ: доторх хүснэгт, жагсаалт ирмэг хүртэл
       дүүрдэг тул тэдгээрийн булан картын радиусаар тайрагдах ёстой.

       Их бие нь `flex-1`: торонд хөрш хоёр карт ижил өндөртэй зогсох ба
       богино нь доороо хоосон зай үлдээхээс биш, ирмэгээ тайрахгүй. */
    <section className={`admin-card flex flex-col overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {/* Хуудсанд ГУРВАН түвшний эрэмбэ:
                  хуудасны нэр  → `t-h2`, 22px
                  картын нэр    → `t-h3`, 16px   ← энэ
                  баганын нэр   → `t-label`, 13px */}
            {title && <h2 className="t-h3">{title}</h2>}
            {description && <p className="mt-0.5 text-[0.8125rem] text-muted">{description}</p>}
          </div>
          {/* `shrink-0` БИШ `min-w-0`: утсан дээр таван чип нэг мөрөнд
              багтахгүй — агшиж чадахгүй сав нь тэднийг картын ирмэгээс
              гадагш түлхэж, `overflow-hidden` тайрдаг байв. */}
          {actions && <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`min-h-0 flex-1 ${flush ? '' : 'p-5'}`}>{children}</div>
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
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 text-[0.9375rem] font-medium transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/15 text-primary ${
            icon === 'plus' ? 'transition-transform duration-200 group-open:rotate-45' : ''
          }`}
        >
          <AdminIcon name={icon} className="h-4 w-4" />
        </span>
        {summary}
      </summary>
      <div className={`border-t border-line ${flush ? '' : 'p-5'}`}>{children}</div>
    </details>
  )
}

/* ── Үзүүлэлт ──────────────────────────────────────────────────────────── */

/** Үзүүлэлтийн картын өнгө — дүрс, жижиг график хоёр хуваалцана. */
export type StatTone = 'primary' | 'good' | 'danger' | 'warn' | 'info' | 'orange' | 'purple'

const statColor: Record<StatTone, string> = {
  primary: 'var(--primary)',
  good: 'var(--good)',
  danger: 'var(--danger)',
  warn: 'var(--warn)',
  info: 'var(--info)',
  orange: 'var(--chart-2)',
  purple: 'var(--chart-6)',
}

/**
 * Үзүүлэлтийн карт: нэр, тоо, өнгөт дүрс — доор нь ЧИГ ХАНДЛАГА.
 *
 * Тоо ганцаараа мэдээлэл биш: «24 захиалга» гэдэг нь сайн уу, муу юу гэдгийг
 * зөвхөн өмнөхтэй нь харьцуулж мэдэх боломжтой. Тиймээс доод мөр нь гурван
 * хэлбэрийн аль нэгээр ТҮҮХ хэлнэ:
 *
 *   `spark`    — сүүлийн өдрүүдийн жижиг багана (сүүлийнх нь баруун талд)
 *   `progress` — дүүргэлт гэх мэт хувь
 *   `hint`     — дээрх хоёр утгагүй үед нэг мөр тайлбар
 *
 * Баруун талд нь `delta` (өмнөх үетэй харьцуулсан хувь, ногоон/улаан) эсвэл
 * `aside` (төвийг сахисан тоо). График байгаа үед `hint` нь тооны доор
 * гарна.
 *
 * Жижиг график нь ЗОРИУД тэнхлэггүй: энд асуулт нь «хэд вэ» биш «өсөж
 * байна уу». Нарийн тоо хэрэгтэй бол дээрх том график бий.
 */
export function StatCard({
  icon,
  label,
  value,
  hint,
  href,
  tone = 'primary',
  spark,
  progress,
  delta,
  aside,
}: {
  icon: NavIcon
  label: string
  value: string | number
  hint?: ReactNode
  href?: string
  tone?: StatTone
  spark?: number[]
  /** 0–100 */
  progress?: number
  /** Өмнөх үетэй харьцуулсан хувь. `null` = өмнөх үе хоосон, хувь тооцох аргагүй. */
  delta?: number | null
  aside?: ReactNode
}) {
  const color = statColor[tone]

  const visual = spark !== undefined || progress !== undefined

  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-[0.9375rem] text-foreground-soft">{label}</span>
          <span className="t-num mt-1.5 block truncate text-[1.5rem] tnum">{value}</span>
          {/* График байгаа үед тайлбар тооны ДООР — доод мөрийг график,
              хувь хоёр эзэлнэ. */}
          {visual && hint && <span className="mt-1 block truncate text-[0.75rem] text-muted">{hint}</span>}
        </span>
        <span className="shrink-0 pt-0.5" style={{ color }}>
          <AdminIcon name={icon} className="h-7 w-7" />
        </span>
      </span>

      {/* Доод мөр нь `mt-auto` -оор картын ЁРООЛД наалдана: нэг эгнээний
          хоёр карт торонд ижил өндөртэй тул график, зураас, текстийн аль
          нь ч байсан нэг шугамд дуусна. */}
      <span className="mt-auto flex h-8 items-end justify-between gap-4 pt-4 box-content">
        {spark ? (
          <Sparkline values={spark} color={color} />
        ) : progress !== undefined ? (
          <span className="flex h-full min-w-0 flex-1 items-center">
            <span className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
              <span
                className="block h-full rounded-full"
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%`, background: color }}
              />
            </span>
          </span>
        ) : (
          <span className="min-w-0 flex-1 truncate pb-0.5 text-[0.8125rem] text-muted">{hint}</span>
        )}

        {delta !== undefined ? (
          <Delta value={delta} className="pb-0.5 text-[0.875rem]" />
        ) : aside !== undefined ? (
          <span className="shrink-0 pb-0.5 text-[0.875rem] font-medium tnum text-foreground-soft">{aside}</span>
        ) : null}
      </span>
    </>
  )

  const shell = 'admin-tile flex flex-col p-5'

  return href ? (
    <Link href={href} className={`${shell} admin-card-link`}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  )
}

/**
 * Өсөлтийн хувь — өсвөл ногоон, буурвал улаан.
 *
 * ⚠️ `null` нь «өмнөх үе тэг» — хувь тооцох боломжгүй. «+100%» эсвэл «∞»
 * гэж бичих нь хоёулаа худал; зураас нь «харьцуулах зүйл алга» гэдгийг
 * шударгаар хэлнэ.
 */
export function Delta({ value, className = '' }: { value: number | null; className?: string }) {
  if (value === null) {
    return (
      <span className={`shrink-0 text-faint ${className}`} title="Өмнөх үе хоосон">
        —
      </span>
    )
  }
  const tone = value > 0 ? 'text-good' : value < 0 ? 'text-danger' : 'text-muted'
  return (
    <span className={`shrink-0 font-medium tnum ${tone} ${className}`}>
      {value > 0 ? '+' : ''}
      {value}%
    </span>
  )
}

/**
 * Жижиг баганан график.
 *
 * Багана бүр 4px хүртэл ургаж, зай багадвал 1px хүртэл НАРИЙСНА — хэзээ ч
 * тайрагдахгүй. Тайрах нь хамгийн хуучин эсвэл хамгийн шинэ (өнөөдөр)
 * өдрийг чимээгүй хаяна гэсэн үг. Тэг өдөр ч бүдэг ёроолтой — «өгөгдөл
 * алга» биш «энэ өдөр юу ч болоогүй» гэдгийг хэлнэ.
 */
export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const peak = Math.max(...values, 0)
  return (
    <span aria-hidden="true" className="flex h-full min-w-0 flex-1 items-end gap-[2px]">
      {values.map((value, index) => (
        <span
          key={index}
          className="max-w-1 min-w-px flex-1 rounded-t-[1px]"
          style={{
            height: `${peak > 0 && value > 0 ? Math.max((value / peak) * 100, 10) : 5}%`,
            background: color,
            opacity: value > 0 ? 1 : 0.3,
          }}
        />
      ))}
    </span>
  )
}

/**
 * Үзүүлэлтийн тор — `StatCard` -уудыг багтаана.
 *
 * Хоёр хөрш картын хүрээ зэрэгцвэл 2px зузаан давхар зураас үүсдэг тул
 * зай нь тэднийг тусгаарлана — `gap` бол хамгийн цэвэр тусгаарлагч.
 */
export function StatRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>{children}</div>
}

/* ── Төлөв ─────────────────────────────────────────────────────────────── */

export type Tone = 'neutral' | 'good' | 'warn' | 'danger' | 'info'

/**
 * Төлөвийн шошго — тунгалаг өнгөт дэвсгэр, өнгөт үсэг.
 *
 *   neutral → саарал   · энгийн мэдээлэл, идэвхгүй
 *   info    → цэнхэр   · явцад буй
 *   good    → ногоон   · баталгаажсан, дууссан
 *   warn    → шар      · анхаарал шаардсан
 *   danger  → улаан    · цуцлагдсан, боломжгүй
 *
 * Өнгө дангаараа мэдээлэл дамжуулж БОЛОХГҮЙ (WCAG 1.4.1) — утга нь шошгын
 * ТЕКСТЭД ямагт бий; өнгө нь түүнийг уншихаас өмнө хэлнэ.
 */
const badgeTones: Record<Tone, string> = {
  neutral: 'tag-mute',
  info: 'tag-info',
  good: 'tag-good',
  warn: 'tag-warn',
  danger: 'tag-danger',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`tag ${badgeTones[tone]}`}>{children}</span>
}

/**
 * Мэдэгдэл — зүүн ирмэгийн зузаан зураас, тунгалаг дэвсгэр, өнгөт дүрс.
 * Гурвуулаа нэг өнгөөр нэг чиглэлд заана; текст нь харин ҮРГЭЛЖ тод —
 * мэдэгдлийн гол нь өнгө биш, юу болсон тухай өгүүлбэр.
 *
 * `role`: `status` нь эелдэг — дэлгэц уншигч одоогийн уншилтаа дуусгаад
 * хэлнэ. Алдаа тэр болтол хүлээж болохгүй тул `danger` нь `alert`.
 */
const alertTones: Record<Tone, { box: string; icon: NavIcon; ink: string }> = {
  neutral: { box: 'border-line-strong bg-surface', icon: 'info', ink: 'text-muted' },
  info: { box: 'border-primary bg-primary/10', icon: 'info', ink: 'text-primary' },
  good: { box: 'border-good bg-good/10', icon: 'success', ink: 'text-good' },
  warn: { box: 'border-warn bg-warn/10', icon: 'alert', ink: 'text-warn' },
  danger: { box: 'border-danger bg-danger/10', icon: 'alert', ink: 'text-danger' },
}

export function Alert({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  const { box, icon, ink } = alertTones[tone]
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border-l-4 px-4 py-3 text-[0.875rem] text-foreground ${box}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <AdminIcon name={icon} className={`mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 ${ink}`} />
      <span className="min-w-0">{children}</span>
    </div>
  )
}

export function EmptyState({ icon, title, hint }: { icon: NavIcon; title: ReactNode; hint?: ReactNode }) {
  return (
    /* Гадна хүрээгүй. Хоосон төлөв нь ҮРГЭЛЖ картын дотор суудаг (§ `Panel`)
       тул хүрээ нь картын ирмэгтэй давхцаж хоёр давхар хайрцаг үүсгэнэ. */
    <div className="flex flex-col items-center gap-3.5 px-5 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted">
        <AdminIcon name={icon} className="h-[1.375rem] w-[1.375rem]" />
      </span>
      <div>
        <p className="text-[0.9375rem] font-medium">{title}</p>
        {hint && <p className="mt-1 max-w-[42ch] text-[0.875rem] text-muted">{hint}</p>}
      </div>
    </div>
  )
}

/* ── Формын элементүүд ─────────────────────────────────────────────────── */

/* Сайтын `.ctl` — удирдлага дотор 38px, гадаргаас нэг шат цайвар хайрцаг
   болж хэлбэржинэ (§ globals.css `.admin-shell .ctl`). */
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
      <span className="t-label text-foreground-soft">{label}</span>
      {children}
      {hint && <span className="t-meta text-muted">{hint}</span>}
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

/**
 * Формын үйлдлийн мөр — үндсэн үйлдэл баруун талд, тусгаарлах зураастай.
 *
 * `sticky` нь УРТ формд: талбар нь дэлгэцэнд багтахгүй үед хадгалах товч
 * доод ирмэгт наалдаж, ажилтан бөглөж дуусаад доош гүйлгэх шаардлагагүй
 * болно. «Бөглөчихсөн атлаа хадгалах товч хаана байна» гэдэг нь урт
 * формын хамгийн түгээмэл гацаа.
 *
 * Сөрөг зах (`-mx-6`) нь цонхны их биеийн ДОТООД зайг (§ `DialogFrame`
 * `p-6`) буцаан татаж, мөрийг ирмэгээс ирмэг хүртэл дүүргэнэ — эс бөгөөс
 * хажуугийн 24px зайгаар доорх агуулга гүйж харагдана. Тиймээс энэ нь
 * ЦОНХНЫ дотор л зөв: самбар доторх формд асуухгүй.
 */
export function FormActions({
  children,
  sticky = false,
}: {
  children: ReactNode
  sticky?: boolean
}) {
  return (
    <div
      className={`mt-2 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5 ${
        sticky
          ? 'sticky bottom-0 z-10 -mx-6 -mb-6 bg-surface/95 px-6 pt-4 pb-6 backdrop-blur-sm'
          : ''
      }`}
    >
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
      /* Сайтын `.chip` — удирдлагад жижиг хүрээтэй товч болж, сонгогдсон нь
         цэнхэр дүүрнэ (§ globals.css `.admin-shell .chip`). */
      className={`chip ${active ? 'chip-on' : ''}`}
    >
      {children}
    </Link>
  )
}

/* ── Хайлт ба хуудаслалт ───────────────────────────────────────────────── */

/**
 * Хайлтын мөр — JavaScript-гүй GET форм.
 *
 * Хайлт нь хаяганд үлддэг (`?q=…`) тул хуудсыг хуваалцах, сэргээх, буцах
 * товч бүгд ажиллана. Хайсан үгээ талбарт нь эргүүлж тавина — юу хайснаа
 * мартах нь хамгийн олон давтагддаг эвгүй мөч.
 */
export function SearchBox({
  placeholder,
  defaultValue,
  hidden = {},
}: {
  placeholder: string
  defaultValue?: string
  /** Хайхад ХАДГАЛАГДАХ бусад шүүлт (төлөв, ангилал гэх мэт). */
  hidden?: Record<string, string | undefined>
}) {
  return (
    <form className="flex items-end gap-3">
      {Object.entries(hidden).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      <label className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="t-label text-foreground-soft">Хайх</span>
        <Input name="q" defaultValue={defaultValue} placeholder={placeholder} />
      </label>
      <Button type="submit">
        <AdminIcon name="search" className="h-4 w-4 shrink-0" />
        Хайх
      </Button>
      {defaultValue ? (
        <ButtonLink href="?" variant="ghost">
          Цэвэрлэх
        </ButtonLink>
      ) : null}
    </form>
  )
}

/**
 * Хуудаслалт.
 *
 * Жагсаалтууд 100-200 мөрөөр таслагдаж, түүнээс цааш ХҮРЭХ АРГАГҮЙ байв —
 * 300 дахь захиалга оршин байсаар атал харагдахгүй. Одоо хязгаар нь
 * хуудасны хэмжээ болж, цаашлах зам гарлаа.
 *
 * Нийт тоог харуулна: «41–60 / 312». Хуудасны дугаар ганцаараа хаана
 * байгааг хэлдэггүй.
 */
export function Pager({
  page,
  pageSize,
  total,
  href,
}: {
  page: number
  pageSize: number
  total: number
  /** Хуудасны дугаараас хаяг угсарна — бусад шүүлт хадгалагдана. */
  href: (page: number) => string
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav className="flex items-center justify-between gap-4 border-t border-line pt-4">
      <span className="t-meta text-muted tnum">
        {from}–{to} / {total}
      </span>

      <span className="flex items-center gap-2">
        {page > 1 ? (
          <ButtonLink href={href(page - 1)} size="sm">
            ← Өмнөх
          </ButtonLink>
        ) : null}
        <span className="t-meta text-faint tnum">
          {page} / {pages}
        </span>
        {page < pages ? (
          <ButtonLink href={href(page + 1)} size="sm">
            Дараах →
          </ButtonLink>
        ) : null}
      </span>
    </nav>
  )
}

/* ── Хүснэгт ───────────────────────────────────────────────────────────── */

/**
 * Мөр дээгүүр гүйлгэхэд тодрох (hover) нь урт мөрийг нүдээр дагахад тусална.
 * Сүүлийн мөрийн доод зураасыг авна — картын хүрээтэй давхацдаг.
 *
 * Тодрох өнгө нь `surface-2` — `surface` БИШ. Хүснэгт нь картын дотор
 * (§ `Panel`) суудаг бөгөөд картын дэвсгэр өөрөө `surface` тул тэр нь
 * харагдахгүй болно.
 */
export function Table({ children, minWidth = 640 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table
        // `admin-table` нь жижиг дэлгэц дээр мөрийг карт болгож задална
        // (§ globals.css «Утасны төрх»). `--tbl-min` нь зөвхөн md-ээс дээш.
        className="admin-table t-small [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-150 [&_tbody_tr:hover]:bg-surface-2 [&_tbody_tr:last-child>td]:border-b-0"
        style={{ '--tbl-min': `${minWidth}px` } as CSSProperties}
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
      /* Толгой мөр нь дэвсгэрээсээ ӨЧҮҮХЭН тод — их биеэс салах хэмжээнд,
         гэхдээ хүснэгтийг хайрцаг болгохооргүй. */
      className={`t-label border-b border-line bg-white/[0.02] px-4 py-3 whitespace-nowrap text-foreground-soft ${
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
      className={`border-b border-line px-4 py-3 align-middle ${
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
