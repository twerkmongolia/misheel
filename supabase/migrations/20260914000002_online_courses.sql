-- Twerk Mongolia — ОНЛАЙН АНГИ: жинхэнэ хоёр бүлэг
--
-- ── Юу өөрчлөгдөв ─────────────────────────────────────────────────────────
-- Онлайн анги нь ЗӨВХӨН ХОЁР бөгөөд хоёулаа Telegram дээр аль хэдийн
-- амьд ажиллаж байгаа бүлэг:
--
--   · Twerk онлайн сургалт
--   · Heels + Twerk онлайн сургалт
--
-- Урьд нь энд «Онлайн үндэс» гэсэн ГАНЦ ЖИШЭЭ анги байв — холбоос нь
-- `t.me/+twerkmongolia_demo`, өөрөөр хэлбэл хаашаа ч хүрэхгүй. Төлбөр
-- төлсөн хүн үүнийг дараад хоосон хуудас харах байсан.
--
-- ── Яагаад хуучин мөрийг ДАХИН АШИГЛАВ ────────────────────────────────────
-- Жишээ мөр дээр элсэлт ороогүй (`enrolled_count = 0`) тул алдах зүйл алга.
-- Шинэ мөр үүсгээд хуучныг үлдээвэл админы жагсаалтад хуурамч анги мөнхөд
-- хоцорно — хэн нэг нь хожим түүн рүү хуваарь холбоно.
--
-- ── Яагаад УСТГАХГҮЙ вэ ───────────────────────────────────────────────────
-- Гараар нэмэгдсэн өөр онлайн анги байвал устгахгүй, ИДЭВХГҮЙ болгоно.
-- Устгал нь `course_enrollments`, `orders` дээрх түүхийг тасалдаг бол
-- идэвхгүй төлөв нь зөвхөн каталогоос нуух ба буцаах боломжтой.
--
-- ⚠️ Дахин ажиллуулахад аюулгүй.

-- ── 1. Жишээ мөрийг эхний жинхэнэ анги болгоно ────────────────────────────
update courses set slug = 'twerk-online'
 where slug = 'online-basics'
   and not exists (select 1 from courses c where c.slug = 'twerk-online');

-- ── 2. Хоёр анги ──────────────────────────────────────────────────────────
-- `lesson_count` нь ЗОРИУД 0: хичээлийн яг тоог мэдэхгүй. Тоо нь 0 үед
-- карт, дэлгэрэнгүй хоёулаа тэр мөрийг огт гаргахгүй (§ courses/page.tsx)
-- — таамагласан тоо бичихээс юу ч бичихгүй нь дээр. Админаас бөглөнө.
insert into courses (
  id, slug, mode, name_mn, name_en, summary_mn, summary_en, desc_mn, desc_en,
  level, price, lesson_count, schedule_mn, schedule_en, sort_order
) values

('55555555-5555-4555-8555-222222222222', 'twerk-online', 'online',
 'Twerk онлайн сургалт', 'Twerk Online Course',
 'Гэрээсээ, өөрийн хэмнэлээр. Бүх хичээл Telegram бүлэгт бичлэгээр байршина.',
 'From home, at your own pace. Every lesson is recorded in the Telegram group.',
 'Twerk онлайн сургалтын албан ёсны бүлэг. Хичээлийн бүх бичлэг тэнд байрлах бөгөөд зөвхөн элссэн гишүүдэд нээлттэй.

Элссэн даруйдаа Telegram бүлгийн урилга нээгдэнэ. Хичээлээ хэдэн ч удаа, хүссэн цагтаа буцааж үзэж болно.',
 'The official group for the Twerk online course. Every lesson is recorded there, and the group is open to enrolled members only.

The Telegram invite unlocks the moment you enrol. You can rewatch any lesson as often as you like, whenever you like.',
 'beginner', 169000, 0,
 'Өөрийн хэмнэлээр', 'At your own pace', 1),

('55555555-5555-4555-8555-333333333333', 'heels-twerk-online', 'online',
 'Heels + Twerk онлайн сургалт', 'Heels + Twerk Online Course',
 'Өсгийтэй гутлаар — үндсэн хичээл, choreography, техник.',
 'In heels — fundamentals, choreography and technique.',
 'Heels + Twerk онлайн сургалтын албан ёсны бүлэг. Үндсэн хичээлүүд, choreography болон техникийн хичээлүүд бичлэгээр байршина.

Элссэн даруйдаа Telegram бүлгийн урилга нээгдэнэ. Бүлэг нь зөвхөн гишүүдэд нээлттэй.',
 'The official group for the Heels + Twerk online course. Fundamentals, choreography and technique, all recorded.

The Telegram invite unlocks the moment you enrol. The group is open to members only.',
 'beginner', 169000, 0,
 'Өөрийн хэмнэлээр', 'At your own pace', 2)

on conflict (slug) do update set
  mode         = excluded.mode,
  name_mn      = excluded.name_mn,
  name_en      = excluded.name_en,
  summary_mn   = excluded.summary_mn,
  summary_en   = excluded.summary_en,
  desc_mn      = excluded.desc_mn,
  desc_en      = excluded.desc_en,
  price        = excluded.price,
  schedule_mn  = excluded.schedule_mn,
  schedule_en  = excluded.schedule_en,
  sort_order   = excluded.sort_order;
  -- `cover_url`, `lesson_count`, `instructor_id`, `is_active` нь ЗОРИУД
  -- байхгүй: дөрвүүлээ админаас удирдагддаг тул энэ файлыг дахин
  -- ажиллуулах нь ажилтны оруулсан зураг, хичээлийн тоо, багш, эсвэл
  -- «түр хаасан» шийдвэрийг арилгаж болохгүй.

-- ── 3. Өөр онлайн анги үлдээхгүй ──────────────────────────────────────────
update courses set is_active = false
 where mode = 'online'
   and slug not in ('twerk-online', 'heels-twerk-online');

-- ── 4. Telegram холбоос ───────────────────────────────────────────────────
-- Тусдаа хүснэгтэд: `course_access` -ийн RLS нь ИДЭВХТЭЙ элсэлттэй хүнд л
-- уншуулна (§ 20260903000001_courses.sql). Холбоосыг `courses` дээр тавибал
-- каталог нийтэд нээлттэй тул хэн ч уншина.
-- Ангийг ДУГААРААР биш ХАЯГААР (slug) нь олно: дээрх `on conflict (slug)`
-- нь хаягаар мөргөлддөг тул анги аль хэдийн өөр дугаартай байсан бол
-- энд бичсэн дугаар түүнтэй таарахгүй байж мэднэ. Хаяг нь цорын ганц утга.
insert into course_access (course_id, telegram_url, note_mn, note_en)
select c.id, v.telegram_url, v.note_mn, v.note_en
from (values

('twerk-online', 'https://t.me/+UbxwAsH7YL4yMDFl',
 'Бүлэгт орсны дараа өөрийгөө танилцуулаарай. Хичээлийн бүх бичлэг тэнд байна.',
 'Introduce yourself once you are in. Every recorded lesson lives in the group.'),

('heels-twerk-online', 'https://t.me/+AzE_d_ly0L01NmNl',
 'Бүлэгт орсны дараа өөрийгөө танилцуулаарай. Үндсэн хичээл, choreography тэнд байна.',
 'Introduce yourself once you are in. Fundamentals and choreography live in the group.')

) as v (slug, telegram_url, note_mn, note_en)
join courses c on c.slug = v.slug
on conflict (course_id) do update set
  telegram_url = excluded.telegram_url,
  note_mn      = excluded.note_mn,
  note_en      = excluded.note_en,
  updated_at   = now();
