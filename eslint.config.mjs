import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    /* `NEXT_DIST_DIR` -ээр үүсгэсэн БҮХ гаралт: `.next-check` (check:build),
       `.next-alt` (dev:2). Эдгээр нь Turbopack-ийн үүсгэсэн код тул шалгах
       утгагүй — зөвхөн олон мянган худал алдаа өгнө. Нэг нэгээр нь бичихгүй,
       ХЭВЭЭР нь хаана: дараагийн `NEXT_DIST_DIR` өөрөө хамрагдана. */
    ".next-*/**",
  ]),
]);

export default eslintConfig;
