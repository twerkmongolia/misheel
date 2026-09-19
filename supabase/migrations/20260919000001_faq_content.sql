-- Twerk Mongolia — түгээмэл асуултын бодит агуулга
--
-- ЯАГААД УСТГАВ: өмнөх арван хоёр асуулт нь ҮРИЙН (seed) өгөгдөл байсан —
-- студийн бодит дүрэм биш, зөвхөн хуудас хоосон харагдахгүйн тулд тавьсан
-- жишээ текст. Студи өөрийн асуултуудаа бичиж өгсөн тул хуучныг нь
-- нуувал админ хуудсан дээр «аль нь үнэн бэ» гэсэн эргэлзээ үлдэнэ, харин
-- идэвхтэй үлдээвэл нийтийн сайт дээр хоёр өөр эх сурвалж зэрэг ярина.
--
-- Хариулт доторх МӨР ТАСЛАЛТ нь утгатай: `faq/page.tsx` нь хариултыг
-- `whitespace-pre-line` -ээр харуулдаг тул жагсаалт бичсэн хэлбэрээрээ гарна.
-- Мөрийн эцэст хоосон зай үлдээж болохгүй — SQL дотор үл үзэгдэх ч
-- хуудсан дээр тэгшилгээг эвддэг.

delete from faq_items;

insert into faq_items (id, question_mn, question_en, answer_mn, answer_en, sort_order, is_active)
values
('faaaaaaa-0001-4000-8000-000000000001',
 'Анх удаа Twerk сурч байгаа бол болох уу?',
 'Can I join if this is my first time doing Twerk?',
 'Тийм. Анхан шатны ангид өмнө нь бүжиглэж байгаагүй хүн ч хамрагдах боломжтой. Суурь хөдөлгөөнөөс эхлээд алхам бүрийг ойлгомжтой, дараалалтайгаар сурна.',
 'Yes. The beginner class is open to people who have never danced before. You start from the basic movements and learn every step in a clear order.',
 1, true),

('faaaaaaa-0001-4000-8000-000000000002',
 'Хичээлд яаж хувцаслаж ирэх вэ?',
 'What should I wear to class?',
 'Twerk анги

• Өгзөгний хөдөлгөөн чөлөөтэй харагдах шорт, сул шорт эсвэл сул өмд
• Биед эвтэйхэн цамц, топ эсвэл өөрт тохиромжтой хувцас
• Өвдгөвч
• Зааланд өмсөх цэвэр, солих пүүз (ул нь зураас гаргадаггүй байх)

Heels Twerk анги

• Өгзөгний хөдөлгөөн чөлөөтэй харагдах шорт, сул шорт эсвэл сул өмд
• Биед эвтэйхэн цамц, топ эсвэл өөрт тохиромжтой хувцас
• Өвдгөвч
• Өөрт тохирох өндөртэй, зориулалтын өсгийт (ул нь зураас гаргадаггүй, шовх үзүүргүй байх)

Нэмэлт торкио зэрэг өөрт тохирсон гоёл, аксессуар хэрэглэж болно.

Хамгийн гол нь өөртөө тухтай, өөрийгөө итгэлтэй, эмэгтэйлэг мэдрүүлэх хувцсаа сонгоорой. 🤭',
 'Twerk class

• Shorts, loose shorts or loose trousers that let the hip movement show
• A T-shirt, top or anything else you feel good moving in
• Knee pads
• Clean indoor trainers you change into (non-marking soles)

Heels Twerk class

• Shorts, loose shorts or loose trousers that let the hip movement show
• A T-shirt, top or anything else you feel good moving in
• Knee pads
• Dance heels at a height that suits you (non-marking soles, no stiletto tips)

You are welcome to add accessories that suit you, a torquio for example.

Above all, choose the outfit that makes you feel comfortable, confident and feminine. 🤭',
 2, true),

('faaaaaaa-0001-4000-8000-000000000003',
 'Twerk болон Heels Twerk хоёрын ялгаа юу вэ?',
 'What is the difference between Twerk and Heels Twerk?',
 'Twerk

Үндсэн twerk хөдөлгөөн, техник, хэмнэл болон choreography-д төвлөрнө. Илүү эрч хүчтэй, хөдөлгөөн ихтэй хичээл.

Heels Twerk

Twerk-ийн суурь хөдөлгөөнөөс гадна өсгийт дээр зөв зогсох, алхах, биеийн шугам, эмэгтэйлэг хөдөлгөөн болон choreography-д төвлөрнө.

Товчхондоо:

Twerk — Техник + Хэмнэл + Эрч хүч
Heels Twerk — Twerk + Heels + Feminine movement',
 'Twerk

Focuses on the core twerk movements, technique, rhythm and choreography. The higher-energy class, with more movement.

Heels Twerk

On top of the twerk basics it focuses on standing and walking properly in heels, body lines, feminine movement and choreography.

In short:

Twerk — technique + rhythm + energy
Heels Twerk — twerk + heels + feminine movement',
 3, true),

