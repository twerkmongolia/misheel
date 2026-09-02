import {
  Arrow,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from '@/components/ui'
import type { Channel, ChannelIcon } from '@/lib/contact'

/**
 * Шууд холбогдох сувгуудын жагсаалт.
 *
 * Холбоо барих ХУУДАС ба ЦОНХ хоёулаа үүнийг зурна — нэг л зохиомж, нэг л
 * газар. Хоёуланд нь тус тусад нь бичвэл нэг нь өөрчлөгдөхөд нөгөө нь
 * хоцордог.
 *
 * ── Яагаад энд ӨНГӨ байгаа юм бэ ──────────────────────────────────────────
 * Сайт бүхэлдээ монохром — өнгө нь эрэмбэ үүсгэдэггүй, зөвхөн шугам, хэмжээ,
 * гэрэлтүүлэлт үүсгэдэг. Энэ хэсэг ЦОРЫН ГАНЦ үл хамаарах зүйл бөгөөд
 * шалтгаан нь чимэглэл биш ТАНИЛТ:
 *
 *   Instagram-ыг ягаан-улбар шар шилжилтээр, Facebook-ыг цэнхрээр, Gmail-ыг
 *   улаанаар хүн ҮГ УНШИХААС ӨМНӨ таньдаг. Эдгээр өнгө нь бидний сонголт
 *   биш, тэдгээр брэндийн ӨМЧ — саарал болгох нь танилтыг зориудаар удаашруулж
 *   байгаа хэрэг.
 *
 * Тиймээс өнгө нь ЗӨВХӨН дүрсний тэмдэг дээр амьдарна. Текст, хүрээ, дэвсгэр
 * бүгд монохром хэвээр — өнгө нь hover дээр л хүрээ рүү тархана. Ингэснээр
 * систем эвдрэхгүй, харин нэг тодорхой газар зориуд нээгдэнэ.
 */

const icons: Record<ChannelIcon, (props: { className?: string }) => React.JSX.Element> = {
  phone: PhoneIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  mail: MailIcon,
  map: MapPinIcon,
}

/**
 * Брэндийн өнгө. Утас, хаяг хоёрт брэнд байхгүй тул тэдгээр нь системийнхээ
 * өнгөтэй үлдэнэ — эс бөгөөс дөрвөн өнгө зэрэгцэж, аль нь ЖИНХЭНЭ брэнд,
 * аль нь бидний зохиосон нь ялгагдахаа болино.
 */
const tones: Record<ChannelIcon, string> = {
  phone: '#16A34A',
  instagram: '#D6249F',
  facebook: '#1877F2',
  mail: '#EA4335',
  map: '#3F3F46',
}

export function ChannelList({ channels }: { channels: Channel[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {channels.map((channel) => {
        const Icon = icons[channel.icon]

        return (
          <a
            key={channel.label}
            href={channel.href}
            data-icon={channel.icon}
            style={{ '--tone': tones[channel.icon] } as React.CSSProperties}
            {...(channel.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
            className="channel"
          >
            <span aria-hidden className="channel-badge">
              <Icon />
            </span>

            <span className="min-w-0 flex-1">
              <span className="t-label block text-muted">{channel.label}</span>
              {/* `truncate` — урт и-мэйл нарийн дэлгэцэд мөр эвдэхгүй */}
              <span className="t-h3 mt-0.5 block truncate">{channel.value}</span>
            </span>

            <Arrow className="channel-arrow text-faint" />
          </a>
        )
      })}
    </div>
  )
}
