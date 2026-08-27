export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-md py-10">
      {/* Хуудсын ард нэг гэрэл — форм хар хоосон зайд дүүжлэгдсэн мэт харагдахгүй */}
      <div className="glow -top-16 left-1/2 h-64 w-72 -translate-x-1/2 opacity-60" />
      <div className="card flex flex-col gap-6 p-8">{children}</div>
    </div>
  )
}