('faaaaaaa-0001-4000-8000-000000000004',
 'Хичээл хэдэн минут үргэлжилдэг вэ?',
 'How long is a class?',
 'Нэг хичээл 90 минут үргэлжилнэ.',
 'A class runs for 90 minutes.',
 4, true),

('faaaaaaa-0001-4000-8000-000000000005',
 'Хичээлийн дараа дасгал, сунгалт хийх үү?',
 'Is there conditioning and stretching after class?',
 'Тийм. Хичээл бүрийн дараа булчинг ажиллуулах нэмэлт дасгал болон сунгалтыг тогтмол хийдэг.

Үүнд:

• Өгзөг, гуяны дасгал
• Хэвлий болон core-ийн дасгал
• Резинтэй дасгал
• Сунгалт

зэрэг багтана.',
 'Yes. Every class ends with extra conditioning work and stretching.

That includes:

• Glute and thigh work
• Abs and core work
• Resistance band work
• Stretching',
 5, true),

('faaaaaaa-0001-4000-8000-000000000006',
 'Нэг ангид хэдэн хүн байдаг вэ?',
 'How many people are in one class?',
 'Анги болон хөтөлбөрөөсөө хамаарч 10–20 суралцагчтай байна.',
 'Between 10 and 20 students, depending on the class and the programme.',
 6, true),

('faaaaaaa-0001-4000-8000-000000000007',
 'Twerk хийснээр өгзөг томрох уу?',
 'Will twerking make my glutes bigger?',
 'Twerk-ийн хөдөлгөөнөөр өгзөг, ташаа, гуя болон core хэсгийн булчингууд идэвхтэй ажилладаг. Тогтмол хичээллэснээр булчин чангарч, өгзөгний хэлбэр илүү тодорч, өргөгдсөн харагдана.

Үр дүн нь хүн бүрийн биеийн онцлог, хооллолт болон хичээллэх давтамжаас хамаарч өөр байна.

Зарим суралцагчид анхны хэдэн долоо хоногоосоо хөдөлгөөний болон биеийн өөрчлөлтөө мэдэрч эхэлдэг.',
 'Twerk movement works the glutes, hips, thighs and core. With regular practice the muscles tighten and the shape of the glutes becomes more defined and lifted.

Results differ from person to person, depending on your body, your diet and how often you train.

Some students start to feel a change in their movement and their body within the first few weeks.',
 7, true),

('faaaaaaa-0001-4000-8000-000000000008',
 'Twerk хичээллээд жин хасах уу?',
 'Will twerk classes help me lose weight?',
 'Twerk нь идэвхтэй хөдөлгөөн шаарддаг бүжгийн төрөл тул тогтмол хичээллэх нь энерги зарцуулалт болон биеийн идэвхийг нэмэгдүүлэхэд хувь нэмэр оруулна.

Жин болон биеийн хэмжээнд гарах өөрчлөлт нь хүн бүрийн биеийн онцлог, хооллолт, өдөр тутмын хөдөлгөөн болон хичээллэх давтамжаас хамаарч өөр байна.

Twerk-ийн гол зорилго нь зөвхөн турах биш, биеэ чангалах, галбиржуулах, хөдөлгөөний хяналт болон өөртөө итгэх итгэлийг хөгжүүлэх юм.

Зарим тохиолдолд жин төдийлөн өөрчлөгдөхгүй ч биеийн хэлбэр, булчингийн чангарсан байдалд өөрчлөлт мэдрэгдэж болно.',
 'Twerk is an active dance form, so training regularly adds to the energy you burn and to how much you move overall.

Changes in weight and body measurements differ from person to person, depending on your body, your diet, your daily activity and how often you train.

The point of twerk is not only to get slimmer: it is to tone and shape the body, to build movement control and to grow your confidence.

Sometimes the number on the scale barely moves while the shape of the body and the tone of the muscles clearly change.',
 8, true),

('faaaaaaa-0001-4000-8000-000000000009',
 'Ангид бүртгүүлсний дараа юу болох вэ?',
 'What happens after I sign up for a class?',
 'Бүртгэл болон төлбөрөө баталгаажуулсны дараа таны бүртгэлтэй холбоо барих сувгаар хичээлийн дэлгэрэнгүй мэдээллийг хүргэнэ.

Мөн тухайн ангийн Instagram group-д нэмэгдэж, хичээлийн хуваарь, зарлал болон бусад мэдээллийг хүлээн авна.',
 'Once your registration and payment are confirmed, we send the class details to the contact channel you registered with.

You are also added to the Instagram group for that class, where the schedule, announcements and everything else are posted.',
 9, true)
on conflict (id) do update set
  question_mn = excluded.question_mn,
  question_en = excluded.question_en,
  answer_mn   = excluded.answer_mn,
  answer_en   = excluded.answer_en,
  sort_order  = excluded.sort_order,
  is_active   = excluded.is_active;
