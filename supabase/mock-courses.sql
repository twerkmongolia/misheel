-- ═══════════════════════════════════════════════════════════════════════════
-- Twerk Mongolia — АНГИ, КУРСЫН ӨГӨГДӨЛ
--
-- `seed.sql` дотор энэ хоёр курс аль хэдийн бичигдсэн байсан ч ажиллаж
-- чадаагүй: тэнд багшийг `22222222-…` гэсэн id-гаар заасан бол өгөгдлийн
-- санд `mock-data.sql` -ын оруулсан `dddddddd-…` багш нар байсан. Нэг л
-- хүн, хоёр өөр id — гадаад түлхүүр таарахгүй тул insert унана.
--
-- Энд ЯГ ТЭР агуулга, зөвхөн БАЙГАА багш нар руу холбогдсон хувилбар.
--
-- Курсын id нь `55555555-` — `mock-data-cleanup.sql` нь зөвхөн `dddddddd-`
-- мөрийг устгадаг тул эдгээр нь цэвэрлэгээнээс ҮЛДЭНЭ. Багш нь уствал
-- `on delete set null` тул курс өөрөө амьд үлдэж, зөвхөн багшгүй болно.
--
-- Ажиллуулах: Supabase Dashboard → SQL Editor → буулгаад Run.
-- ═══════════════════════════════════════════════════════════════════════════

insert into courses (
  id, slug, mode, name_mn, name_en, summary_mn, summary_en, desc_mn, desc_en,
  level, instructor_id, location_id, cover_url, price, lesson_count,
  starts_on, ends_on, schedule_mn, schedule_en, capacity, sort_order
) values
-- ── Танхим ────────────────────────────────────────────────────────────────
-- Эхлэх огноо нь ажиллуулсан өдрөөс хамаарна: өнгөрсөн огноотой курс нь
-- «эхэлсэн» гэж тооцогдож элсэлт хаагддаг (§ lib/data.ts `buildCourse`).
('55555555-5555-4555-8555-111111111111', 'twerk-4-week', 'studio',
 'Шинэчлэгчдийн 4 долоо хоног', 'Beginner 4-Week Course',
 'Огт бүжиглэж үзээгүй хүнд зориулсан бүтэн хөтөлбөр — эхний алхмаас бүтэн бүжиг хүртэл.',
 'A full programme for people who have never danced — from the first step to a whole routine.',
 'Дөрвөн долоо хоног, найман хичээл. Эхний долоо хоногт биеэ хэрхэн авч явах, хэмнэлээ олох; хоёрдугаарт үндсэн хөдөлгөөнүүд; гуравдугаарт тэдгээрийг холбох; дөрөвдүгээрт бүтэн бүжиг сурч, хүсвэл бичлэг хийнэ.

Хувцас, гутлын тухай: хөнгөн, суналттай өмд, хөл нүцгэн эсвэл гутлаа авчирч болно. Бусад бүхнийг заалнаас олно.',
 'Four weeks, eight classes. Week one is about carrying yourself and finding the rhythm; week two the core movements; week three linking them; week four a full routine, with an optional filmed take.

On clothes: light stretchy trousers, barefoot or bring your trainers. Everything else is at the studio.',
 'beginner',
 'dddddddd-0002-4000-8000-000000000001',   -- Сараа
 '11111111-1111-4111-8111-111111111111',   -- Үндсэн заал
 '/media/mock/class-twerk-basics.jpg', 240000, 8,
 (current_date + 14), (current_date + 42),
 'Мягмар, Пүрэв · 19:00–20:15', 'Tuesdays and Thursdays · 19:00–20:15',
 12, 1),

-- ── Онлайн ────────────────────────────────────────────────────────────────
-- Суудал `null` = хязгааргүй. Байршил ч `null` — гэрээсээ үзнэ.
('55555555-5555-4555-8555-222222222222', 'online-basics', 'online',
 'Онлайн үндэс', 'Online Basics',
 'Гэрээсээ, өөрийн хэмнэлээр. Хичээлүүд Telegram бүлэгт байршина.',
 'From home, at your own pace. The lessons live in a Telegram group.',
 'Арван хичээл, тус бүр 15-25 минут. Бүгд бичлэгээр тул хэдэн ч удаа буцааж үзнэ.

Элссэн даруйдаа Telegram бүлгийн урилга нээгдэнэ. Тэндээс хичээл бүрийн бичлэг, дасгалын жагсаалт, асуулт хариултын хэсэг олдоно. Багш долоо хоног бүр асуултад хариулна.',
 'Ten lessons, 15-25 minutes each. Everything is recorded, so you can go back as often as you like.

The Telegram invite unlocks the moment you enrol. Inside you will find every lesson, the drill list and a questions thread. The instructor answers questions weekly.',
 'beginner',
 'dddddddd-0002-4000-8000-000000000002',   -- Номин
 null,
 '/media/mock/class-choreography.jpg', 120000, 10,
 null, null,
 'Өөрийн хэмнэлээр', 'At your own pace',
 null, 2)
on conflict (id) do nothing;

-- Telegram холбоос ТУСДАА хүснэгтэд — төлбөрөө төлсөн элсэгч л уншина.
insert into course_access (course_id, telegram_url, note_mn, note_en) values
('55555555-5555-4555-8555-222222222222', 'https://t.me/+twerkmongolia_demo',
 'Бүлэгт орсны дараа өөрийгөө танилцуулаарай — багш танд эхлэх хичээлээ хэлж өгнө.',
 'Introduce yourself once you are in — the instructor will point you to the right first lesson.')
on conflict (course_id) do nothing;

-- ── Шалгах ────────────────────────────────────────────────────────────────
select mode as "төрөл", name_mn as "нэр", price as "үнэ", capacity as "суудал",
       starts_on as "эхлэх"
from courses order by sort_order;
