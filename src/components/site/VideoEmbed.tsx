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
    <figure className="flex flex-col gap-3">
      <div className="card relative aspect-video overflow-hidden p-0">
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
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            <Image
              src={thumbnail}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={() => setThumbnail(youtubeThumbnail(id, 'hq'))}
              className="card-media object-cover"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />

            {/* Тоглуулах товч — цагаан дугуй, дотор нь гурвалжин */}
            <span className="absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-button transition-transform duration-200 group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-button-ink" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>

      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{title}</span>

        <a
          href={youtubeWatchUrl(id)}
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs text-muted transition-colors hover:text-foreground"
        >
          {watchLabel} ↗
        </a>
      </figcaption>
    </figure>
  )
}
