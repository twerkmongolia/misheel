# Төлбөрийн модуль

Bonum Gateway-ийн adapter. **`bonum` ба `mock` хоёулаа бэлэн** —
`PAYMENT_PROVIDER` сонгоно.

## Файлууд

| Файл | Үүрэг |
|---|---|
| `types.ts` | `PaymentProvider` интерфейс — provider бүрийн гэрээ |
| `checksum.ts` | HMAC-SHA256 гарын үсэг (`x-checksum-v2`), `timingSafeEqual` харьцуулалт |
| `bonum.ts` | Жинхэнэ Bonum Gateway — auth токен, нэхэмжлэл, webhook шалгалт |
| `mock.ts` | Хуурамч provider + Bonum-ийн серверийг дуурайсан webhook илгээгч |
| `store.ts` | Санах ойн нэхэмжлэлийн жагсаалт — **зөвхөн хөгжүүлэлтэд** |
| `handle-result.ts` | Төлбөрийн үр дүнг боловсруулах цорын ганц цэг (DB энд холбогдоно) |
| `index.ts` | `getPaymentProvider()` — env-ээр provider сонгоно |

## Орчны хувьсагчид

```
NEXT_PUBLIC_SITE_URL=https://www.twerkmongolia.com

PAYMENT_PROVIDER=bonum                  # эсвэл mock
PAYMENT_API_BASE=https://apis.bonum.mn  # тест: https://testapi.bonum.mn
PAYMENT_TERMINAL_ID=…                   # X-TERMINAL-ID
PAYMENT_APP_SECRET=…                    # Authorization: AppSecret <…>
PAYMENT_CHECKSUM_KEY=…                  # MERCHANT_CHECKSUM_KEY
```

⚠️ `PAYMENT_APP_SECRET`, `PAYMENT_CHECKSUM_KEY` хоёр нь НУУЦ. Зөвхөн
`.env.local` (git-д ордоггүй) болон Vercel-ийн Environment Variables дотор.

## Турших

`PAYMENT_PROVIDER=mock` болгоод жинхэнэ урсгалаар:

```
сагс → худалдан авах → /mock-pay/<invoiceId> → «Амжилттай төлөх»
     → /api/payments/webhook → терминалд `[payments] … → PAID`
```

`/mock-pay` нь production-д ХААЛТТАЙ (`notFound`) — тэр хуудасны товч нь
мөнгө хөдөлгөхгүйгээр захиалгыг төлөгдсөн болгодог.

Урьд нь `/dev/payments` гэсэн тусдаа тест хуудас байсан. Хасагдав: жинхэнэ
checkout нэхэмжлэл үүсгэдэг болсон тул зэрэгцээ зам барих шаардлагагүй,
харин production-д нээлттэй үлдвэл хэн ч merchant данс дээр нэхэмжлэл
үүсгэж чадах байлаа.

## Bonum холболт

`bonum.ts` нь хоёр дуудлага хийнэ:

1. `GET /bonum-gateway/ecommerce/auth/create`
   — `Authorization: AppSecret …` + `X-TERMINAL-ID` → `accessToken` (1800 сек).
   Санах ойд БА `payment_tokens` хүснэгтэд кэшлэгдэж, хугацаа дуусахаас
   60 сек өмнө шинэчлэгдэнэ (§ ⚠️ Токен нэг л ширхэг).
2. `POST /bonum-gateway/ecommerce/invoices`
   — `Authorization: Bearer …` → `invoiceId`, `followUpLink`.

Webhook нь эсрэг зүгт: Bonum манай `/api/payments/webhook` руу
`x-checksum-v2` гарын үсэгтэй POST илгээнэ.

### ⚠️ Webhook-ийн хаяг нэхэмжлэлд ОРНО — `callback` талбараар

Баримт бичиг `callback` -ийг «URL to redirect after payment» гэж нэрлэсэн нь
төөрөгдүүлдэг. Bonum яг ТЭР хаяг руу webhook-оо POST илгээдэг.

