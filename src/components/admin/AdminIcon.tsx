export type NavIcon =
  | 'dashboard'
  | 'calendar'
  | 'check'
  | 'layers'
  | 'users'
  | 'tag'
  | 'receipt'
  | 'person'
  | 'file'
  | 'mail'
  | 'history'
  | 'chevron'
  | 'sun'
  | 'moon'
  | 'percent'
  | 'wallet'
  | 'clock'
  | 'plus'
  | 'search'
  | 'trash'
  | 'image'
  | 'info'
  | 'alert'
  | 'success'
  | 'inbox'
  | 'menu'
  | 'globe'
  | 'close'

const paths: Record<NavIcon, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
    </>
  ),
  check: (
    <>
      <path d="M9 4.5H7.5A2.5 2.5 0 0 0 5 7v12a2.5 2.5 0 0 0 2.5 2.5h9A2.5 2.5 0 0 0 19 19V7a2.5 2.5 0 0 0-2.5-2.5H15" />
      <rect x="9" y="2.5" width="6" height="4" rx="1.3" />
      <path d="m9 13.5 2.2 2.2 4-4" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.2 21 8l-9 4.8L3 8l9-4.8Z" />
      <path d="m3.6 12.4 8.4 4.5 8.4-4.5M3.6 16.6l8.4 4.5 8.4-4.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9.5" cy="8.5" r="3.4" />
      <path d="M3.5 20a6 6 0 0 1 12 0" />
      <path d="M16.2 5.6a3.4 3.4 0 0 1 0 5.8M17.5 20a6 6 0 0 0-2.2-4.6" />
    </>
  ),
  tag: (
    <>
      <path d="M11.6 3.5H20v8.4l-8.5 8.5a2 2 0 0 1-2.8 0l-5.6-5.6a2 2 0 0 1 0-2.8l8.5-8.5Z" />
      <circle cx="16.2" cy="7.8" r="1.3" />
    </>
  ),
  receipt: (
    <>
      <path d="M5.5 3.5h13v17l-2.2-1.5-2.2 1.5-2.1-1.5-2.2 1.5-2.1-1.5-2.2 1.5v-17Z" />
      <path d="M9 8.5h6M9 12.5h6" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M5 20.2a7 7 0 0 1 14 0" />
    </>
  ),
  file: (
    <>
      <path d="M13.5 3.5H7A2.5 2.5 0 0 0 4.5 6v12A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5V9.5l-6-6Z" />
      <path d="M13.5 3.5v6h6M8.5 13.5h7M8.5 16.5h4" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.6 7 7.2 5.2a2 2 0 0 0 2.4 0L20.4 7" />
    </>
  ),
  history: (
    <>
      <path d="M3.8 12a8.2 8.2 0 1 0 2.5-5.9L3.5 8.8" />
      <path d="M3.5 4v5h5" />
      <path d="M12 7.8V12l3 1.8" />
    </>
  ),
  chevron: <path d="M14.5 6 8.5 12l6 6" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 13.4A8.2 8.2 0 0 1 10.6 4a8.2 8.2 0 1 0 9.4 9.4Z" />,
  percent: (
    <>
      <circle cx="7.8" cy="7.8" r="2.8" />
      <circle cx="16.2" cy="16.2" r="2.8" />
      <path d="M18.5 5.5 5.5 18.5" />
    </>
  ),
  wallet: (
    <>
      <path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h11.5A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5v-9Z" />
      <path d="M3.5 9.5h13a2 2 0 0 1 0 4h-13" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2V12l3.2 1.9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.4 15.4 4.1 4.1" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
      <path d="M6.5 6.5 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-12.5" />
      <path d="M10.3 10v6.5M13.7 10v6.5" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="9.6" r="1.6" />
      <path d="m4.4 17.2 4.4-4.3a2 2 0 0 1 2.7-.1l5.2 4.4M14.6 14l1.6-1.5a2 2 0 0 1 2.7 0l1.6 1.4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11.2v5" />
      <path d="M12 7.9h.01" />
    </>
  ),
  alert: (
    <>
      <path d="M10.6 4.2 2.9 17.5a1.6 1.6 0 0 0 1.4 2.4h15.4a1.6 1.6 0 0 0 1.4-2.4L13.4 4.2a1.6 1.6 0 0 0-2.8 0Z" />
      <path d="M12 9.4v4.2" />
      <path d="M12 16.8h.01" />
    </>
  ),
  success: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m8.4 12.2 2.4 2.4 4.8-4.9" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.5 13.5h4l1.4 2.4h6.2l1.4-2.4h4" />
      <path d="M6.1 4.5h11.8a2 2 0 0 1 1.9 1.4l1.7 6.2v5.4a2.5 2.5 0 0 1-2.5 2.5H5a2.5 2.5 0 0 1-2.5-2.5v-5.4l1.7-6.2a2 2 0 0 1 1.9-1.4Z" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M3.6 9.5h16.8M3.6 14.5h16.8" />
      <path d="M12 3.4c-4.2 4.6-4.2 12.6 0 17.2 4.2-4.6 4.2-12.6 0-17.2Z" />
    </>
  ),
}

/** Удирдлагын дүрсний багц — зурвас, толгой мөр, картууд хуваалцана. */
export function AdminIcon({ name, className = '' }: { name: NavIcon; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
