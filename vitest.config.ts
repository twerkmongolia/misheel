import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Тестийн тохиргоо.
 *
 * ── Хамрах хүрээ ───────────────────────────────────────────────────────
 * `src/lib/**` доторх ЦЭВЭР функцууд. Хуудас, Server Action, өгөгдлийн
 * сангийн давхарга энд ОРОХГҮЙ — тэдгээр нь Next-ийн ажиллах орчин
 * (`cookies()`, `server-only`, RSC) шаарддаг тул тестийн доторх орчин нь
 * бодит байдлаас улам холдох ба «ногоон боловч утгагүй» тест үлдэнэ.
 *
 * Эхлээд МӨНГӨ, ЦАГ хоёрыг барина: буруу тооцоолсон дүн, эсвэл нэг цагийн
 * бүсээр гулссан хуваарь нь чимээгүй, харин хамгийн үнэтэй алдаа.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
