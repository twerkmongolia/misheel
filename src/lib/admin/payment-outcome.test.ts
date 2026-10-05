import { describe, expect, it } from 'vitest'
import { PAYMENT_WINDOW_MS, failedBefore, pendingOutcome, visibleToAdmin } from './payment-outcome'

const now = Date.parse('2026-10-05T12:00:00Z')
const ago = (ms: number) => new Date(now - ms).toISOString()

describe('pendingOutcome', () => {
  it('нэхэмжлэхийн хагас цагийн дотор — явцад', () => {
    expect(pendingOutcome(ago(29 * 60_000), now)).toBe('in_progress')
  })

  it('яг 30 минут өнгөрсөн — амжилтгүй (нэхэмжлэх дууссан)', () => {
    expect(pendingOutcome(ago(PAYMENT_WINDOW_MS), now)).toBe('failed')
  })

  it('хэдэн өдрийн өмнөх — амжилтгүй, «хүлээж байна» биш', () => {
    expect(pendingOutcome(ago(3 * 86_400_000), now)).toBe('failed')
  })
})

describe('visibleToAdmin', () => {
  it('явцад буй төлбөрийг нууна', () => {
    expect(visibleToAdmin('pending_payment', ago(5 * 60_000), now)).toBe(false)
  })

  it('амжилтгүй болсныг харуулна', () => {
    expect(visibleToAdmin('pending_payment', ago(40 * 60_000), now)).toBe(true)
  })

  it('бусад төлвийг насаас үл хамааран харуулна', () => {
    expect(visibleToAdmin('paid', ago(60_000), now)).toBe(true)
    expect(visibleToAdmin('cancelled', ago(60_000), now)).toBe(true)
  })
})

describe('failedBefore', () => {
  it('асуулгын хил нь яг 30 минутын өмнө', () => {
    expect(failedBefore(now)).toBe('2026-10-05T11:30:00.000Z')
  })
})
