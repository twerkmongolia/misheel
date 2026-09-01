import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Empty } from '@/components/ui'
import { Media } from '@/components/site/media'
import { getDictionary, loc, isLocale } from '@/lib/i18n'
import { getInstructors } from '@/lib/data'
import { PageBanner } from '@/components/site/PageBanner'

export default async function InstructorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const instructors = await getInstructors()

  return (
    <>
      <PageBanner
        page="instructors"
        title={t.nav.instructors}
      />

      <div className="shell flex flex-col gap-12 pt-10 sm:pt-12">
      {instructors.length === 0 ? (
        <Empty>{t.common.empty}</Empty>
      ) : (
        // Хөрөг эгнээ хавтгай биш ШАТААР бууна — гурван ижил хайрцаг
        // зэрэгцвэл каталог болно; шатлал нь эгнээнд хэмнэл өгнө.
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3" data-stagger>
          {instructors.map((instructor, index) => (
            <Link
              key={instructor.id}
              href={`/${locale}/instructors/${instructor.slug}`}
              data-rv
              className={`group relative block ${index % 3 === 1 ? 'lg:mt-14' : ''} ${
                index % 3 === 2 ? 'lg:mt-28' : ''
              }`}
            >
              <div className="media sheen aspect-[4/5] border border-line transition-colors duration-300 group-hover:border-line-strong">
                <Media
                  src={instructor.photo_url}
                  alt={instructor.name}
                  seed={index}
                  ratio="absolute inset-0"
                  className="rounded-none"
                  sizes="(max-width: 640px) 50vw, 33vw"
                  overlay
                />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="font-display text-[1.25rem] leading-tight font-medium tracking-[-0.02em]">
                    {instructor.name}
                  </p>
                  {/* Намтар нь hover дээр ГАРЧ ирнэ — тайван үедээ зураг
                      дангаараа ярина. */}
                  <p className="t-meta mt-1.5 line-clamp-2 max-h-0 overflow-hidden text-white/70 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:max-h-16 group-hover:opacity-100">
                    {loc(instructor, 'bio', locale)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </>
  )
}
