-- Twerk Mongolia — ХИЧЭЭЛИЙН КАТАЛОГ
--
-- ── Асуудал ───────────────────────────────────────────────────────────────
-- Амьд суурин дээр `class_types` хүснэгт ХООСОН байв: «Хичээлүүд» хуудас,
-- хуваарийн шүүлтүүр, нүүр хуудасны бүлэг гурвуулаа юу ч харуулахгүй. Код
-- нь эрүүл — зүгээр л харуулах зүйл байхгүй байлаа.
--
-- ── Яагаад ХУВААРЬ энд БАЙХГҮЙ вэ ─────────────────────────────────────────
-- Энэ файл нь хичээлийн ТӨРӨЛ (каталог) л үүсгэнэ. Тодорхой цаг (Мягмар
-- 19:00, багш нь хэн, хэдэн суудал) нь ЭНД байх ёсгүй: тэр бол студийн
-- бодит ажлын хуваарь бөгөөд түүнийг таамаглаж бичих нь хуурамч цаг
-- үүсгэнэ — хэрэглэгч тэр цагт БҮРТГҮҮЛЖ мэднэ. Хуваарийг админаас
-- (Хуваарь → Шинэ цаг) оруулна.
--
-- ── Үнэ, үргэлжлэх хугацаа ────────────────────────────────────────────────
-- Доорх утгууд нь ЭХЛЭЛ цэг (төслийн үрийн өгөгдлөөс). Админаас чөлөөтэй
-- засна — `on conflict` нь зөвхөн ШИНЭ мөр нэмэхээс сэргийлнэ, байгаа
-- мөрийг дардаггүй.
--
-- ⚠️ Дахин ажиллуулахад аюулгүй.

insert into class_types (
  slug, name_mn, name_en, desc_mn, desc_en,
  level, duration_min, cover_url, base_price, sort_order
) values

('twerk-basics', 'Twerk үндэс', 'Twerk Basics',
 'Огт туршлагагүй хүнд зориулсан. Үндсэн хөдөлгөөн, хэмнэл, биеийн байрлалыг эхнээс нь заана.',
 'For complete beginners. Core movements, rhythm and body positioning from scratch.',
 'beginner', 60, '/media/studio-4.svg', 35000, 1),

('choreography', 'Choreography', 'Choreography',
 'Дуу бүрд бүтэн бүжиг сурна. Үндсэн хөдөлгөөнүүдийг мэддэг хүнд тохиромжтой.',
 'Learn a full routine to a track. Suited to those who know the basics.',
 'intermediate', 75, '/media/studio-5.svg', 40000, 2),

('advanced-flow', 'Ахисан түвшин', 'Advanced Flow',
 'Хурд, техник, тайз дээрх илэрхийлэл. Дор хаяж 6 сар бүжиглэсэн байх шаардлагатай.',
 'Speed, technique and stage presence. Requires at least six months of practice.',
 'advanced', 90, '/media/studio-6.svg', 45000, 3),

('stretch', 'Stretch & Conditioning', 'Stretch & Conditioning',
 'Уян хатан байдал, тэсвэр. Бүжгийн хичээлийг нөхөх дасгалууд.',
 'Flexibility and stamina. A complement to the dance classes.',
 'beginner', 60, '/media/studio-1.svg', 30000, 4)

on conflict (slug) do nothing;