Энэ бол урьд нь **төлбөр огт бүртгэгддэггүй байсны шалтгаан**. Тэр үед
`callback` руу захиалгын хуудас (`/mn/order/…`) явдаг байсан тул merchant
порталын «WebHook Жагсаалт» иймэрхүү харагдана:

| Илгээсэн | Статус | URL | Контент |
|---|---|---|---|
| 2026-09-28 13:37 | **503** | `https://www.twerkmongolia.com/mn/order/…` | `{"type":"PAYMENT",…}` |
| 2026-09-28 12:37 | **503** | `…` | `…` |
| 2026-09-28 12:09 | **503** | `…` | `…` |

API биш HTML хуудас хариулсан учир 503. Төлбөр амжилттай болсон ч
`settle_payment` хэзээ ч дуудагдаагүй — захиалга `pending`, курс нээгдэхгүй.

Одоо `callback` руу webhook-ийн хаяг явна:

```
https://www.twerkmongolia.com/api/payments/webhook?order=<order_no>&locale=<mn|en>
```

Query нь гарын үсэгт огт нөлөөлөхгүй (HMAC нь зөвхөн биеийг тооцно). Харин
Bonum хэрэглэгчийг ч мөн энэ хаяг руу буцаавал `GET` нь захиалгын хуудас руу
303-аар шилжүүлнэ (§ `api/payments/webhook`) — тиймээс `callback` хоёр
утгын аль нь ч байсан зөв ажиллана.

**Шалгах газар:** merchant портал → «WebHook Жагсаалт». Статус 200 байх ёстой.

### ⚠️ `expiresIn` нь ЗААВАЛ

Баримт бичигт сонголт мэт бичсэн ч бодит сервер нь түүнгүй биеийг задалж
чаддаггүй:

```
500 · JSON parse error: Missing required creator property expiresIn (index 4)
```

Энэ алдаа нь `createInvoice` дотор баригдаад `startPayment` нь `null`
буцаадаг тул хэрэглэгч ямар ч мэдэгдэлгүйгээр захиалгын хуудсан дээр үлддэг
байв — төлбөрийн товч огт ажиллахгүй байсны ЖИНХЭНЭ шалтгаан. Одоо
`INVOICE_TTL_SECONDS` (30 мин) нь анхдагчаар үргэлж явна.

### ⚠️ Токен нэг л ширхэг

Bonum шинэ токен дахин дахин гуйхыг зөвшөөрдөггүй:

```
429 · ERROR_USE_EXISTING_TOKEN · «Use previous token»
```

Санах ойн кэш нь нэг серверт хангалттай ч Vercel дээр хүсэлт бүр өөр
instance дээр буух боломжтой: instance бүр хоосон кэштэй босч, токен гуйж,
429 иднэ. Тиймээс токеныг `payment_tokens` хүснэгтэд хадгална — бүх instance
нэг мөрийг хуваалцана. Тэр хүснэгтэд RLS асаалттай, policy огт байхгүй:
зөвхөн service-role хүрнэ.

## Бүтэн урсгал

```
бараа → checkout?variant=…&qty=… → place_order (захиалга, нөөц, payments мөр)
     → createInvoice → followUpLink руу шилжинэ
     → төлнө → Bonum webhook → verifyWebhook (x-checksum-v2)
     → settle_payment (нэг транзакц: идэмпотент, дүн тулгах, төлөв)
     → захиалга PAID → курсын элсэлт trigger-ээр идэвхжинэ
```

Төлбөр тасалдвал захиалга `pending_payment` дээр үлдэнэ: захиалгын хуудасны
«Онлайнаар төлөх» товч ШИНЭ нэхэмжлэл үүсгэнэ (§ actions/orders.ts
`payOrder`) — `payments` мөр ижил хэвээр тул хоцорсон webhook ч зөв мөр рүү
таарна.
