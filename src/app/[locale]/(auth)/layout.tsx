export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell pt-16 sm:pt-24">
      {/* Форм нь хуудсын голд БИШ, эхний хагаст сууна. Голлуулсан хайрцаг нь
          «энэ бол саад» гэсэн мэдрэмж өгдөг; дээшээ түлхэх нь маягтыг
          агуулгын нэг хэсэг болгоно. */}
      <div className="relative mx-auto w-full max-w-[26rem]">
        {/* Хуудсын ард нэг гэрэл — форм хар хоосон зайд дүүжлэгдсэн мэт харагдахгүй */}
        <div className="glow -top-20 left-1/2 h-64 w-80 -translate-x-1/2 opacity-70" />
        <div className="flex flex-col gap-7">{children}</div>
      </div>
    </div>
  )
}
