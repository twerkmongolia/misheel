'use client'

import { useSyncExternalStore } from 'react'

/** Энэ цэгээс доош гүйлгэж байж л самбарууд нуугдана. */
const HIDE_AFTER = 96

/** Хуруу чичрэхэд анивчихаас сэргийлэх хамгийн бага зөрүү (px). */
const DELTA = 8

export type ChromeScroll = {
  /** Доош гүйлгэж байна — дээд болон доод самбарыг замаас зайлуулна. */
  hidden: boolean
  /** Хуудас дээдээсээ хөдөлсөн — навбарт дэвсгэр, хүрээ өгнө. */
  lifted: boolean
}

const AT_REST: ChromeScroll = { hidden: false, lifted: false }

/**
 * Дээд навбар, доод таб самбар хоёр НЭГ л эх сурвалжаас уншина.
 *
 * Тус бүрдээ сонсогч тавьбал ижил үйл явдлыг хоёр удаа боловсруулаад зогсохгүй,
 * хоёр state бие биенээсээ хагас хүрээгээр хоцорч, самбарууд өөр өөр хугацаанд
 * хөдөлж эхэлнэ. Модулийн түвшний нэг дэлгүүр үүнээс сэргийлнэ.
 */
let state: ChromeScroll = AT_REST
let lastY = 0
let frame = 0
const listeners = new Set<() => void>()

function publish(hidden: boolean, lifted: boolean) {
  if (hidden === state.hidden && lifted === state.lifted) return
  state = { hidden, lifted }
  for (const listener of listeners) listener()
}

function measure() {
  frame = 0
  const y = Math.max(0, window.scrollY)
  const lifted = y > 8
  const diff = y - lastY

  // Зөрүү бага бол `lastY` -г хэвээр үлдээж хуримтлуулна.
  if (Math.abs(diff) < DELTA) {
    publish(state.hidden, lifted)
    return
  }

  lastY = y
  publish(diff > 0 && y > HIDE_AFTER, lifted)
}

function onScroll() {
  if (frame) return
  frame = requestAnimationFrame(measure)
}

function subscribe(onChange: () => void) {
  if (listeners.size === 0) {
    lastY = Math.max(0, window.scrollY)
    state = { hidden: false, lifted: lastY > 8 }
    window.addEventListener('scroll', onScroll, { passive: true })
  }

  listeners.add(onChange)

  return () => {
    listeners.delete(onChange)
    if (listeners.size > 0) return

    window.removeEventListener('scroll', onScroll)
    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
    state = AT_REST
  }
}

export function useChromeScroll(): ChromeScroll {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => AT_REST,
  )
}
