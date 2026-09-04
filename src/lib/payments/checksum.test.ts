import { describe, expect, it } from 'vitest'
import { sign, verify } from './checksum'

/* ───────────────────────────────────────────────────────────────────────────
   ГАРЫН ҮСЭГ

   `/api/payments/webhook` нь нээлттэй — нэвтрэлт шалгахгүй. Аюулгүй байдал
   нь БҮХЭЛДЭЭ энэ хоёр функц дээр тогтоно. Тиймээс тест нь «ажиллаж байна
   уу» гэдгийг биш, «унах ёстой зүйл унаж байна уу» гэдгийг шалгана.
   ─────────────────────────────────────────────────────────────────────── */

const KEY = 'test-secret-key'
const BODY = '{"transactionId":"tx_1","amount":5000,"status":"paid"}'

describe('sign', () => {
  it('64 тэмдэгт hex өгнө', () => {
    expect(sign(BODY, KEY)).toMatch(/^[0-9a-f]{64}$/)
  })

  it('нэг оролт → нэг гаралт', () => {
    expect(sign(BODY, KEY)).toBe(sign(BODY, KEY))
  })

  it('body-ийн НЭГ тэмдэгт өөрчлөгдөхөд огт өөр гарын үсэг', () => {
    // Дүнг 5000 → 6000 болгож өөрчилсөн халдлага. Гарын үсэг үүнийг барих
    // ёстой — эс бөгөөс төлбөрийн дүнг чөлөөтэй бичиж болно.
    const tampered = BODY.replace('5000', '6000')
    expect(sign(tampered, KEY)).not.toBe(sign(BODY, KEY))
  })

  it('түлхүүр өөр бол гарын үсэг өөр', () => {
    expect(sign(BODY, 'other-key')).not.toBe(sign(BODY, KEY))
  })
})

describe('verify', () => {
  it('зөв гарын үсгийг хүлээж авна', () => {
    expect(verify(BODY, KEY, sign(BODY, KEY))).toBe(true)
  })

  it('том жижиг үсэг, захын зайг үл тоомсорлоно', () => {
    // Provider-ууд hex-ээ томоор бичих нь бий; толгойд зай орох нь бий.
    const signature = sign(BODY, KEY)
    expect(verify(BODY, KEY, signature.toUpperCase())).toBe(true)
    expect(verify(BODY, KEY, `  ${signature}  `)).toBe(true)
  })

  it('өөрчлөгдсөн body-г ТАТГАЛЗАНА', () => {
    const signature = sign(BODY, KEY)
    expect(verify(BODY.replace('5000', '6000'), KEY, signature)).toBe(false)
  })

  it('буруу түлхүүрээр зурсныг ТАТГАЛЗАНА', () => {
    expect(verify(BODY, KEY, sign(BODY, 'attacker-key'))).toBe(false)
  })

  it('гарын үсэггүй хүсэлтийг ТАТГАЛЗАНА', () => {
    // `null` нь `timingSafeEqual` руу орвол шидэх тул эрт таслах ёстой.
    expect(verify(BODY, KEY, null)).toBe(false)
    expect(verify(BODY, KEY, '')).toBe(false)
  })

  it('урт нь зөрсөн гарын үсгийг шидэлгүйгээр ТАТГАЛЗАНА', () => {
    // `timingSafeEqual` нь урт зөрвөл алдаа шиддэг — түүнийг барихгүй бол
    // webhook 500 буцааж, provider дахин дахин илгээнэ.
    expect(() => verify(BODY, KEY, 'abc')).not.toThrow()
    expect(verify(BODY, KEY, 'abc')).toBe(false)
  })

  it('хоосон body дээр ч ажиллана', () => {
    expect(verify('', KEY, sign('', KEY))).toBe(true)
  })
})
