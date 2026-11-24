/* Luma Skin Lab — профессиональная диагностика кожи и подбор ухода из каталога.
   Тип кожи определяется по признакам (а не по самооценке), учитываются чувствительность,
   обезвоженность, задачи, возраст, солнце, удобное число шагов и особые случаи (беременность,
   отдушки, лечение у дерматолога). Использует данные каталога P и функции сайта add/cart/toast. */
(function (W, D) {
  'use strict';
  var root = D.getElementById('skinQuiz');
  if (!root) return;

  /* ---------- тексты ---------- */
  var TX = {
    ru: {
      badge: 'Luma Skin Lab', title: 'Профессиональная диагностика кожи', meta: '10 вопросов · 2 минуты · бесплатно',
      f1: 'Тип кожи по признакам', f2: 'Чувствительность и барьер', f3: 'Ваши задачи', f4: 'Уход утром и вечером',
      introP: 'Тест построен по принципам косметологической консультации: тип кожи мы определяем по тому, как она ведёт себя в течение дня, а не по самооценке.',
      start: 'Начать диагностику', last: 'Мой последний результат', step: 'Вопрос {n} из {m}', back: '← Назад', next: 'Далее →', pick3: 'Можно выбрать до 3 вариантов', pickMany: 'Можно выбрать несколько вариантов', finish: 'Показать результат →',
      q1: 'Как ощущается кожа через 2–3 часа после умывания, если ничего не наносить?', h1: 'Это главный признак типа кожи — вспомните обычный день.',
      q1a: 'Стянута, иногда шелушится', q1b: 'Комфортно, без блеска', q1c: 'Блестит только лоб, нос и подбородок', q1d: 'Блестит всё лицо',
      q2: 'Какие у вас поры?', h2: 'Посмотрите в зеркало при дневном свете.',
      q2a: 'Почти незаметны', q2b: 'Видны только на носу', q2c: 'Расширены в Т-зоне', q2d: 'Расширены по всему лицу',
      q3: 'Что происходит с кожей к середине дня?', h3: 'Без матирующих средств и пудры.',
      q3a: 'Тусклая, хочется нанести крем', q3b: 'Выглядит так же, как утром', q3c: 'Появляется блеск в Т-зоне', q3d: 'Сильный блеск, макияж «плывёт»',
      q4: 'Бывает, что кожа блестит, но при этом ощущается стянутость?', h4: 'Это признак обезвоженности — коже не хватает воды, а не жира.',
      q4a: 'Да, часто', q4b: 'Иногда', q4c: 'Нет',
      q5: 'Как кожа реагирует на новые средства, солнце, холод или ветер?', h5: '',
      q5a: 'Краснеет', q5b: 'Жжёт или щиплет', q5c: 'Чешется', q5d: 'Шелушится', q5e: 'Появляются высыпания', q5f: 'Никак не реагирует',
      q6: 'Что хочется улучшить в первую очередь?', h6: '',
      c_blemish: 'Высыпания и чёрные точки', c_pores: 'Расширенные поры', c_spots: 'Пятна и следы постакне', c_glow: 'Тусклость, неровный тон', c_hydrate: 'Сухость и обезвоженность', c_antiage: 'Морщины и упругость', c_redness: 'Покраснения', c_eye: 'Тёмные круги и отёки',
      q7: 'Ваш возраст', h7: 'Возраст влияет на выбор активных компонентов и текстур.',
      q8: 'Сколько времени вы бываете на солнце?', h8: 'В Узбекистане высокий УФ-индекс почти круглый год.',
      q8a: 'В основном в помещении', q8b: '1–2 часа в день', q8c: 'Много на улице, за рулём, в поездках',
      q9: 'Сколько шагов ухода вам удобно?', h9: '',
      q9a: 'Минимум — 3 шага', q9a2: 'Быстро и просто', q9b: 'Базовый — 4–5 шагов', q9b2: 'Оптимально для большинства', q9c: 'Полный ритуал', q9c2: 'Утро и вечер, 6+ шагов',
      q10: 'Есть ли особенности, которые нужно учесть?', h10: 'Мы уберём из подборки неподходящие средства.',
      q10a: 'Беременность или кормление грудью', q10b: 'Аллергия на отдушки и эфирные масла', q10c: 'Лечу кожу у дерматолога', q10d: 'Ничего из этого',
      res: 'Ваш профиль кожи', t_dry: 'Сухая кожа', t_normal: 'Нормальная кожа', t_combo: 'Комбинированная кожа', t_oily: 'Жирная кожа',
      d_dry: 'Сальные железы работают слабо, поэтому коже не хватает липидов, а защитный барьер быстрее теряет влагу. Главное — мягкое очищение, восстановление барьера и питательный крем.',
      d_normal: 'Кожа в балансе: себума и влаги достаточно. Задача ухода — сохранить это состояние: бережное очищение, увлажнение и ежедневная защита от солнца.',
      d_combo: 'В Т-зоне себума больше, на щеках — меньше. Нужен баланс: лёгкое увлажнение без плотных текстур, контроль блеска в Т-зоне и мягкое очищение.',
      d_oily: 'Сальные железы активны: отсюда блеск, расширенные поры и склонность к высыпаниям. Нужны бережное очищение, лёгкие увлажняющие текстуры и компоненты, регулирующие себум. Пересушивать кожу нельзя — она ответит ещё большим блеском.',
      m_oil: 'Жирность', m_sens: 'Чувствительность', m_hyd: 'Увлажнённость', lv0: 'низкая', lv1: 'средняя', lv2: 'высокая',
      dehyd: 'Есть признаки обезвоженности: коже не хватает воды. Это состояние, а не тип кожи, — его исправляют увлажняющие слои (тонер, эссенция) и гиалуроновая кислота.',
      sensNote: 'Кожа чувствительная: вводите новые средства по одному, раз в 3–4 дня. Первые 2 недели обойдитесь без кислот, скрабов и ретинола.',
      needs: 'Что нужно вашей коже', concerns: 'Ваши задачи',
      a_ha: 'Гиалуроновая кислота', a_ha2: 'Притягивает и удерживает воду, убирает стянутость.',
      a_cer: 'Церамиды и масла', a_cer2: 'Восстанавливают защитный барьер, питают сухую кожу.',
      a_cica: 'Центелла и пантенол', a_cica2: 'Успокаивают покраснение и раздражение, ускоряют заживление.',
      a_nia: 'Ниацинамид', a_nia2: 'Регулирует себум, сужает поры, выравнивает тон.',
      a_bha: 'Салициловая кислота (BHA)', a_bha2: 'Очищает поры изнутри, уменьшает чёрные точки. 2–3 раза в неделю.',
      a_vc: 'Витамин C', a_vc2: 'Осветляет пятна и следы постакне, придаёт сияние. Утром, под SPF.',
      a_pep: 'Пептиды и коллаген', a_pep2: 'Поддерживают упругость, смягчают мелкие морщины.',
      a_ret: 'Ретинол', a_ret2: 'Обновляет кожу и уменьшает морщины. Только вечером, 2–3 раза в неделю, с SPF днём.',
      a_spf: 'SPF 50 каждый день', a_spf2: 'Главное средство против пигментации и старения — даже в облачную погоду.',
      am: 'Утро', pm: 'Вечер', routine: 'Ваш уход по шагам', why: 'Почему', empty: 'Подходящего средства пока нет в наличии',
      s_cleanse: 'Очищение', s_toner: 'Тонер', s_serum: 'Сыворотка', s_cream: 'Крем', s_spf: 'Защита SPF', s_eye: 'Уход вокруг глаз',
      total: 'Весь уход', addAll: 'Добавить весь уход в корзину', added: 'Уход добавлен в корзину',
      plan: 'Как начать', p1: 'Дни 1–7: очищение, крем и SPF.', p2: 'Дни 8–14: добавьте тонер.', p3: 'С 15-го дня: сыворотка. Активные компоненты — вечером.', p4: 'Оценивайте результат через 4–6 недель: столько длится цикл обновления кожи.', p5: 'Перед первым применением нанесите средство на сгиб локтя или за ухо и подождите сутки.',
      preg: 'Мы исключили ретинол, кислоты и спикулы. Во время беременности и кормления согласуйте новый уход с врачом.',
      derm: 'Если вы лечите кожу у дерматолога, покажите ему этот уход перед началом.',
      frag: 'Средства с выраженной отдушкой мы опустили ниже в подборке. Проверяйте состав на упаковке.',
      ask: 'Обсудить с консультантом', copied: 'Профиль скопирован — вставьте его в чат', again: '↻ Пройти заново',
      disc: 'Результат теста — ориентир для подбора косметики, а не медицинский диагноз. При выраженном воспалении, зуде или аллергии обратитесь к дерматологу.',
      ages: ['До 20', '20–29', '30–39', '40–49', '50+'], match: 'подходит'
    },
    uz: {
      badge: 'Luma Skin Lab', title: 'Terining professional diagnostikasi', meta: '10 savol · 2 daqiqa · bepul',
      f1: 'Belgilar bo‘yicha teri turi', f2: 'Sezgirlik va himoya to‘sig‘i', f3: 'Sizning maqsadlaringiz', f4: 'Ertalabki va kechki parvarish',
      introP: 'Test kosmetolog maslahati tamoyillari asosida tuzilgan: teri turini o‘zingizning bahoingiz bo‘yicha emas, kun davomida qanday o‘zini tutishi bo‘yicha aniqlaymiz.',
      start: 'Diagnostikani boshlash', last: 'Oxirgi natijam', step: '{n}-savol / {m}', back: '← Orqaga', next: 'Keyingi →', pick3: '3 tagacha variant tanlash mumkin', pickMany: 'Bir nechta variant tanlash mumkin', finish: 'Natijani ko‘rsatish →',
      q1: 'Yuvingandan 2–3 soat o‘tib, hech narsa surtmasangiz, teri qanday seziladi?', h1: 'Bu teri turining asosiy belgisi — oddiy kuningizni eslang.',
      q1a: 'Tortishadi, ba’zan po‘st tashlaydi', q1b: 'Qulay, yaltiramaydi', q1c: 'Faqat peshona, burun va iyak yaltiraydi', q1d: 'Butun yuz yaltiraydi',
      q2: 'G‘ovaklaringiz qanday?', h2: 'Kunduzgi yorug‘likda oynaga qarang.',
      q2a: 'Deyarli ko‘rinmaydi', q2b: 'Faqat burunda ko‘rinadi', q2c: 'T-zonada kengaygan', q2d: 'Butun yuzda kengaygan',
      q3: 'Kun o‘rtasiga kelib teri qanday bo‘ladi?', h3: 'Matlovchi vositalar va upasiz.',
      q3a: 'Xira, krem surtgim keladi', q3b: 'Ertalabgidek ko‘rinadi', q3c: 'T-zonada yaltiraydi', q3d: 'Kuchli yaltiraydi, makiyaj «oqadi»',
      q4: 'Teri yaltirab tursa-da, tortishish hissi bo‘ladimi?', h4: 'Bu suvsizlanish belgisi — terida yog‘ emas, suv yetishmaydi.',
      q4a: 'Ha, tez-tez', q4b: 'Ba’zan', q4c: 'Yo‘q',
      q5: 'Teri yangi vositalar, quyosh, sovuq yoki shamolga qanday javob beradi?', h5: '',
      q5a: 'Qizaradi', q5b: 'Achishadi', q5c: 'Qichishadi', q5d: 'Po‘st tashlaydi', q5e: 'Toshmalar chiqadi', q5f: 'Hech qanday',
      q6: 'Avvalo nimani yaxshilamoqchisiz?', h6: '',
      c_blemish: 'Toshmalar va qora nuqtalar', c_pores: 'Kengaygan g‘ovaklar', c_spots: 'Dog‘lar va akne izlari', c_glow: 'Xiralik, notekis rang', c_hydrate: 'Quruqlik va suvsizlanish', c_antiage: 'Ajinlar va elastiklik', c_redness: 'Qizarishlar', c_eye: 'Ko‘z ostidagi qoralik va shishlar',
      q7: 'Yoshingiz', h7: 'Yosh faol komponentlar va teksturalarni tanlashga ta’sir qiladi.',
      q8: 'Quyoshda qancha vaqt bo‘lasiz?', h8: 'O‘zbekistonda UF-indeks deyarli yil bo‘yi yuqori.',
      q8a: 'Asosan xonada', q8b: 'Kuniga 1–2 soat', q8c: 'Ko‘p vaqt tashqarida, rulda, safarda',
      q9: 'Parvarishning necha bosqichi siz uchun qulay?', h9: '',
      q9a: 'Minimum — 3 bosqich', q9a2: 'Tez va oddiy', q9b: 'Asosiy — 4–5 bosqich', q9b2: 'Ko‘pchilik uchun optimal', q9c: 'To‘liq marosim', q9c2: 'Ertalab va kechqurun, 6+ bosqich',
      q10: 'Hisobga olish kerak bo‘lgan xususiyatlar bormi?', h10: 'Mos kelmaydigan vositalarni tanlovdan chiqaramiz.',
      q10a: 'Homiladorlik yoki emizish', q10b: 'Xushbo‘ylantiruvchi va efir moylariga allergiya', q10c: 'Terini dermatologda davolayapman', q10d: 'Bularning hech biri',
      res: 'Teringiz profili', t_dry: 'Quruq teri', t_normal: 'Normal teri', t_combo: 'Aralash teri', t_oily: 'Yog‘li teri',
      d_dry: 'Yog‘ bezlari sust ishlaydi, shu sababli terida lipidlar yetishmaydi va himoya to‘sig‘i namlikni tez yo‘qotadi. Asosiysi — yumshoq tozalash, to‘siqni tiklash va to‘yimli krem.',
      d_normal: 'Teri muvozanatda: yog‘ va namlik yetarli. Parvarish vazifasi — shu holatni saqlash: ehtiyotkor tozalash, namlantirish va har kuni quyoshdan himoya.',
      d_combo: 'T-zonada yog‘ ko‘proq, yonoqlarda kamroq. Muvozanat kerak: zich bo‘lmagan yengil namlantirish, T-zonada yaltirashni nazorat qilish va yumshoq tozalash.',
      d_oily: 'Yog‘ bezlari faol: yaltirash, kengaygan g‘ovaklar va toshmalarga moyillik shundan. Ehtiyotkor tozalash, yengil namlantiruvchi teksturalar va yog‘ ajralishini tartibga soluvchi komponentlar kerak. Terini quritib bo‘lmaydi — u yanada ko‘proq yaltiraydi.',
      m_oil: 'Yog‘lilik', m_sens: 'Sezgirlik', m_hyd: 'Namlik', lv0: 'past', lv1: 'o‘rta', lv2: 'yuqori',
      dehyd: 'Suvsizlanish belgilari bor: terida suv yetishmaydi. Bu tur emas, holat — uni namlantiruvchi qatlamlar (toner, essensiya) va gialuron kislotasi tuzatadi.',
      sensNote: 'Teri sezgir: yangi vositalarni bittadan, 3–4 kunda bir marta kiriting. Dastlabki 2 haftada kislotalar, skrab va retinolsiz ishlang.',
      needs: 'Teringizga nima kerak', concerns: 'Maqsadlaringiz',
      a_ha: 'Gialuron kislotasi', a_ha2: 'Suvni tortib, ushlab turadi, tortishishni yo‘qotadi.',
      a_cer: 'Seramidlar va moylar', a_cer2: 'Himoya to‘sig‘ini tiklaydi, quruq terini oziqlantiradi.',
      a_cica: 'Sentella va pantenol', a_cica2: 'Qizarish va ta’sirlanishni tinchlantiradi, bitishni tezlashtiradi.',
      a_nia: 'Niatsinamid', a_nia2: 'Yog‘ ajralishini tartibga soladi, g‘ovaklarni toraytiradi, rangni tekislaydi.',
      a_bha: 'Salitsil kislotasi (BHA)', a_bha2: 'G‘ovaklarni ichidan tozalaydi, qora nuqtalarni kamaytiradi. Haftasiga 2–3 marta.',
      a_vc: 'C vitamini', a_vc2: 'Dog‘lar va akne izlarini oqartiradi, porloqlik beradi. Ertalab, SPF ostida.',
      a_pep: 'Peptidlar va kollagen', a_pep2: 'Elastiklikni qo‘llab-quvvatlaydi, mayda ajinlarni yumshatadi.',
      a_ret: 'Retinol', a_ret2: 'Terini yangilaydi va ajinlarni kamaytiradi. Faqat kechqurun, haftasiga 2–3 marta, kunduzi SPF bilan.',
      a_spf: 'Har kuni SPF 50', a_spf2: 'Pigmentatsiya va qarishga qarshi asosiy vosita — bulutli kunda ham.',
      am: 'Ertalab', pm: 'Kechqurun', routine: 'Bosqichma-bosqich parvarishingiz', why: 'Nega', empty: 'Mos vosita hozircha mavjud emas',
      s_cleanse: 'Tozalash', s_toner: 'Toner', s_serum: 'Zardob', s_cream: 'Krem', s_spf: 'SPF himoya', s_eye: 'Ko‘z atrofi parvarishi',
      total: 'Butun parvarish', addAll: 'Butun parvarishni savatga qo‘shish', added: 'Parvarish savatga qo‘shildi',
      plan: 'Qanday boshlash kerak', p1: '1–7 kunlar: tozalash, krem va SPF.', p2: '8–14 kunlar: toner qo‘shing.', p3: '15-kundan: zardob. Faol komponentlar — kechqurun.', p4: 'Natijani 4–6 haftadan keyin baholang: teri yangilanish sikli shuncha davom etadi.', p5: 'Birinchi ishlatishdan oldin vositani tirsak bukimiga yoki quloq orqasiga surtib, bir kun kuting.',
      preg: 'Retinol, kislotalar va spikulalarni chiqarib tashladik. Homiladorlik va emizish davrida yangi parvarishni shifokor bilan kelishing.',
      derm: 'Agar terini dermatologda davolayotgan bo‘lsangiz, boshlashdan oldin unga ushbu parvarishni ko‘rsating.',
      frag: 'Kuchli xushbo‘y vositalarni tanlovda pastroqqa tushirdik. Qadoqdagi tarkibni tekshiring.',
      ask: 'Maslahatchi bilan muhokama qilish', copied: 'Profil nusxalandi — uni chatga joylashtiring', again: '↻ Qaytadan o‘tish',
      disc: 'Test natijasi — kosmetika tanlash uchun yo‘l-yo‘riq, tibbiy tashxis emas. Kuchli yallig‘lanish, qichishish yoki allergiyada dermatologga murojaat qiling.',
      ages: ['20 gacha', '20–29', '30–39', '40–49', '50+'], match: 'mos'
    },
    en: {
      badge: 'Luma Skin Lab', title: 'Professional skin diagnostics', meta: '10 questions · 2 minutes · free',
      f1: 'Skin type by real signs', f2: 'Sensitivity & barrier', f3: 'Your concerns', f4: 'AM & PM routine',
      introP: 'The test follows the logic of a cosmetologist consultation: we determine your skin type from how it behaves during the day, not from self-assessment.',
      start: 'Start diagnostics', last: 'My last result', step: 'Question {n} of {m}', back: '← Back', next: 'Next →', pick3: 'Choose up to 3', pickMany: 'You can choose several', finish: 'Show my result →',
      q1: 'How does your skin feel 2–3 hours after cleansing, with nothing applied?', h1: 'This is the key sign of skin type — think of a normal day.',
      q1a: 'Tight, sometimes flaky', q1b: 'Comfortable, no shine', q1c: 'Shiny only on forehead, nose and chin', q1d: 'Shiny all over',
      q2: 'What are your pores like?', h2: 'Look in the mirror in daylight.',
      q2a: 'Barely visible', q2b: 'Visible only on the nose', q2c: 'Enlarged in the T-zone', q2d: 'Enlarged all over',
      q3: 'What happens to your skin by midday?', h3: 'Without mattifiers or powder.',
      q3a: 'Dull, I want to apply cream', q3b: 'Looks the same as in the morning', q3c: 'Shine in the T-zone', q3d: 'Very shiny, makeup slides',
      q4: 'Does your skin ever look shiny yet feel tight?', h4: 'That is dehydration — the skin lacks water, not oil.',
      q4a: 'Yes, often', q4b: 'Sometimes', q4c: 'No',
      q5: 'How does your skin react to new products, sun, cold or wind?', h5: '',
      q5a: 'Turns red', q5b: 'Burns or stings', q5c: 'Itches', q5d: 'Flakes', q5e: 'Breaks out', q5f: 'No reaction',
      q6: 'What would you like to improve first?', h6: '',
      c_blemish: 'Breakouts & blackheads', c_pores: 'Enlarged pores', c_spots: 'Dark spots & acne marks', c_glow: 'Dullness, uneven tone', c_hydrate: 'Dryness & dehydration', c_antiage: 'Wrinkles & firmness', c_redness: 'Redness', c_eye: 'Dark circles & puffiness',
      q7: 'Your age', h7: 'Age affects the choice of actives and textures.',
      q8: 'How much time do you spend in the sun?', h8: 'UV index in Uzbekistan is high almost all year round.',
      q8a: 'Mostly indoors', q8b: '1–2 hours a day', q8c: 'A lot outdoors, driving, travelling',
      q9: 'How many routine steps suit you?', h9: '',
      q9a: 'Minimal — 3 steps', q9a2: 'Quick and simple', q9b: 'Basic — 4–5 steps', q9b2: 'Best for most people', q9c: 'Full ritual', q9c2: 'AM & PM, 6+ steps',
      q10: 'Anything we should take into account?', h10: 'We will remove unsuitable products from the routine.',
      q10a: 'Pregnancy or breastfeeding', q10b: 'Allergy to fragrance or essential oils', q10c: 'Under a dermatologist’s treatment', q10d: 'None of these',
      res: 'Your skin profile', t_dry: 'Dry skin', t_normal: 'Normal skin', t_combo: 'Combination skin', t_oily: 'Oily skin',
      d_dry: 'Sebaceous glands are less active, so the skin lacks lipids and the barrier loses moisture faster. Focus on gentle cleansing, barrier repair and a nourishing cream.',
      d_normal: 'Your skin is balanced: enough oil and moisture. Keep it that way with gentle cleansing, hydration and daily sun protection.',
      d_combo: 'More oil in the T-zone, less on the cheeks. You need balance: light hydration without heavy textures, shine control in the T-zone and gentle cleansing.',
      d_oily: 'Active sebaceous glands cause shine, enlarged pores and breakouts. You need gentle cleansing, light hydrating textures and sebum-regulating actives. Never over-dry — the skin will respond with even more oil.',
      m_oil: 'Oiliness', m_sens: 'Sensitivity', m_hyd: 'Hydration', lv0: 'low', lv1: 'medium', lv2: 'high',
      dehyd: 'There are signs of dehydration: the skin lacks water. It is a condition, not a type — fixed with hydrating layers (toner, essence) and hyaluronic acid.',
      sensNote: 'Your skin is sensitive: introduce products one at a time, every 3–4 days. Skip acids, scrubs and retinol for the first 2 weeks.',
      needs: 'What your skin needs', concerns: 'Your concerns',
      a_ha: 'Hyaluronic acid', a_ha2: 'Attracts and holds water, relieves tightness.',
      a_cer: 'Ceramides & oils', a_cer2: 'Repair the protective barrier, nourish dry skin.',
      a_cica: 'Centella & panthenol', a_cica2: 'Calm redness and irritation, speed up healing.',
      a_nia: 'Niacinamide', a_nia2: 'Regulates sebum, refines pores, evens tone.',
      a_bha: 'Salicylic acid (BHA)', a_bha2: 'Clears pores from within, reduces blackheads. 2–3 times a week.',
      a_vc: 'Vitamin C', a_vc2: 'Fades spots and acne marks, adds glow. Mornings, under SPF.',
      a_pep: 'Peptides & collagen', a_pep2: 'Support firmness, soften fine lines.',
      a_ret: 'Retinol', a_ret2: 'Renews skin and reduces wrinkles. Evenings only, 2–3 times a week, SPF by day.',
      a_spf: 'SPF 50 every day', a_spf2: 'The #1 product against pigmentation and ageing — even on cloudy days.',
      am: 'Morning', pm: 'Evening', routine: 'Your step-by-step routine', why: 'Why', empty: 'No suitable product in stock yet',
      s_cleanse: 'Cleanse', s_toner: 'Toner', s_serum: 'Serum', s_cream: 'Moisturizer', s_spf: 'SPF', s_eye: 'Eye care',
      total: 'Full routine', addAll: 'Add full routine to bag', added: 'Routine added to bag',
      plan: 'How to start', p1: 'Days 1–7: cleanser, moisturizer and SPF.', p2: 'Days 8–14: add the toner.', p3: 'From day 15: serum. Actives in the evening.', p4: 'Judge results after 4–6 weeks — that is the skin renewal cycle.', p5: 'Before first use, patch test on the inner elbow or behind the ear for 24 hours.',
      preg: 'We excluded retinol, acids and spicules. During pregnancy and breastfeeding, check new products with your doctor.',
      derm: 'If you are under a dermatologist’s care, show them this routine before starting.',
      frag: 'Heavily fragranced products were moved down. Always check the ingredients on the pack.',
      ask: 'Discuss with a consultant', copied: 'Profile copied — paste it into the chat', again: '↻ Retake the test',
      disc: 'This is guidance for choosing cosmetics, not a medical diagnosis. For strong inflammation, itching or allergy, see a dermatologist.',
      ages: ['Under 20', '20–29', '30–39', '40–49', '50+'], match: 'suits'
    }
  };
  function lang() { var l = String(W.LUMA_LANG || D.documentElement.lang || 'ru').slice(0, 2); return l === 'uz' ? 'uz' : (l === 'en' || l === 'ko') ? 'en' : 'ru'; }
  function t(k, a) { var s = (TX[lang()][k] != null ? TX[lang()][k] : TX.ru[k]); if (a) for (var x in a) s = String(s).replace('{' + x + '}', a[x]); return s; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function g(n) { try { return W.eval(n); } catch (e) { return undefined; } }

  /* ---------- вопросы ---------- */
  var Q = [
    { id: 'feel', q: 'q1', h: 'h1', o: [['dry', 'q1a', '◌'], ['normal', 'q1b', '◍'], ['combo', 'q1c', '◐'], ['oily', 'q1d', '●']] },
    { id: 'pores', q: 'q2', h: 'h2', o: [['0', 'q2a'], ['1', 'q2b'], ['2', 'q2c'], ['3', 'q2d']] },
    { id: 'noon', q: 'q3', h: 'h3', o: [['0', 'q3a'], ['1', 'q3b'], ['2', 'q3c'], ['3', 'q3d']] },
    { id: 'dehyd', q: 'q4', h: 'h4', o: [['2', 'q4a'], ['1', 'q4b'], ['0', 'q4c']] },
    { id: 'react', q: 'q5', h: 'h5', multi: 9, none: 'none', o: [['red', 'q5a'], ['burn', 'q5b'], ['itch', 'q5c'], ['flake', 'q5d'], ['break', 'q5e'], ['none', 'q5f']] },
    { id: 'con', q: 'q6', h: 'h6', multi: 3, o: [['blemish', 'c_blemish'], ['pores', 'c_pores'], ['spots', 'c_spots'], ['glow', 'c_glow'], ['hydrate', 'c_hydrate'], ['antiage', 'c_antiage'], ['redness', 'c_redness'], ['eye', 'c_eye']] },
    { id: 'age', q: 'q7', h: 'h7', o: [['0'], ['1'], ['2'], ['3'], ['4']] },
    { id: 'sun', q: 'q8', h: 'h8', o: [['0', 'q8a'], ['1', 'q8b'], ['2', 'q8c']] },
    { id: 'lvl', q: 'q9', h: 'h9', o: [['min', 'q9a', '', 'q9a2'], ['base', 'q9b', '', 'q9b2'], ['full', 'q9c', '', 'q9c2']] },
    { id: 'spec', q: 'q10', h: 'h10', multi: 9, none: 'none', o: [['preg', 'q10a'], ['frag', 'q10b'], ['derm', 'q10c'], ['none', 'q10d']] }
  ];
  var KEY = 'luma_skin2', A = {}, step = 0;

  /* ---------- анализ ---------- */
  function profile(a) {
    var f = { dry: 0, normal: 1, combo: 2, oily: 3 }[a.feel] || 0;
    var oil = f * 1.6 + (+a.pores || 0) + (+a.noon || 0);            // 0..10.8
    var type = oil < 2.6 ? 'dry' : oil < 5 ? 'normal' : oil < 7.6 ? 'combo' : 'oily';
    if (a.feel === 'dry' && type !== 'dry' && oil < 4) type = 'dry';
    if (a.feel === 'oily' && type === 'normal') type = 'combo';
    var react = (a.react || []).filter(function (x) { return x !== 'none'; });
    var sens = react.length >= 2 || react.indexOf('burn') > -1 ? 2 : react.length ? 1 : 0;
    var dehyd = +a.dehyd || 0;
    var con = (a.con || []).slice();
    if (react.indexOf('break') > -1 && con.indexOf('blemish') < 0) con.push('blemish');
    if (react.indexOf('red') > -1 && sens && con.indexOf('redness') < 0) con.push('redness');
    if (dehyd === 2 && con.indexOf('hydrate') < 0) con.push('hydrate');
    var spec = a.spec || [];
    return {
      type: type, oil: Math.round(Math.min(100, oil / 10.8 * 100)), sens: sens, dehyd: dehyd, con: con,
      age: +a.age || 0, sun: +a.sun || 0, lvl: a.lvl || 'base',
      preg: spec.indexOf('preg') > -1, frag: spec.indexOf('frag') > -1, derm: spec.indexOf('derm') > -1
    };
  }

  var TYPEW = { dry: ['сух', 'питат', 'обезвож', 'зрел'], normal: ['нормальн', 'всех типов'], combo: ['комбинир', 'всех типов', 'баланс'], oily: ['жирн', 'матир', 'себум', 'несоверш', 'пор'] };
  var CONW = {
    blemish: ['несоверш', 'высып', 'акне', 'себум', 'прыщ', 'чёрн', 'черн'], pores: ['пор ', 'поры', 'пор,', 'пор.', 'себум', 'матир'], spots: ['пигмент', 'пятн', 'осветл', 'выравн', 'постакне', 'ниацинамид'],
    glow: ['сиян', 'тускл', 'осветл', 'витамин c', 'ниацинамид'], hydrate: ['увлаж', 'гиалур', 'обезвож', 'влаг'], antiage: ['морщин', 'упруг', 'коллаген', 'аденозин', 'лифтинг', 'зрел', 'пептид', 'антивозраст'],
    redness: ['покрасн', 'раздраж', 'центелл', 'cica', 'пантенол', 'успока'], eye: ['вокруг глаз', 'тёмн', 'темн', 'отёк', 'отек']
  };
  var SENSW = ['чувств', 'раздраж', 'успока', 'центелл', 'cica', 'пантенол', 'мягк'];
  var STEPS = {
    cleanse: { re: /пенк|умыван|очищающ|гидрофильн|cleans|foam/i },
    toner: { re: /тонер|тоник|toner|tonic/i },
    serum: { re: /сыворот|ампул|эссенц|serum|essence|ampoule/i, no: /солнцезащит|sun/i },
    cream: { re: /крем|эмульс|флюид|лосьон|cream|emulsion|moistur/i, no: /вокруг глаз|eye|вв-крем|bb|кушон|cushion|солнцезащит|spf|набор|kit|ролл/i },
    spf: { re: /spf|солнцезащит|sun/i, no: /кушон|cushion|вв-крем|blemish|pact/i },
    eye: { re: /вокруг глаз|eye/i, no: /набор|kit/i }
  };
  var LBL = { dry: 'сухой', normal: 'нормальной', combo: 'комбинированной', oily: 'жирной' };

  function score(p, pr) {
    var tx = (p.t + ' ' + p.k + ' ' + (p.su || '') + ' ' + (p.ds || '') + ' ' + (p.ing || '')).toLowerCase(), av = (p.av || '').toLowerCase();
    var s = 0, why = [];
    var hit = function (ws) { return ws.some(function (w) { return tx.indexOf(w) > -1; }); };
    if (hit(TYPEW[pr.type])) { s += 3; why.push('t_' + pr.type); }
    if (tx.indexOf('всех типов') > -1) s += 1;
    pr.con.forEach(function (c, i) { if (CONW[c] && hit(CONW[c])) { s += 4 - Math.min(i, 2); if (why.length < 3) why.push('c_' + c); } });
    if (pr.sens && hit(SENSW)) { s += pr.sens * 2; if (why.indexOf('sens') < 0) why.push('sens'); }
    if (pr.dehyd && hit(CONW.hydrate)) s += pr.dehyd;
    if (pr.age >= 2 && hit(CONW.antiage)) s += 1;
    if (pr.age >= 3 && pr.con.indexOf('antiage') > -1 && /prestige|resilience|ginseng|lifting|wrinkle|collagen|коллаген|женьшен|антивозраст/i.test(p.t)) s += 3;
    if (pr.age <= 1) { if (/lifting|wrinkle|антивозраст|лифтинг|морщин|resilience|prestige/i.test(p.t)) s -= 10; else if (/зрел|антивозраст/.test(tx)) s -= 3; }
    if (pr.type === 'oily' && /питат|насыщ|богат|масл/.test(tx)) s -= 2;
    if (pr.type === 'dry' && /матир|себум/.test(tx)) s -= 3;
    if (pr.sens === 2 && /спикул|кислот|пилинг|покалыв|скраб|ретинол/.test(tx)) s -= 12;
    if (pr.preg && /ретинол|салицил|bha|спикул|retinol/.test(tx)) return null;
    if (pr.frag && /парфюм|аромат|эфирн/.test(tx)) s -= 6;
    if (pr.sens && /чувств/.test(av)) return null;
    if (av && TYPEW[pr.type].some(function (w) { return av.indexOf(w) > -1; })) s -= 6;
    return { s: s, why: why };
  }

  function pick(pr) {
    var P = g('P') || [];
    var fp = g('finalPrice') || function (p) { return p.p; };
    var pool = P.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) { return (x.p.c === 'Лицо' || x.p.c === 'Загар и SPF') && x.p.p && (x.p.st == null || x.p.st > 0); });
    var best = function (k, skip) {
      var st = STEPS[k], name = function (p) { return p.t + ' ' + p.k; };
      var c = pool.filter(function (x) { return st.re.test(name(x.p)) && !(st.no && st.no.test(name(x.p))) && (!skip || skip.indexOf(x.i) < 0); })
        .map(function (x) { var r = score(x.p, pr); return r && { p: x.p, i: x.i, s: r.s + (k === 'spf' && x.p.c === 'Загар и SPF' ? 2 : 0), why: r.why }; })
        .filter(Boolean).sort(function (a, b) { return b.s - a.s || fp(a.p) - fp(b.p); });
      return c[0] || null;
    };
    var useEye = pr.con.indexOf('eye') > -1 || (pr.lvl === 'full' && pr.age >= 2);
    var plan = {
      min: { am: ['cleanse', 'cream', 'spf'], pm: ['cleanse', 'cream'] },
      base: { am: ['cleanse', 'toner', 'cream', 'spf'], pm: ['cleanse', 'toner', 'serum', 'cream'] },
      full: { am: ['cleanse', 'toner', 'serum', 'cream', 'spf'], pm: ['cleanse', 'toner', 'serum2', 'cream'] }
    }[pr.lvl];
    var am = plan.am.slice(), pm = plan.pm.slice();
    if (useEye) pm.push('eye');
    if (pr.sun === 2 && am.indexOf('spf') < 0) am.push('spf');
    var chosen = {};
    var get = function (k) {
      if (chosen[k] !== undefined) return chosen[k];
      if (k === 'serum2') { var s1 = get('serum'); chosen[k] = best('serum', s1 ? [s1.i] : []) || s1; return chosen[k]; }
      chosen[k] = best(k); return chosen[k];
    };
    var mk = function (arr) { return arr.map(function (k) { return { k: k === 'serum2' ? 'serum' : k, x: get(k) }; }); };
    return { am: mk(am), pm: mk(pm) };
  }

  function actives(pr) {
    var out = [], add = function (k) { if (out.indexOf(k) < 0) out.push(k); };
    var has = function (c) { return pr.con.indexOf(c) > -1; };
    if (pr.sens || has('redness')) add('cica');
    if (has('hydrate') || pr.dehyd || pr.type === 'dry') add('ha');
    if (has('blemish') || has('pores') || pr.type === 'oily' || pr.type === 'combo') add('nia');
    if (has('blemish') && !pr.preg && pr.sens < 2) add('bha');
    if (has('spots') || has('glow')) add(pr.sens < 2 ? 'vc' : 'nia');
    if (pr.type === 'dry') add('cer');
    if (has('antiage') || pr.age >= 3) add(pr.age >= 2 && !pr.preg && pr.sens < 2 ? 'ret' : 'pep');
    add('spf');
    return out.slice(0, 4);
  }

  /* ---------- вывод ---------- */
  function shell() {
    root.className = 'sx' + (root.classList.contains('sx-run') ? ' sx-run' : '');
    root.innerHTML = '<aside class="sx-in"><span class="sx-badge">' + t('badge') + '</span><h3>' + t('title') + '</h3><p class="sx-meta">' + t('meta') + '</p>' +
      '<p class="sx-lead">' + t('introP') + '</p><ul class="sx-feats">' + ['f1', 'f2', 'f3', 'f4'].map(function (k, i) { return '<li><i>' + (i + 1) + '</i><span>' + t(k) + '</span></li>'; }).join('') + '</ul></aside>' +
      '<div class="sx-panel" id="skinQuizBody"></div>';
  }
  function body() { return D.getElementById('skinQuizBody'); }

  function intro() {
    shell(); root.classList.remove('sx-run');
    var saved = load();
    body().innerHTML = '<div class="sx-start"><div class="sx-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52"/><circle cx="60" cy="60" r="52" class="a"/></svg><b>10</b><small>' + (lang() === 'en' ? 'questions' : lang() === 'uz' ? 'savol' : 'вопросов') + '</small></div>' +
      '<button type="button" class="sx-go" data-a="start">' + t('start') + '</button>' + (saved ? '<button type="button" class="sx-link" data-a="last">' + t('last') + '</button>' : '') + '</div>';
  }
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.feel ? s : null; } catch (e) { return null; } }

  function render() {
    root.classList.add('sx-run');
    var q = Q[step], cur = A[q.id], multi = !!q.multi, b = body();
    var opts = q.o.map(function (o) {
      var on = multi ? (cur || []).indexOf(o[0]) > -1 : cur === o[0];
      var label = q.id === 'age' ? t('ages')[+o[0]] : t(o[1]);
      return '<button type="button" class="sx-opt' + (on ? ' on' : '') + (multi ? ' m' : '') + '" data-v="' + o[0] + '">' + (o[2] ? '<i>' + o[2] + '</i>' : '') + '<b>' + esc(label) + '</b>' + (o[3] ? '<small>' + t(o[3]) + '</small>' : '') + '</button>';
    }).join('');
    var pct = Math.round(step / Q.length * 100);
    b.innerHTML = '<div class="sx-q"><div class="sx-top"><span>' + t('step', { n: step + 1, m: Q.length }) + '</span><em>' + pct + '%</em></div><div class="sx-prog"><i style="width:' + Math.max(4, pct) + '%"></i></div>' +
      '<h4>' + t(q.q) + '</h4>' + (t(q.h) ? '<p class="sx-hint">' + t(q.h) + '</p>' : '') + (multi ? '<p class="sx-hint m">' + (q.multi === 3 ? t('pick3') : t('pickMany')) + '</p>' : '') +
      '<div class="sx-opts' + (q.o.length > 4 ? ' many' : '') + (q.id === 'age' ? ' age' : '') + '">' + opts + '</div>' +
      '<div class="sx-nav">' + (step ? '<button type="button" class="sx-back" data-a="prev">' + t('back') + '</button>' : '<span></span>') +
      (multi ? '<button type="button" class="sx-go sm" data-a="next"' + ((cur || []).length ? '' : ' disabled') + '>' + (step === Q.length - 1 ? t('finish') : t('next')) + '</button>' : '') + '</div></div>';
  }

  function choose(v) {
    var q = Q[step];
    if (q.multi) {
      var cur = (A[q.id] || []).slice(), i = cur.indexOf(v);
      if (v === q.none) cur = i > -1 ? [] : [v];
      else { cur = cur.filter(function (x) { return x !== q.none; }); if (i > -1) cur.splice(cur.indexOf(v), 1); else if (cur.length < q.multi) cur.push(v); else { cur.shift(); cur.push(v); } }
      A[q.id] = cur; render(); return;
    }
    A[q.id] = v; render();
    setTimeout(next, 200);
  }
  function next() {
    if (step < Q.length - 1) { step++; render(); scrollTop(); return; }
    try { localStorage.setItem(KEY, JSON.stringify(A)); } catch (e) { }
    result();
  }
  function scrollTop() { var el = body() || root, r = el.getBoundingClientRect(); if (r.top < 70 || r.top > innerHeight * .45) W.scrollTo({ top: Math.max(0, r.top + W.scrollY - 96), behavior: 'smooth' }); }

  var LAST = null;
  function result() {
    root.classList.add('sx-run');
    var pr = profile(A), R = pick(pr), act = actives(pr), b = body();
    var fp = g('finalPrice') || function (p) { return p.p; };
    var fmt = g('f') || function (n) { return n + ' сум'; };
    var img = g('safeImage') || function (s) { return s; };
    var uniq = {}; R.am.concat(R.pm).forEach(function (s) { if (s.x) uniq[s.x.i] = s.x; });
    var items = Object.keys(uniq).map(function (k) { return uniq[k]; });
    var total = items.reduce(function (s, x) { return s + fp(x.p); }, 0);
    LAST = { pr: pr, items: items };
    var lv = function (n) { return t(['lv0', 'lv1', 'lv2'][n]); };
    var meter = function (label, val, txt) { return '<div class="sx-m"><div><span>' + label + '</span><b>' + txt + '</b></div><i><u style="width:' + val + '%"></u></i></div>'; };
    var hyd = pr.dehyd === 2 ? 25 : pr.dehyd === 1 ? 50 : pr.type === 'dry' ? 45 : 80;
    var stepCard = function (s, n) {
      var x = s.x;
      if (!x) return '<div class="sx-st none"><span class="sx-n">' + n + '</span><div><b>' + t('s_' + s.k) + '</b><small>' + t('empty') + '</small></div></div>';
      var why = x.why.slice(0, 2).map(function (w) { return w === 'sens' ? (lang() === 'en' ? 'sensitive skin' : lang() === 'uz' ? 'sezgir teri' : 'чувствительная кожа') : t(w).toLowerCase(); });
      return '<div class="sx-st"><span class="sx-n">' + n + '</span><a class="sx-im" href="product.html?id=' + encodeURIComponent(x.p.id) + '">' + (x.p.i ? '<img loading="lazy" src="' + esc(img(x.p.i)) + '" alt="">' : '') + '</a>' +
        '<div class="sx-sb"><small class="sx-sn">' + t('s_' + s.k) + '</small><a class="sx-nm" href="product.html?id=' + encodeURIComponent(x.p.id) + '">' + esc(x.p.k ? x.p.k + ' · ' : '') + esc(x.p.t) + '</a>' +
        (why.length ? '<span class="sx-why">✓ ' + esc(why.join(' · ')) + '</span>' : '') + '<div class="sx-pr"><b>' + fmt(fp(x.p)) + '</b><button type="button" class="sx-add sl-add" data-i="' + x.i + '" aria-label="+">+</button></div></div></div>';
    };
    var notes = [];
    if (pr.preg) notes.push(t('preg'));
    if (pr.derm) notes.push(t('derm'));
    if (pr.frag) notes.push(t('frag'));
    b.innerHTML = '<div class="sx-res">' +
      '<div class="sx-hd"><span class="sx-badge">' + t('res') + '</span><h4>' + t('t_' + pr.type) + '</h4><p>' + t('d_' + pr.type) + '</p></div>' +
      '<div class="sx-ms">' + meter(t('m_oil'), pr.oil, pr.oil < 34 ? lv(0) : pr.oil < 67 ? lv(1) : lv(2)) + meter(t('m_sens'), [15, 55, 90][pr.sens], lv(pr.sens)) + meter(t('m_hyd'), hyd, hyd < 40 ? lv(0) : hyd < 70 ? lv(1) : lv(2)) + '</div>' +
      (pr.con.length ? '<div class="sx-chips"><span>' + t('concerns') + ':</span>' + pr.con.map(function (c) { return '<em>' + t('c_' + c) + '</em>'; }).join('') + '</div>' : '') +
      (pr.dehyd === 2 || (pr.dehyd === 1 && pr.type !== 'dry') ? '<p class="sx-note">' + t('dehyd') + '</p>' : '') +
      (pr.sens === 2 ? '<p class="sx-note warn">' + t('sensNote') + '</p>' : '') +
      '<h5>' + t('needs') + '</h5><div class="sx-acts">' + act.map(function (k) { return '<div><b>' + t('a_' + k) + '</b><span>' + t('a_' + k + '2') + '</span></div>'; }).join('') + '</div>' +
      '<h5>' + t('routine') + '</h5><div class="sx-tabs" role="tablist"><button type="button" class="on" data-tab="am">☀ ' + t('am') + '</button><button type="button" data-tab="pm">☾ ' + t('pm') + '</button></div>' +
      '<div class="sx-rt" data-r="am">' + R.am.map(function (s, n) { return stepCard(s, n + 1); }).join('') + '</div>' +
      '<div class="sx-rt" data-r="pm" hidden>' + R.pm.map(function (s, n) { return stepCard(s, n + 1); }).join('') + '</div>' +
      (items.length ? '<div class="sx-total"><div><small>' + t('total') + ' · ' + items.length + '</small><b>' + fmt(total) + '</b></div><button type="button" class="sx-go" data-a="all">' + t('addAll') + '</button></div>' : '') +
      '<h5>' + t('plan') + '</h5><ol class="sx-plan">' + ['p1', 'p2', 'p3', 'p4', 'p5'].map(function (k) { return '<li>' + t(k) + '</li>'; }).join('') + '</ol>' +
      notes.map(function (n) { return '<p class="sx-note">' + n + '</p>'; }).join('') +
      '<div class="sx-acts2"><a class="sx-go line" href="https://t.me/Hak1mjon" target="_blank" rel="noopener" data-a="ask">' + t('ask') + ' ↗</a><button type="button" class="sx-link" data-a="again">' + t('again') + '</button></div>' +
      '<p class="sx-disc">' + t('disc') + '</p></div>';
    scrollTop();
    try { W.ym && ym(114302709, 'reachGoal', 'skin_test_done'); } catch (e) { }
  }

  function summary() {
    if (!LAST) return '';
    var pr = LAST.pr;
    return 'Luma Skin Lab\n' + t('t_' + pr.type) + ' · ' + t('m_sens') + ': ' + t(['lv0', 'lv1', 'lv2'][pr.sens]) +
      (pr.con.length ? '\n' + t('concerns') + ': ' + pr.con.map(function (c) { return t('c_' + c); }).join(', ') : '') +
      '\n' + LAST.items.map(function (x) { return '— ' + (x.p.k ? x.p.k + ' ' : '') + x.p.t; }).join('\n');
  }

  root.addEventListener('click', function (e) {
    var o = e.target.closest('.sx-opt'); if (o) { choose(o.getAttribute('data-v')); return; }
    var tb = e.target.closest('[data-tab]');
    if (tb) { root.querySelectorAll('[data-tab]').forEach(function (x) { x.classList.toggle('on', x === tb); }); root.querySelectorAll('.sx-rt').forEach(function (r) { r.hidden = r.getAttribute('data-r') !== tb.getAttribute('data-tab'); }); return; }
    var ad = e.target.closest('.sx-add'); if (ad) { var ad2 = g('add'); if (ad2) ad2(+ad.getAttribute('data-i')); return; }
    var a = e.target.closest('[data-a]'); if (!a) return;
    var k = a.getAttribute('data-a');
    if (k === 'start' || k === 'again') { A = {}; step = 0; render(); scrollTop(); }
    if (k === 'last') { A = load() || {}; result(); }
    if (k === 'prev') { step = Math.max(0, step - 1); render(); }
    if (k === 'next') next();
    if (k === 'all') {
      var cart = g('cart'); if (!cart || !LAST) return;
      LAST.items.forEach(function (x) { cart[x.i] = (cart[x.i] || 0) + 1; });
      try { g('cartSave')(); g('upd')(); } catch (er) { }
      var ts = g('toast'); if (ts) ts(t('added'));
      var dr = D.getElementById('dr'); if (dr) dr.classList.add('open');
    }
    if (k === 'ask') { try { navigator.clipboard.writeText(summary()); var ts2 = g('toast'); if (ts2) ts2(t('copied')); } catch (er) { } }
  });

  try {
    W.LUMA_I18N_ADD && W.LUMA_I18N_ADD([['Пройдите диагностику — определим тип и состояние кожи и соберём уход на утро и вечер из нашего каталога.',
      'Take the diagnostics — we will identify your skin type and condition and build a morning and evening routine from our catalog.',
      'Diagnostikadan o‘ting — teri turi va holatini aniqlab, katalogimizdan ertalabki va kechki parvarishni yig‘ib beramiz.',
      'Диагностикадан өтіңіз — тері түрі мен күйін анықтап, каталогтан таңғы және кешкі күтімді жинаймыз.',
      '진단을 받아보세요 — 피부 타입과 상태를 확인하고 카탈로그에서 아침·저녁 루틴을 구성해 드립니다.']]);
  } catch (e) { }

  /* старые функции сайта ведут в новый тест */
  W.LumaSkinLab = { profile: profile, score: score, pick: pick };
  W.skinQuizIntro = intro;
  W.skinQuizStart = function () { A = {}; step = 0; if (!body()) shell(); render(); };
  W.skinQuizShowResults = function () { A = load() || A; result(); };

  // перерисовка при смене языка
  D.addEventListener('luma:lang', function () {
    if (!body()) return;
    var inRes = !!root.querySelector('.sx-res'), inQ = !!root.querySelector('.sx-q');
    var html = body().innerHTML; shell();
    if (inRes) result(); else if (inQ) render(); else intro();
  });

  /* стили */
  var css = D.createElement('style');
  css.textContent = [
    '.sx{--x-bg:#FBF7F0;--x-card:#FFFDF8;--x-ink:#30251E;--x-ink2:#5B4C40;--x-mute:#8A7B6C;--x-gold:#B8955D;--x-gold-d:#8E6D3B;--x-line:#EADFCC;--x-soft:#F3EBDD;display:grid!important;grid-template-columns:minmax(0,.9fr) minmax(0,1.5fr);gap:0;max-width:1100px;margin:22px auto 0;border-radius:26px;overflow:hidden;background:var(--x-card);border:1px solid var(--x-line);box-shadow:0 30px 60px -40px rgba(48,37,30,.45);font-family:Jost,Arial,sans-serif;color:var(--x-ink)}',
    'html.dark .sx{--x-bg:#0A0A0A;--x-card:#121212;--x-ink:#F2F2F2;--x-ink2:#CFCFCF;--x-mute:#9A9A9A;--x-gold:#2EE6E0;--x-gold-d:#5CF0EB;--x-line:#2A2A2A;--x-soft:#1A1A1A}',
    '.sx-in{padding:34px 30px;background:radial-gradient(120% 80% at 0 0,#F3E6CF 0,transparent 60%),linear-gradient(170deg,#FBF6EE,#EFE4D2);color:#30251E;display:flex;flex-direction:column;gap:12px}',
    'html.dark .sx-in{background:radial-gradient(120% 80% at 0 0,#0E3B3A 0,transparent 60%),linear-gradient(170deg,#141414,#0A0A0A);color:#F2F2F2}',
    '.sx-badge{align-self:flex-start;display:inline-block;padding:6px 12px;border-radius:99px;background:rgba(184,149,93,.16);color:var(--x-gold-d);font:600 10.5px Jost,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase}',
    '.sx-in h3{margin:4px 0 0;font:600 clamp(26px,3vw,34px)/1.08 "Cormorant Garamond",Georgia,serif;color:inherit}',
    '.sx-meta{margin:0;font-size:13px;letter-spacing:.04em;color:var(--x-gold-d)}',
    '.sx-lead{margin:4px 0 0;font-size:14px;line-height:1.6;opacity:.85}',
    '.sx-feats{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:8px}',
    '.sx-feats li{display:flex;align-items:center;gap:10px;font-size:14px}',
    '.sx-feats i{width:26px;height:26px;flex:none;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(184,149,93,.5);color:var(--x-gold-d);font:600 12px Jost,Arial,sans-serif;font-style:normal}',
    '.sx-panel{padding:30px;min-height:430px;display:flex;flex-direction:column;justify-content:center;background:var(--x-card)}',
    '.sx-start{text-align:center;display:flex;flex-direction:column;align-items:center;gap:18px}',
    '.sx-ring{position:relative;width:132px;height:132px}.sx-ring svg{width:100%;height:100%;transform:rotate(-90deg)}.sx-ring circle{fill:none;stroke:var(--x-soft);stroke-width:6}.sx-ring circle.a{stroke:var(--x-gold);stroke-dasharray:327;stroke-dashoffset:327;stroke-linecap:round;animation:sxR 1.6s ease forwards .2s}',
    '@keyframes sxR{to{stroke-dashoffset:60}}',
    '.sx-ring b{position:absolute;inset:0;display:grid;place-items:center;padding-bottom:16px;font:600 44px "Cormorant Garamond",Georgia,serif}.sx-ring small{position:absolute;left:0;right:0;bottom:36px;text-align:center;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--x-mute)}',
    '.sx-go{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 28px;border:0;border-radius:14px;background:var(--x-ink);color:var(--x-card);font:500 15.5px Jost,Arial,sans-serif;letter-spacing:.02em;cursor:pointer;text-decoration:none;transition:transform .15s,opacity .2s}',
    '.sx-go:active{transform:scale(.97)}.sx-go[disabled]{opacity:.35;cursor:default}.sx-go.sm{min-height:46px;padding:0 22px;font-size:14.5px}',
    'html.dark .sx-go{background:var(--x-gold);color:#050505}',
    '.sx-go.line{background:transparent;color:var(--x-ink);border:1.5px solid var(--x-line)}',
    '.sx-link{border:0;background:none;color:var(--x-gold-d);font:500 14px Jost,Arial,sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:8px}',
    '.sx-q{animation:sxIn .3s ease}@keyframes sxIn{from{opacity:0;transform:translateY(6px)}}',
    '.sx-top{display:flex;justify-content:space-between;align-items:center;font:600 11.5px Jost,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--x-gold-d)}.sx-top em{font-style:normal;color:var(--x-mute);letter-spacing:.04em}',
    '.sx-prog{height:3px;border-radius:3px;background:var(--x-soft);margin:10px 0 22px;overflow:hidden}.sx-prog i{display:block;height:100%;background:var(--x-gold);transition:width .35s}',
    '.sx-q h4{margin:0 0 6px;font:600 clamp(22px,2.4vw,27px)/1.18 "Cormorant Garamond",Georgia,serif;color:var(--x-ink)}',
    '.sx-hint{margin:0 0 6px;font-size:13.5px;line-height:1.5;color:var(--x-mute)}.sx-hint.m{color:var(--x-gold-d);font-weight:500}',
    '.sx-opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:14px}.sx-opts.age{grid-template-columns:repeat(5,minmax(0,1fr))}',
    '.sx-opt{position:relative;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:3px;min-height:58px;padding:12px 14px;border:1.5px solid var(--x-line);border-radius:14px;background:var(--x-bg);color:var(--x-ink);text-align:left;cursor:pointer;font-family:Jost,Arial,sans-serif;transition:border-color .2s,background .2s,transform .12s}',
    '.sx-opt:active{transform:scale(.98)}.sx-opt b{font-weight:500;font-size:14.5px;line-height:1.3}.sx-opt small{font-size:12px;color:var(--x-mute)}.sx-opt i{font-style:normal;color:var(--x-gold);font-size:16px}',
    '.sx-opts.age .sx-opt{align-items:center;text-align:center;padding:12px 4px}',
    '.sx-opt.m{padding-right:38px}.sx-opt.m::after{content:"";position:absolute;right:13px;top:50%;width:18px;height:18px;margin-top:-9px;border-radius:5px;border:1.5px solid var(--x-line);background:var(--x-card)}',
    '.sx-opt.on{border-color:var(--x-gold);background:color-mix(in srgb,var(--x-gold) 10%,var(--x-card))}',
    '.sx-opt.m.on::after{background:var(--x-gold) url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath d=%27M5 12.5l4.2 4.2L19 7%27 fill=%27none%27 stroke=%27white%27 stroke-width=%273%27 stroke-linecap=%27round%27/%3E%3C/svg%3E") center/14px no-repeat;border-color:var(--x-gold)}',
    '.sx-nav{display:flex;justify-content:space-between;align-items:center;margin-top:18px;min-height:46px}',
    '.sx-back{border:0;background:none;color:var(--x-mute);font:500 14px Jost,Arial,sans-serif;cursor:pointer;padding:10px 0}',
    '.sx-res{animation:sxIn .35s ease;display:flex;flex-direction:column}',
    '.sx-hd h4{margin:10px 0 6px;font:600 clamp(30px,3.4vw,38px)/1.05 "Cormorant Garamond",Georgia,serif;color:var(--x-ink)}.sx-hd p{margin:0;font-size:14.5px;line-height:1.6;color:var(--x-ink2)}',
    '.sx-ms{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:18px 0 6px}',
    '.sx-m{padding:12px;border-radius:14px;background:var(--x-bg);border:1px solid var(--x-line)}.sx-m div{display:flex;flex-direction:column;gap:2px;margin-bottom:9px}.sx-m span{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--x-mute)}.sx-m b{font-weight:600;font-size:14px}',
    '.sx-m i{display:block;height:5px;border-radius:5px;background:var(--x-soft);overflow:hidden}.sx-m u{display:block;height:100%;background:linear-gradient(90deg,#E2CDA6,var(--x-gold));border-radius:5px}',
    '.sx-chips{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:12px 0 2px;font-size:13px;color:var(--x-mute)}.sx-chips em{font-style:normal;padding:6px 11px;border-radius:99px;background:var(--x-soft);color:var(--x-ink);font-size:12.5px}',
    '.sx-note{margin:10px 0 0;padding:12px 14px;border-radius:14px;background:var(--x-soft);font-size:13.5px;line-height:1.55;color:var(--x-ink2)}.sx-note.warn{background:color-mix(in srgb,#C27C4A 14%,var(--x-card));color:var(--x-ink)}',
    '.sx-res h5{margin:26px 0 10px;font:600 22px/1.15 "Cormorant Garamond",Georgia,serif;color:var(--x-ink)}',
    '.sx-acts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.sx-acts div{padding:13px 14px;border-radius:14px;border:1px solid var(--x-line);background:var(--x-bg)}.sx-acts b{display:block;font-weight:600;font-size:14px;margin-bottom:3px;color:var(--x-gold-d)}.sx-acts span{font-size:13px;line-height:1.45;color:var(--x-ink2)}',
    '.sx-tabs{display:inline-flex;align-self:flex-start;padding:4px;border-radius:12px;background:var(--x-soft);gap:4px;margin-bottom:10px}.sx-tabs button{min-height:40px;padding:0 18px;border:0;border-radius:9px;background:none;color:var(--x-mute);font:500 14px Jost,Arial,sans-serif;cursor:pointer}.sx-tabs button.on{background:var(--x-card);color:var(--x-ink);box-shadow:0 2px 8px -4px rgba(48,37,30,.3)}',
    '.sx-rt{display:flex;flex-direction:column;gap:8px}',
    '.sx-st{display:flex;align-items:center;gap:12px;padding:10px;border-radius:16px;background:var(--x-bg);border:1px solid var(--x-line)}.sx-st.none{opacity:.6}.sx-st.none div{display:flex;flex-direction:column}.sx-st.none small{font-size:12.5px;color:var(--x-mute)}',
    '.sx-n{width:24px;height:24px;flex:none;border-radius:50%;display:grid;place-items:center;background:var(--x-ink);color:var(--x-card);font:600 11.5px Jost,Arial,sans-serif}html.dark .sx-n{background:var(--x-gold);color:#050505}',
    '.sx-im{width:64px;height:64px;flex:none;border-radius:12px;overflow:hidden;background:var(--x-card)}.sx-im img{width:100%;height:100%;object-fit:cover;display:block}',
    '.sx-sb{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.sx-sn{font:600 10.5px Jost,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--x-gold-d)}',
    '.sx-nm{font-size:13.5px;line-height:1.3;color:var(--x-ink);text-decoration:none;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.sx-why{font-size:11.5px;color:#5E8A63}html.dark .sx-why{color:#8FC29A}',
    '.sx-pr{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:2px}.sx-pr b{font-weight:600;font-size:14px}',
    '.sx-add{width:34px!important;height:34px!important;flex:0 0 34px!important;border:0;border-radius:50%!important;background:var(--x-ink)!important;color:var(--x-card)!important;font-size:19px;line-height:1;cursor:pointer}html.dark .sx-add{background:var(--x-gold)!important;color:#050505!important}',
    '.sx-total{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:14px;padding:16px;border-radius:16px;background:var(--x-soft)}.sx-total small{display:block;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--x-mute)}.sx-total b{font-size:22px;font-weight:600}',
    '.sx-plan{margin:0;padding:0;list-style:none;counter-reset:p;display:grid;gap:8px}.sx-plan li{counter-increment:p;position:relative;padding-left:36px;font-size:14px;line-height:1.5;color:var(--x-ink2)}.sx-plan li::before{content:counter(p);position:absolute;left:0;top:-1px;width:24px;height:24px;border-radius:50%;border:1px solid var(--x-gold);color:var(--x-gold-d);display:grid;place-items:center;font-size:12px;font-weight:600}',
    '.sx-acts2{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:22px}',
    '.sx-disc{margin:16px 0 0;font-size:12px;line-height:1.55;color:var(--x-mute)}',
    '@media(max-width:860px){.sx{grid-template-columns:1fr;border-radius:22px;margin-top:16px}.sx-in{padding:24px 20px}.sx-feats{grid-template-columns:1fr 1fr}.sx-panel{padding:22px 16px;min-height:0}.sx-opts.age{grid-template-columns:repeat(3,minmax(0,1fr))}.sx-ms{grid-template-columns:1fr}.sx-m div{flex-direction:row;justify-content:space-between;align-items:baseline}}',
    '@media(max-width:860px){.sx.sx-run .sx-in{display:none}}',
    '@media(max-width:420px){.sx-opts:not(.age){grid-template-columns:1fr}.sx-acts{grid-template-columns:1fr}.sx-feats{grid-template-columns:1fr}}'
  ].join('\n');
  D.head.appendChild(css);

  intro();
})(window, document);
