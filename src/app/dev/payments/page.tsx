import { startMockPayment } from './actions'

const mnt = new Intl.NumberFormat('mn-MN')

export default async function DevPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; status?: string }>
}) {
  const { payment, status } = await searchParams
  const provider = process.env.PAYMENT_PROVIDER ?? 'mock'

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Төлбөрийн туршилт</h1>
        <p className="text-sm opacity-60">
          Идэвхтэй provider: <code className="font-mono">{provider}</code>
        </p>
      </header>

      {status && (
        <div
          className={`rounded-2xl p-4 text-sm ${
            status === 'paid'
              ? 'bg-good-soft text-good'
              : 'bg-danger-soft text-danger'
          }`}
        >
          <p className="font-medium">
            {status === 'paid' ? 'Төлбөр амжилттай' : 'Төлбөр амжилтгүй'}
          </p>
          <p className="mt-1 font-mono text-xs break-all opacity-80">{payment}</p>
          <p className="mt-2 text-xs opacity-70">
            Webhook хүлээж авсан эсэхийг терминал дээрх{' '}
            <code className="font-mono">[payments]</code> мөрөөс шалгана уу.
          </p>
        </div>
      )}

      <form action={startMockPayment} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="opacity-60">Дүн (₮)</span>
          <input
            type="number"
            name="amount"
            defaultValue={45000}
            min={1}
            step={1}
            required
            className="rounded-xl border border-line bg-surface-2 px-3 py-2 tabular-nums"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="opacity-60">Юуны төлбөр</span>
          <select
            name="targetType"
            defaultValue="booking"
            className="rounded-xl border border-line bg-surface-2 px-3 py-2"
          >
            <option value="booking">Хичээлийн бүртгэл</option>
            <option value="order">Дэлгүүрийн захиалга</option>
          </select>
        </label>

        <button
          type="submit"
          className="rounded-full bg-button px-4 py-3 font-semibold text-button-ink transition-all hover:brightness-90"
        >
          Нэхэмжлэл үүсгэх
        </button>
      </form>

      <p className="text-xs leading-relaxed opacity-55">
        Жишээ дүн: {mnt.format(45000)}₮ — нэг удаагийн хичээл. Нэхэмжлэл үүсгэхэд
        хуурамч gateway-ийн хуудас руу шилжинэ.
      </p>
    </main>
  )
}
