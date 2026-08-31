'use client'

import Image from 'next/image'
import { useState } from 'react'
import { youtubeEmbedUrl, youtubeThumbnail, youtubeWatchUrl } from '@/lib/youtube'

/**
 * YouTube бичлэг — «нүүр» хэлбэрээр.
 *
 * Хуудас ачаалахад YouTube-ийн плейер ЗАГВАРЫГ ачаалахгүй: эхлээд зөвхөн
 * зураг харагдана. Энэ нь хоёр зүйлийг өгнө — хуудас хамаагүй хурдан
 * нээгдэнэ, мөн хэрэглэгч дарах хүртэл YouTube cookie тавихгүй.
 *
 * Тоглуулах товч нь дугуй — энэ систем дэх цөөхөн дугуй хэлбэрийн нэг.
 * Учир нь дугуй энд ЧИМЭГ биш УТГА: тоглуулах гэсэн бүх нийтийн тэмдэг.
 */
export function VideoEmbed({
  id,
  title,
  playLabel,
  watchLabel,
}: {
  id: string
  title?: string
  playLabel: string
  watchLabel: string
}) {
  const [playing, setPlaying] = useState(false)
  // maxres байхгүй бичлэгт hq рүү шилжинэ
  const [thumbnail, setThumbnail] = useState(() => youtubeThumbnail(id, 'max'))

  return (
    <figure className="group flex flex-col gap-4">
      <div className="media aspect-video border border-line transition-colors duration-300 group-hover:border-line-strong">
        {playing ? (
          <iframe
            src={youtubeEmbedUrl(id, true)}
            title={title ?? playLabel}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={title ?? playLabel}
            className="absolute inset-0 h-full w-full cursor-pointer"
          >
            <Image
              src={thumbnail}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 55vw"
              onError={() => setThumbnail(youtubeThumbnail(id, 'hq'))}
              className="card-media object-cover"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-black/25 transition-opacity duration-500 group-hover:opacity-60"
            />

            {/* Гурван давхар хариу: гадна цагираг тэлж, дотоод дугуй өргөгдөж,
                сум өөрөө өчүүхэн урагшилна. */}
            <span className="absolute top-1/2 left-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-button transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 group-active:scale-95">
                <svg
                  viewBox="0 0 24 24"
                  className="ml-0.5 h-5 w-5 fill-button-ink"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>

      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="t-small font-medium">{title}</span>

        <a
          href={youtubeWatchUrl(id)}
          target="_blank"
          rel="noreferrer noopener"
          className="lnk t-label shrink-0 text-muted hover:text-foreground"
        >
          {watchLabel}
        </a>
      </figcaption>
    </figure>
  )
}
