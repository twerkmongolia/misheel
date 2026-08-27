# Төлбөрийн модуль

Bonum Gateway-ийн интерфейстэй нийцүүлсэн adapter. Одоогоор **mock** provider ажиллаж байна.

## Файлууд

| Файл | Үүрэг |
|---|---|
| `types.ts` | `PaymentProvider` интерфейс — provider бүрийн гэрээ |
| `checksum.ts` | HMAC-SHA256 гарын үсэг (`x-checksum-v2`), `timingSafeEqual` харьцуулалт |
| `mock.ts` | Хуурамч provider + Bonum-ийн серверийг дуурайсан webhook илгээгч |
| `store.ts` | Санах ойн нэхэмжлэлийн жагсаалт — **зөвхөн хөгжүүлэлтэд** |
| `handle-result.ts` | Төлбөрийн үр дүнг боловсруулах цорын ганц цэг (DB энд холбогдоно) |
| `index.ts` | `getPaymentProvider()` — env-ээр provider сонгоно |

## Орчны хувьсагчид

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PAYMENT_PROVIDER=mock
PAYMENT_CHECKSUM_KEY=twerk-dev-checksum-key   # Bonum-д MERCHANT_CHECKSUM_KEY
PAYMENT_TERMINAL_ID=MOCK_TERMINAL             # Bonum-д X-TERMINAL-ID
```

## Турших

```bash
npm run dev
# → http://localhost:3000/dev/payments
```

Нэхэмжлэл үүсгэх → хуурамч gateway хуудас → «Амжилттай төлөх» → webhook
`/api/payments/webhook` руу очиж терминалд `[payments] … → PAID` гэж бичигдэнэ.

## Bonum руу шилжих

`mock.ts` -ийг хөндөхгүйгээр `bonum.ts` нэмнэ:

1. `createInvoice` → `POST {API_BASE_URL}/bonum-gateway/ecommerce/invoices`
   (өмнө нь `GET /bonum-gateway/ecommerce/auth/create` -ээр accessToken авч кэшлэнэ)
2. `verifyWebhook` → `checksum.ts` -ийн `verify()` -ийг `MERCHANT_CHECKSUM_KEY` -ээр дуудна
3. `index.ts` -ийн switch-д `case 'bonum'` нэмнэ
4. `PAYMENT_PROVIDER=bonum`

Webhook-ийн дугтуй, гарын үсгийн арга, `transactionId` -ийн утга нь mock дээр аль
хэдийн Bonum-тай ижил тул дуудагч код өөрчлөгдөхгүй.

Тест орчин: `https://testapi.bonum.mn` · Бодит: `https://apis.bonum.mn`
