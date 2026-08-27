import { notFound } from 'next/navigation'
import { getInvoice } from '@/lib/payments/store'
import { completeMockPayment } from './actions'

const mnt = new Intl.NumberFormat('mn-MN')

export default async function MockPayPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>
}) {
  const { invoiceId } = await params
  const invoice = getInvoice(invoiceId)

  if (!invoice) notFound()

  const settled = invoice.status === 'paid' || invoice.status === 'failed'

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
      <header className="flex items-center justify-between border-b border-line pb-4">
        <span className="text-sm font-semibold tracking-wide">MOCK GATEWAY</span>
        <span className="rounded-full bg-warn-soft px-3 py-1 text-xs font-medium text-warn">
          Хуурамч төлбөр
        </span>
      </header>

      <section className="flex flex-col gap-1">
        <p className="text-sm opacity-60">{invoice.description}</p>
        <p className="text-4xl font-semibold tabular-nums">
          {mnt.format(invoice.amount)}
          <span className="ml-1 text-2xl opacity-60">₮</span>
        </p>
      </section>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-2xl border border-line p-4 font-mono text-xs">
        <dt className="opacity-60">invoiceId</dt>
        <dd className="truncate">{invoice.invoiceId}</dd>
        <dt className="opacity-60">transactionId</dt>
        <dd className="truncate">{invoice.paymentId}</dd>
        <dt className="opacity-60">зорилт</dt>
        <dd className="truncate">
          {invoice.targetType}/{invoice.targetId}
        </dd>
        <dt className="opacity-60">төлөв</dt>
        <dd>{invoice.status}</dd>
      </dl>

      {invoice.status === 'expired' ? (
        <p className="rounded-2xl bg-danger-soft p-4 text-sm text-danger">
          Энэ нэхэмжлэлийн хугацаа дууссан байна. Шинэ нэхэмжлэл үүсгэнэ үү.
        </p>
      ) : settled ? (
        <p className="rounded-2xl bg-surface-2 p-4 text-sm">
          Энэ нэхэмжлэл аль хэдийн боловсруулагдсан:{' '}
          <strong>{invoice.status === 'paid' ? 'төлөгдсөн' : 'амжилтгүй'}</strong>.
        </p>
      ) : (
        <form className="flex flex-col gap-3">
          <input type="hidden" name="invoiceId" value={invoice.invoiceId} />

          <label className="flex flex-col gap-1 text-sm">
            <span className="opacity-60">Төлбөрийн суваг</span>
            <select
              name="vendor"
              defaultValue="QPAY"
              className="rounded-xl border border-line bg-surface-2 px-3 py-2"
            >
              <option value="QPAY">QPAY</option>
              <option value="E_COMMERCE">E_COMMERCE (карт)</option>
              <option value="WE_CHAT">WE_CHAT</option>
              <option value="SONO_SHOP">SONO_SHOP</option>
            </select>
          </label>

          <button
            type="submit"
            name="outcome"
            value="SUCCESS"
            formAction={completeMockPayment}
            className="rounded-full bg-button px-4 py-3 font-semibold text-button-ink transition-all hover:brightness-90"
          >
            Амжилттай төлөх
          </button>
          <button
            type="submit"
            name="outcome"
            value="FAILED"
            formAction={completeMockPayment}
            className="rounded-full border border-line-strong px-4 py-3 font-medium transition-colors hover:bg-surface-2"
          >
            Амжилтгүй болгох
          </button>
        </form>
      )}

      <p className="text-xs leading-relaxed opacity-55">
        Товч дарахад Bonum-ийн серверийг дуурайж{' '}
        <code className="font-mono">/api/payments/webhook</code> руу{' '}
        <code className="font-mono">x-checksum-v2</code> гарын үсэгтэй POST илгээгээд,
        дараа нь <code className="font-mono">returnUrl</code> рүү буцаана.
      </p>
    </main>
  )
}
