// Luma Beauty — Telegram-бот магазина (grammY)
// Покупателям: меню, каталог с фото, акции, мои заказы, вопросы (FAQ + вопрос магазину), подбор ухода, контакты,
//              подписка на статус заказа (/start o<id>_<token>), отписка от акций.
// Магазину (чат TELEGRAM_CHAT_ID): кнопки статуса заказа, ответы на вопросы через «Ответить» (Reply),
//              рассылки /send и /promo (текст, фото или альбом), /stats, /questions.
// Внутренние вызовы из базы (x-order-secret): type=status — уведомить покупателя; action=info|setup.
import { Bot, InlineKeyboard, Keyboard, webhookCallback } from 'npm:grammy@1.30.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const TOKEN = (Deno.env.get('TELEGRAM_BOT_TOKEN') || '').trim();
const SHOP_CHAT = String(Deno.env.get('TELEGRAM_CHAT_ID') || '').trim();
const SECRET = Deno.env.get('ORDER_WEBHOOK_SECRET') || '';
const URL_SELF = `${Deno.env.get('SUPABASE_URL')}/functions/v1/tg-bot`;
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const SITE = 'https://lumabeauty.uz/';
const MANAGER = 'Hak1mjon';
const PHONE = '+998 91 001 01 84';

async function hookSecret() {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(SECRET + ':tg-webhook'));
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 48);
}

// deno-lint-ignore-file no-explicit-any
const esc = (x: unknown) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = (n: unknown) => Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сум';
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const dmy = (d: Date) => d.toLocaleDateString('ru-RU', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit' });
const utm = (u: string, c: string) => u + (u.includes('?') ? '&' : '?') + `utm_source=telegram&utm_medium=bot&utm_campaign=${c}`;
const isPickup = (o: any) => /^Самовывоз/i.test(String(o.address || ''));
const isShop = (ctx: any) => String(ctx.chat?.id) === SHOP_CHAT;
const isPrivate = (ctx: any) => ctx.chat?.type === 'private';

const LABEL: Record<string, string> = { new: '🆕 Новый', paid: '💳 Оплачен', shipped: '🚚 Передан курьеру', done: '✅ Выполнен', canceled: '✖️ Отменён' };

/* ======================= Меню ======================= */
const B = { cat: '🛍 Каталог', sale: '🔥 Акции', orders: '📦 Мои заказы', faq: '❓ Вопросы', skin: '🧪 Подобрать уход', contacts: '📞 Контакты' };
const mainMenu = () => new Keyboard().text(B.cat).text(B.sale).row().text(B.orders).text(B.faq).row().text(B.skin).text(B.contacts).resized().persistent();

const bot = new Bot(TOKEN);

async function remember(ctx: any, extra: Record<string, unknown> = {}) {
  if (!isPrivate(ctx)) return;
  await sb.from('bot_users').upsert({ chat_id: ctx.chat.id, first_name: ctx.from?.first_name ?? null, username: ctx.from?.username ?? null, last_seen: new Date().toISOString(), ...extra }, { onConflict: 'chat_id' });
}
async function setState(chat: number, state: string | null) {
  await sb.from('bot_users').upsert({ chat_id: chat, state }, { onConflict: 'chat_id' });
}
async function getState(chat: number) {
  const { data } = await sb.from('bot_users').select('state').eq('chat_id', chat).maybeSingle();
  return data?.state || null;
}

const WELCOME = (name?: string) => `Здравствуйте${name ? ', ' + esc(name) : ''}! 💄 Это <b>Luma Beauty</b> — оригинальная корейская и мировая косметика с доставкой по Узбекистану.

Что умеет бот:
🛍 каталог с фото и ценами
🔥 акции и скидки
📦 статусы ваших заказов
❓ ответы на вопросы — или задайте свой, ответим лично

Выберите в меню ниже 👇 или просто напишите название товара.`;

/* ======================= /start ======================= */
bot.command('start', async (ctx) => {
  if (!isPrivate(ctx)) return;
  await remember(ctx, { unsubscribed: false, state: null });
  if (isShop(ctx)) await ctx.reply(SHOP_HELP, { parse_mode: 'HTML' });
  const arg = String(ctx.match || '').trim();
  const m = arg.match(/^o(\d+)_([a-f0-9]{6,32})$/);
  if (m) {
    const id = Number(m[1]);
    const { data: o } = await sb.from('orders').select('id,status,tg_token').eq('id', id).maybeSingle();
    if (o && o.tg_token === m[2]) {
      await sb.from('orders').update({ tg_chat_id: ctx.chat.id }).eq('id', id);
      return ctx.reply(`🔔 Готово! Будем присылать сюда статус заказа <b>#${id}</b>.\nСейчас: <b>${LABEL[o.status] || esc(o.status)}</b>\n\nА пока можно посмотреть каталог и акции 👇`, { parse_mode: 'HTML', reply_markup: mainMenu() });
    }
    await ctx.reply('Не нашли такой заказ — проверьте ссылку или напишите нам.');
  }
  return ctx.reply(WELCOME(ctx.from?.first_name), { parse_mode: 'HTML', reply_markup: mainMenu() });
});
bot.command('menu', async (ctx) => { if (isPrivate(ctx)) { await setState(ctx.chat.id, null); return ctx.reply('Меню 👇', { reply_markup: mainMenu() }); } });

/* ======================= Каталог ======================= */
const PER = 8;
const CAT_ICON: Record<string, string> = { 'Макияж': '💄', 'Лицо': '🧴', 'Волосы': '💇‍♀️', 'Тело': '🛁', 'Парфюмерия': '🌸', 'Загар и SPF': '☀️', 'Сертификаты': '🎁' };
const price = (p: any) => Math.round(Number(p.price || 0) * (100 - (Number(p.discount_percent) || 0)) / 100);

async function categories() {
  const { data } = await sb.from('products').select('category').eq('active', true).gt('price', 0);
  const cnt: Record<string, number> = {};
  (data || []).forEach((r: any) => { const c = r.category || 'Другое'; cnt[c] = (cnt[c] || 0) + 1; });
  return Object.entries(cnt).sort((a, b) => b[1] - a[1]);
}
// код категории = её номер в алфавитном списке (короткий и стабильный)
async function catCodes() { return (await categories()).map(([c]) => c).sort((a, b) => a.localeCompare(b, 'ru')); }
async function catByCode(code: string) { return (await catCodes())[Number(code)] || ''; }
async function codeOf(cat: string) { return String((await catCodes()).indexOf(cat)); }
async function showCategories(ctx: any, edit = false) {
  const cats = await categories();
  const codes = await catCodes();
  const kb = new InlineKeyboard();
  cats.forEach(([c, n], i) => { kb.text(`${CAT_ICON[c] || '✨'} ${c} · ${n}`, `cat:${codes.indexOf(c)}:0`); if (i % 2) kb.row(); });
  kb.row().url('🌐 Весь каталог на сайте', utm(SITE + '#catalog', 'catalog'));
  const t = '🛍 <b>Каталог</b>\nВыберите категорию — или просто напишите название товара в чат.';
  return edit ? ctx.editMessageText(t, { parse_mode: 'HTML', reply_markup: kb }) : ctx.reply(t, { parse_mode: 'HTML', reply_markup: kb });
}
async function showList(ctx: any, cat: string, page: number, edit: boolean) {
  const cc = await codeOf(cat);
  const { data, count } = await sb.from('products').select('id,title,kind,price,discount_percent', { count: 'exact' })
    .eq('active', true).gt('price', 0).eq('category', cat).order('sort').order('id').range(page * PER, page * PER + PER - 1);
  const total = count || 0, pages = Math.max(1, Math.ceil(total / PER));
  const kb = new InlineKeyboard();
  (data || []).forEach((p: any) => kb.text(clip(`${p.kind ? p.kind + ' · ' : ''}${p.title}`, 40) + ` — ${money(price(p))}`, `p:${p.id}:${cc}:${page}`).row());
  if (pages > 1) {
    if (page > 0) kb.text('◀️', `cat:${cc}:${page - 1}`);
    kb.text(`${page + 1} / ${pages}`, 'noop');
    if (page < pages - 1) kb.text('▶️', `cat:${cc}:${page + 1}`);
    kb.row();
  }
  kb.text('🔙 Категории', 'cats');
  const t = `${CAT_ICON[cat] || '✨'} <b>${esc(cat)}</b> — ${total} товаров\nНажмите на товар, чтобы увидеть фото и подробности.`;
  return edit ? ctx.editMessageText(t, { parse_mode: 'HTML', reply_markup: kb }) : ctx.reply(t, { parse_mode: 'HTML', reply_markup: kb });
}
async function showProduct(ctx: any, id: number, back?: string) {
  const { data: p } = await sb.from('products').select('id,title,kind,category,volume,price,discount_percent,image,image_sm,description,stock').eq('id', id).maybeSingle();
  if (!p) return ctx.reply('Товар не найден.');
  const d = Number(p.discount_percent) || 0;
  const lines = [
    p.kind ? `<i>${esc(p.kind)}</i>` : '',
    `<b>${esc(p.title)}</b>${p.volume ? ' · ' + esc(p.volume) : ''}`,
    '',
    d ? `💰 <s>${money(p.price)}</s> <b>${money(price(p))}</b> (−${d}%)` : `💰 <b>${money(p.price)}</b>`,
    p.stock != null && Number(p.stock) <= 0 ? '⏳ Нет в наличии' : '✅ В наличии',
  ];
  if (p.description) lines.push('', esc(clip(String(p.description).replace(/\s+/g, ' '), 600)));
  const kb = new InlineKeyboard().url('🛒 Купить на сайте', utm(`${SITE}product.html?id=${p.id}`, 'product')).row()
    .text('❓ Спросить об этом товаре', `ask:${p.id}`);
  if (back) kb.row().text('🔙 К списку', back);
  const cap = lines.filter((x, i) => x || i > 1).join('\n');
  const img = p.image_sm || p.image;
  if (img && /^https:/.test(img)) {
    try { return await ctx.replyWithPhoto(img, { caption: cap, parse_mode: 'HTML', reply_markup: kb }); } catch (e) { console.error('product photo:', p.id, (e as any)?.description || String(e)); }
  }
  return ctx.reply(cap, { parse_mode: 'HTML', reply_markup: kb });
}

bot.hears(B.cat, (ctx) => isPrivate(ctx) ? showCategories(ctx) : undefined);
bot.callbackQuery('cats', async (ctx) => { await ctx.answerCallbackQuery(); try { await showCategories(ctx, true); } catch (_) { await showCategories(ctx); } });
bot.callbackQuery(/^cat:(\d+):(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const cat = await catByCode(ctx.match[1]), page = Number(ctx.match[2]);
  if (!cat) return showCategories(ctx);
  try { await showList(ctx, cat, page, true); } catch (_) { await showList(ctx, cat, page, false); }
});
bot.callbackQuery(/^p:(\d+)(?::(\d+):(\d+))?$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const back = ctx.match[2] ? `catn:${ctx.match[2]}:${ctx.match[3]}` : undefined;
  return showProduct(ctx, Number(ctx.match[1]), back);
});
bot.callbackQuery(/^catn:(\d+):(\d+)$/, async (ctx) => { await ctx.answerCallbackQuery(); const cat = await catByCode(ctx.match[1]); return cat ? showList(ctx, cat, Number(ctx.match[2]), false) : showCategories(ctx); });
bot.callbackQuery('noop', (ctx) => ctx.answerCallbackQuery());

/* ======================= Акции ======================= */
async function settings() {
  const { data } = await sb.from('site_settings').select('key,value');
  const s: Record<string, any> = {};
  (data || []).forEach((r: any) => (s[r.key] = r.value));
  return s;
}
async function showSale(ctx: any) {
  const s = await settings();
  const out: string[] = ['🔥 <b>Акции Luma Beauty</b>', ''];
  const bp = s.bulk_promo;
  if (bp?.active && (!bp.ends_at || new Date(bp.ends_at) > new Date())) {
    out.push('🛍 <b>Акция недели:</b> ' + (bp.tiers || []).map((t: any) => `${t.min}${t.min >= 3 ? ' и больше' : ''} товара — −${t.pct}%`).join(', ') + (bp.ends_at ? ` (до ${dmy(new Date(bp.ends_at))})` : ''));
  }
  if (s.welcome_offer?.active) out.push(`🎁 <b>Первый заказ:</b> приветственная скидка −${s.welcome_offer.pct}%`);
  const { data: np } = await sb.from('promos').select('code,percent,first_order_only').eq('code', 'NEW').eq('active', true).maybeSingle();
  if (np) out.push(`🎟 Промокод <code>NEW</code> — −${np.percent}% на первый заказ`);
  if (s.shop?.free_from) out.push(`🚚 Бесплатная доставка от ${money(s.shop.free_from)}`);
  if (s.shop?.gift_active && s.shop?.gift_from) out.push(`🎀 ${esc(s.shop.gift_text || 'Подарок')} при заказе от ${money(s.shop.gift_from)}`);
  out.push('💎 Кешбэк 1–3% с каждого заказа');
  // товары со скидкой, иначе — первые в витрине
  let { data: items } = await sb.from('products').select('id,title,kind,price,discount_percent,image,image_sm').eq('active', true).gt('price', 0).gt('discount_percent', 0).order('sort').limit(6);
  const discounted = !!items?.length;
  if (!discounted) ({ data: items } = await sb.from('products').select('id,title,kind,price,discount_percent,image,image_sm').eq('active', true).gt('price', 0).neq('category', 'Сертификаты').order('sort').limit(6));
  const media = (items || []).filter((p: any) => /^https:/.test(p.image_sm || p.image || '')).map((p: any) => ({ type: 'photo' as const, media: p.image_sm || p.image }));
  if (media.length >= 2) {
    (media[0] as any).caption = discounted ? '🔥 Сейчас со скидкой' : '✨ Популярное в Luma Beauty';
    try { await ctx.replyWithMediaGroup(media); } catch (e) { console.error('sale album:', (e as any)?.description || String(e)); }
  }
  const kb = new InlineKeyboard();
  (items || []).forEach((p: any) => kb.text(clip(p.title, 34) + ' — ' + money(price(p)), `p:${p.id}`).row());
  kb.url('🌐 Все акции на сайте', utm(SITE + 'offers.html', 'sale'));
  return ctx.reply(out.join('\n'), { parse_mode: 'HTML', reply_markup: kb, link_preview_options: { is_disabled: true } });
}
bot.hears(B.sale, (ctx) => isPrivate(ctx) ? showSale(ctx) : undefined);

/* ======================= Мои заказы ======================= */
bot.hears(B.orders, async (ctx) => {
  if (!isPrivate(ctx)) return;
  const { data } = await sb.from('orders').select('id,status,total,created_at,address').eq('tg_chat_id', ctx.chat.id).order('id', { ascending: false }).limit(5);
  const kb = new InlineKeyboard().url('🔎 Отследить заказ на сайте', utm(SITE + 'track.html', 'orders')).row().text('✍️ Вопрос по заказу', 'ask:order');
  if (!data?.length) {
    return ctx.reply('📦 Пока здесь нет заказов.\n\nЧтобы видеть статус в Telegram — после оформления заказа на сайте нажмите «Следить за статусом в Telegram». Или откройте страницу «Отследить заказ».', { reply_markup: kb });
  }
  const t = ['📦 <b>Ваши заказы</b>', ''].concat(data.map((o: any) => `<b>#${o.id}</b> · ${new Date(o.created_at).toLocaleDateString('ru-RU', { timeZone: 'Asia/Tashkent' })} · ${money(o.total)}\n${o.status === 'shipped' && isPickup(o) ? '🏬 Готов к выдаче' : LABEL[o.status] || esc(o.status)}`)).join('\n');
  return ctx.reply(t, { parse_mode: 'HTML', reply_markup: kb });
});

/* ======================= Вопросы ======================= */
async function FAQ(): Promise<Record<string, { t: string; a: string }>> {
  const s = await settings();
  const sh = s.shop || {};
  const deliv = `По Ташкенту — ${money(sh.delivery_tashkent || 39990)}, в регионы — ${money(sh.delivery_region || 35000)}. ${sh.free_from ? `От ${money(sh.free_from)} — бесплатно.` : ''}\nПо Ташкенту привозим обычно в день заказа или на следующий день, в регионы — 1–3 рабочих дня.\nСамовывоз бесплатно: Ташкент, Order Plaza.`;
  return {
    order: { t: '🛒 Как заказать', a: 'Добавьте товары в корзину на сайте, нажмите «Оформить заказ», войдите по номеру телефона, выберите доставку или самовывоз.\n\nИзменить или отменить заказ можно, пока он не передан в доставку — напишите нам и укажите номер заказа.' },
    deliv: { t: '🚚 Доставка', a: deliv },
    pay: { t: '💳 Оплата и кешбэк', a: 'Оплата — Payme или Click. Если удобнее другой способ, менеджер уточнит его при подтверждении заказа.\n\nКешбэк с каждого выполненного заказа: 1%, после 5 заказов — 2%, после 10 — 3%. Им можно оплатить до 50% следующей покупки.\n\nПромокод вводится в корзине. Скидки не суммируются — применяется самая выгодная.' },
    back: { t: '↩️ Возврат и обмен', a: 'Брак или не тот товар — напишите в течение 3 дней после получения (фото + номер заказа), заменим или вернём деньги, доставка за наш счёт.\n\nНевскрытый товар можно вернуть в течение 10 дней, если сохранены упаковка, плёнка и пломбы.\n\nВскрытую косметику и парфюмерию надлежащего качества вернуть нельзя — требование гигиены. Деньги возвращаем тем же способом за 3–10 рабочих дней.' },
    gift: { t: '🎁 Сертификаты', a: 'Сертификат выбирается на странице «Подарки». Код появляется в личном кабинете после оплаты, вводится при оформлении заказа. Тратить можно частями, действует 1 год.' },
    orig: { t: '✅ Оригинальность', a: 'Вся косметика оригинальная: работаем с проверенными поставщиками, у товаров актуальный срок годности.' },
    skin: { t: '🧪 Как подобрать уход', a: 'Пройдите тест кожи на сайте (1 минута) — или задайте вопрос здесь: опишите тип кожи и что хотите улучшить, подберём средства бесплатно.' },
  };
}
async function showFaq(ctx: any, edit = false) {
  const f = await FAQ();
  const kb = new InlineKeyboard();
  Object.entries(f).forEach(([k, v], i) => { kb.text(v.t, `faq:${k}`); if (i % 2) kb.row(); });
  kb.row().text('✍️ Задать свой вопрос', 'ask:0');
  const t = '❓ <b>Вопросы и ответы</b>\nВыберите тему — или задайте свой вопрос, менеджер ответит прямо здесь.';
  return edit ? ctx.editMessageText(t, { parse_mode: 'HTML', reply_markup: kb }) : ctx.reply(t, { parse_mode: 'HTML', reply_markup: kb });
}
bot.hears(B.faq, (ctx) => isPrivate(ctx) ? showFaq(ctx) : undefined);
bot.callbackQuery('faq', async (ctx) => { await ctx.answerCallbackQuery(); try { await showFaq(ctx, true); } catch (_) { await showFaq(ctx); } });
bot.callbackQuery(/^faq:(\w+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const f = (await FAQ())[ctx.match[1]];
  if (!f) return;
  const kb = new InlineKeyboard().text('✍️ Задать свой вопрос', 'ask:0').row().text('🔙 Все темы', 'faq');
  if (ctx.match[1] === 'skin') kb.row().url('🧪 Пройти тест кожи', utm(SITE + '#skinHelp', 'faq_skin'));
  try { await ctx.editMessageText(`<b>${f.t}</b>\n\n${esc(f.a)}`, { parse_mode: 'HTML', reply_markup: kb }); }
  catch (_) { await ctx.reply(`<b>${f.t}</b>\n\n${esc(f.a)}`, { parse_mode: 'HTML', reply_markup: kb }); }
});
bot.callbackQuery(/^ask:(\w+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!isPrivate(ctx)) return;
  const what = ctx.match[1];
  await setState(ctx.chat!.id, 'ask:' + what);
  let t = '✍️ Напишите ваш вопрос одним сообщением — можно с фото. Менеджер ответит здесь же.';
  if (/^\d+$/.test(what) && what !== '0') {
    const { data: p } = await sb.from('products').select('title').eq('id', Number(what)).maybeSingle();
    if (p) t = `✍️ Вопрос о товаре «${esc(p.title)}». Напишите его одним сообщением — менеджер ответит здесь же.`;
  }
  if (what === 'order') t = '✍️ Напишите номер заказа и ваш вопрос — менеджер ответит здесь же.';
  return ctx.reply(t, { reply_markup: new InlineKeyboard().text('Отмена', 'askno') });
});
bot.callbackQuery('askno', async (ctx) => { await ctx.answerCallbackQuery({ text: 'Отменено' }); await setState(ctx.chat!.id, null); try { await ctx.deleteMessage(); } catch (_) { /* */ } });

async function forwardQuestion(ctx: any, state: string) {
  const what = state.slice(4);
  const productId = /^\d+$/.test(what) && what !== '0' ? Number(what) : null;
  const text = String(ctx.message?.text || ctx.message?.caption || '').trim();
  const photo = ctx.message?.photo?.length ? ctx.message.photo[ctx.message.photo.length - 1].file_id : null;
  if (!text && !photo) return ctx.reply('Напишите вопрос текстом или пришлите фото с подписью.');
  let ptitle = '';
  if (productId) { const { data: p } = await sb.from('products').select('title,kind').eq('id', productId).maybeSingle(); ptitle = p ? `${p.kind ? p.kind + ' ' : ''}${p.title}` : ''; }
  const { data: q } = await sb.from('bot_questions').insert({ chat_id: ctx.chat.id, user_name: [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(' '), product_id: productId, text, photo }).select().single();
  const who = `${esc([ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(' ') || 'Покупатель')}${ctx.from?.username ? ' (@' + esc(ctx.from.username) + ')' : ''}`;
  const head = `❓ <b>ВОПРОС #${q?.id}</b> от ${who}` + (ptitle ? `\n🛍 Товар: ${esc(ptitle)} — <a href="${SITE}product.html?id=${productId}">открыть</a>` : '') + (what === 'order' ? '\n📦 Вопрос по заказу' : '');
  const body = `${head}\n\n${esc(text || '(фото)')}\n\n↩️ <i>Нажмите «Ответить» (Reply) на это сообщение — бот перешлёт ответ покупателю.</i>`;
  let sent: any;
  try {
    sent = photo ? await bot.api.sendPhoto(SHOP_CHAT, photo, { caption: clip(body, 1000), parse_mode: 'HTML' })
      : await bot.api.sendMessage(SHOP_CHAT, body, { parse_mode: 'HTML', link_preview_options: { is_disabled: true } });
  } catch (e) { console.error('question forward:', String(e)); }
  if (q && sent) await sb.from('bot_questions').update({ shop_msg_id: sent.message_id }).eq('id', q.id);
  await setState(ctx.chat.id, null);
  return ctx.reply('✅ Спасибо! Вопрос отправлен менеджеру — ответим здесь, обычно в течение дня.\nА если срочно — пишите @' + MANAGER + ' или звоните ' + PHONE + '.', { reply_markup: mainMenu() });
}

/* ======================= Подбор ухода и контакты ======================= */
bot.hears(B.skin, (ctx) => isPrivate(ctx) ? ctx.reply('🧪 <b>Подберём уход под вашу кожу</b>\n\nПройдите тест на сайте — 4 вопроса, 1 минута — и получите готовый набор: очищение, тонер, сыворотка, крем и SPF.\n\nИли опишите кожу здесь — менеджер подберёт бесплатно.', { parse_mode: 'HTML', reply_markup: new InlineKeyboard().url('🧪 Пройти тест кожи', utm(SITE + '#skinHelp', 'skin')).row().text('✍️ Подберите мне уход', 'ask:skin') }) : undefined);
bot.hears(B.contacts, (ctx) => isPrivate(ctx) ? ctx.reply(`📞 <b>Контакты Luma Beauty</b>\n\n☎️ ${PHONE}\n💬 Менеджер: @${MANAGER}\n📸 Instagram: @lumabeautyuz\n📣 Канал: @lumabeautyuzz\n🏬 Самовывоз: Ташкент, Order Plaza\n🌐 lumabeauty.uz`, { parse_mode: 'HTML', reply_markup: new InlineKeyboard().url('💬 Написать менеджеру', `https://t.me/${MANAGER}`).row().url('📸 Instagram', 'https://instagram.com/lumabeautyuz').url('📣 Канал', 'https://t.me/lumabeautyuzz').row().url('🌐 Сайт', utm(SITE, 'contacts')) }) : undefined);

/* ======================= Статусы заказов (магазин) ======================= */
function customerText(o: any, status: string) {
  const n = `#${o.id}`;
  switch (status) {
    case 'new': return `🛍 Ваш заказ <b>${n}</b> принят. Мы скоро свяжемся с вами.`;
    case 'paid': return `💳 Заказ <b>${n}</b> оплачен и готовится к отправке. Спасибо!`;
    case 'shipped': return isPickup(o) ? `🏬 Заказ <b>${n}</b> готов к выдаче. Ждём вас в точке самовывоза!` : `🚚 Заказ <b>${n}</b> передан курьеру. Скоро он будет у вас!`;
    case 'done': return `✅ Заказ <b>${n}</b> выполнен. Спасибо, что выбрали Luma Beauty 💖\nБудем рады вашему отзыву на сайте.`;
    case 'canceled': return `✖️ Заказ <b>${n}</b> отменён. Если это ошибка — напишите нам, мы поможем.`;
    default: return `Статус заказа <b>${n}</b>: ${esc(status)}`;
  }
}
function shopKeyboard(id: number | string, status: string) {
  const kb = new InlineKeyboard();
  const steps: [string, string][] = [['paid', '💳 Оплачен'], ['shipped', '🚚 Передан курьеру'], ['done', '✅ Выполнен']];
  const order = ['new', 'paid', 'shipped', 'done'];
  const cur = order.indexOf(status);
  if (status !== 'canceled') steps.filter(([s]) => order.indexOf(s) > cur).forEach(([s, t]) => kb.text(t, `st:${id}:${s}`));
  kb.row().url('📋 Открыть в админке', SITE + 'admin.html');
  return kb;
}
bot.callbackQuery(/^st:(\d+):(paid|shipped|done)$/, async (ctx) => {
  if (!isShop(ctx)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
  const id = Number(ctx.match[1]), st = ctx.match[2];
  const { data: o } = await sb.from('orders').select('id,status').eq('id', id).maybeSingle();
  if (!o) return ctx.answerCallbackQuery({ text: 'Заказ не найден' });
  if (o.status === 'canceled') return ctx.answerCallbackQuery({ text: 'Заказ отменён — меняйте статус в админке' });
  if (o.status !== st) {
    const { error } = await sb.from('orders').update({ status: st }).eq('id', id);
    if (error) return ctx.answerCallbackQuery({ text: 'Ошибка: ' + error.message.slice(0, 150) });
  }
  const who = ctx.from?.first_name ? ` (${ctx.from.first_name})` : '';
  try {
    const msg = ctx.callbackQuery.message as any;
    const base = msg?.text ? String(msg.text).replace(/\n\n📌 Статус:[\s\S]*$/, '') : '';
    if (base) await ctx.editMessageText(base + `\n\n📌 Статус: ${LABEL[st]}${who}`, { entities: msg.entities, reply_markup: shopKeyboard(id, st), link_preview_options: { is_disabled: true } });
    else await ctx.editMessageReplyMarkup({ reply_markup: shopKeyboard(id, st) });
  } catch (_) { /* не изменилось */ }
  return ctx.answerCallbackQuery({ text: `Заказ #${id}: ${LABEL[st]}` });
});

/* ======================= Рассылки (магазин) ======================= */
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => 'LB' + Array.from(crypto.getRandomValues(new Uint8Array(6))).map((b) => ABC[b % ABC.length]).join('');
const SHOP_HELP = `🛠 <b>Управление ботом</b>

📣 <b>Рассылки</b>
<b>/send текст</b> — рассылка всем подписчикам
<b>/promo 10 7 текст</b> — каждому свой промокод −10% на 7 дней
С фото: отправьте фото (или альбом до 10 фото) и в подписи напишите /send или /promo.
Или просто вставьте ссылку на товар с сайта: /send Новинка! https://lumabeauty.uz/product.html?id=279 — бот сам добавит фото, название и цену.

❓ <b>Вопросы покупателей</b> приходят сюда. Чтобы ответить — нажмите «Ответить» (Reply) на вопрос и напишите ответ (можно с фото).
<b>/questions</b> — вопросы без ответа

<b>/stats</b> — подписчики и статистика`;

async function audience() {
  const { count } = await sb.from('bot_users').select('chat_id', { count: 'exact', head: true }).eq('unsubscribed', false).neq('chat_id', Number(SHOP_CHAT) || 0);
  return count || 0;
}
function bcBody(b: any, code?: string, until?: Date) {
  let t = esc(b.text);
  if (b.promo_percent && code && until) t += `\n\n🎁 Ваш личный промокод: <code>${code}</code>\nСкидка <b>${b.promo_percent}%</b> до ${dmy(until)} — введите его при оформлении заказа.`;
  return t;
}
function custKb(id: number, productIds?: number[] | null) {
  const kb = new InlineKeyboard();
  if (productIds?.length === 1) kb.url('🛒 Купить', utm(`${SITE}product.html?id=${productIds[0]}`, 'b' + id)).row();
  else if (productIds && productIds.length > 1) productIds.slice(0, 4).forEach((pid, i) => { kb.url(`🛒 Товар ${i + 1}`, utm(`${SITE}product.html?id=${pid}`, 'b' + id)); if (i % 2) kb.row(); });
  if (productIds && productIds.length > 1) kb.row();
  return kb.url('🛍 Смотреть на сайте', utm(SITE, 'b' + id)).row().text('🔕 Отписаться от акций', 'unsub');
}
async function albumPhotos(group: string | null, fallback: string | null, urls?: string[] | null) {
  if (urls?.length) return urls.slice(0, 10);
  if (!group) return fallback ? [fallback] : [];
  const { data } = await sb.from('bot_albums').select('file_id,msg_id').eq('group_id', group).order('msg_id');
  const ids = (data || []).map((r: any) => r.file_id);
  return ids.length ? ids.slice(0, 10) : (fallback ? [fallback] : []);
}
async function sendPost(chat: number | string, photos: string[], text: string, kb: InlineKeyboard) {
  try { return await sendPostRaw(chat, photos, text, kb); }
  catch (e) {
    if (photos.length && /wrong|failed to get|file|image|photo/i.test(String((e as any)?.description || ''))) return sendPostRaw(chat, [], text, kb);
    throw e;
  }
}
async function sendPostRaw(chat: number | string, photos: string[], text: string, kb: InlineKeyboard) {
  if (photos.length > 1) {
    const media = photos.map((p, i) => ({ type: 'photo' as const, media: p, ...(i === 0 ? { caption: text, parse_mode: 'HTML' as const } : {}) }));
    await bot.api.sendMediaGroup(chat, media);
    return bot.api.sendMessage(chat, '👇', { reply_markup: kb });
  }
  if (photos.length === 1) return bot.api.sendPhoto(chat, photos[0], { caption: text, parse_mode: 'HTML', reply_markup: kb });
  return bot.api.sendMessage(chat, text, { parse_mode: 'HTML', reply_markup: kb, link_preview_options: { is_disabled: true } });
}

async function draft(ctx: any, isPromo: boolean) {
  if (!isShop(ctx)) return;
  const raw = String(ctx.match || '').trim();
  let pct: number | null = null, days: number | null = null, text = raw;
  if (isPromo) {
    const m = raw.match(/^(\d{1,2})\s+(\d{1,3})\s+([\s\S]+)$/);
    if (!m) return ctx.reply('Формат: /promo ПРОЦЕНТ ДНЕЙ текст\nНапример: /promo 10 7 Вернитесь — для вас скидка!');
    pct = Number(m[1]); days = Number(m[2]); text = m[3].trim();
    if (pct < 1 || pct > 50) return ctx.reply('Процент — от 1 до 50.');
    if (days < 1 || days > 90) return ctx.reply('Срок — от 1 до 90 дней.');
  }
  if (!text) return ctx.reply(SHOP_HELP, { parse_mode: 'HTML' });
  if (text.length > 850) return ctx.reply('Текст слишком длинный (максимум 850 символов).');
  const photo = ctx.message?.photo?.length ? ctx.message.photo[ctx.message.photo.length - 1].file_id : null;
  const group = ctx.message?.media_group_id || null;
  // ссылки на товары сайта → фото и цена товара в рассылке
  const ids = [...new Set([...text.matchAll(/product\.html\?id=(\d+)/g)].map((m) => Number(m[1])))].slice(0, 10);
  let urls: string[] = [];
  if (ids.length) {
    const { data: ps } = await sb.from('products').select('id,title,kind,price,discount_percent,image,image_sm').in('id', ids);
    const items = ids.map((i) => (ps || []).find((p: any) => p.id === i)).filter(Boolean) as any[];
    text = text.replace(/https?:\/\/\S*product\.html\?id=\d+\S*/g, '').replace(/[ \t]+\n/g, '\n').trim();
    const list = items.map((p) => `🛍 ${p.kind ? p.kind + ' · ' : ''}${p.title}\n💰 ${Number(p.discount_percent) ? money(p.price) + ' → ' : ''}${money(price(p))}`).join('\n\n');
    text = (text ? text + '\n\n' : '') + list;
    if (!photo && !group) urls = items.map((p) => p.image || p.image_sm).filter((u: string) => /^https:/.test(u || ''));
  }
  const { data: b, error } = await sb.from('bot_broadcasts').insert({ text, photo, media_group: group, photos: urls.length ? urls : null, product_ids: ids.length ? ids : null, promo_percent: pct, promo_days: days, created_by: ctx.from?.first_name ?? null }).select().single();
  if (error) return ctx.reply('Ошибка: ' + error.message);
  if (group) await new Promise((r) => setTimeout(r, 3000)); // ждём остальные фото альбома
  const photos = await albumPhotos(group, photo, b.photos);
  const n = await audience();
  const until = days ? new Date(Date.now() + days * 864e5) : undefined;
  await ctx.reply(`👁 <b>Предпросмотр рассылки #${b.id}</b>${photos.length ? ` · фото: ${photos.length}` : ''}${pct ? ` · промокод −${pct}% на ${days} дн.` : ''}`, { parse_mode: 'HTML' });
  await sendPost(ctx.chat.id, photos, bcBody(b, pct ? 'LBXXXXXX' : undefined, until), custKb(b.id, b.product_ids));
  return ctx.reply(`Отправить ${n} подписчикам?`, { reply_markup: new InlineKeyboard().text(`✅ Отправить (${n} чел.)`, `bc:${b.id}:go`).text('✖️ Отмена', `bc:${b.id}:no`) });
}
// фото альбома без подписи — запоминаем, чтобы собрать альбом для рассылки
bot.on('message:photo', async (ctx, next) => {
  if (isShop(ctx) && ctx.message.media_group_id) {
    const p = ctx.message.photo[ctx.message.photo.length - 1];
    await sb.from('bot_albums').upsert({ group_id: ctx.message.media_group_id, file_id: p.file_id, msg_id: ctx.message.message_id }, { onConflict: 'group_id,msg_id' });
  }
  return next();
});
bot.command('send', (ctx) => draft(ctx, false));
bot.command('promo', (ctx) => draft(ctx, true));
bot.command(['help', 'admin'], (ctx) => isShop(ctx) ? ctx.reply(SHOP_HELP, { parse_mode: 'HTML' }) : (isPrivate(ctx) ? ctx.reply(WELCOME(ctx.from?.first_name), { parse_mode: 'HTML', reply_markup: mainMenu() }) : undefined));
bot.command('stats', async (ctx) => {
  if (!isShop(ctx)) return;
  const n = await audience();
  const { count: all } = await sb.from('bot_users').select('chat_id', { count: 'exact', head: true });
  const { count: q } = await sb.from('bot_questions').select('id', { count: 'exact', head: true }).is('answered_at', null);
  const { data: last } = await sb.from('bot_broadcasts').select('id,sent,failed,sent_at,promo_percent').eq('status', 'sent').order('id', { ascending: false }).limit(3);
  const t = [`👥 Пользователей бота: <b>${all || 0}</b>`, `📣 Получат рассылку: <b>${n}</b>`, `❓ Вопросов без ответа: <b>${q || 0}</b>`];
  if (last?.length) t.push('', 'Последние рассылки:', ...last.map((b: any) => `#${b.id} · ${b.sent_at ? dmy(new Date(b.sent_at)) : ''} · доставлено ${b.sent}${b.promo_percent ? ` · промокоды −${b.promo_percent}%` : ''}`));
  return ctx.reply(t.join('\n'), { parse_mode: 'HTML' });
});
bot.command('questions', async (ctx) => {
  if (!isShop(ctx)) return;
  const { data } = await sb.from('bot_questions').select('id,user_name,text,created_at').is('answered_at', null).order('id', { ascending: false }).limit(10);
  if (!data?.length) return ctx.reply('✅ Все вопросы отвечены.');
  return ctx.reply('❓ <b>Без ответа:</b>\n\n' + data.map((q: any) => `#${q.id} · ${esc(q.user_name || '')}: ${esc(clip(q.text || '(фото)', 120))}`).join('\n') + '\n\nОтветьте (Reply) на исходное сообщение вопроса выше в чате.', { parse_mode: 'HTML' });
});

async function runBroadcast(id: number, done: (t: string) => Promise<unknown>) {
  const { data: b } = await sb.from('bot_broadcasts').select('*').eq('id', id).single();
  const photos = await albumPhotos(b.media_group, b.photo, b.photos);
  const { data: users } = await sb.from('bot_users').select('chat_id').eq('unsubscribed', false);
  let ok = 0, bad = 0;
  for (const u of users || []) {
    if (String(u.chat_id) === SHOP_CHAT) continue;
    try {
      let code: string | undefined, until: Date | undefined;
      if (b.promo_percent) {
        until = new Date(Date.now() + b.promo_days * 864e5);
        for (let k = 0; k < 3 && !code; k++) {
          const c = genCode();
          const { error } = await sb.from('promos').insert({ code: c, percent: b.promo_percent, active: true, first_order_only: false, expires_at: until.toISOString(), max_uses: 1, source: `bot:b${id}:${u.chat_id}` });
          if (!error) code = c;
        }
        if (!code) throw new Error('promo');
      }
      await sendPost(u.chat_id, photos, bcBody(b, code, until), custKb(id, b.product_ids));
      ok++;
    } catch (e) {
      bad++;
      if (/blocked|deactivated|chat not found/i.test(String((e as any)?.description || ''))) await sb.from('bot_users').update({ unsubscribed: true }).eq('chat_id', u.chat_id);
    }
    await new Promise((r) => setTimeout(r, photos.length > 1 ? 400 : 80));
  }
  await sb.from('bot_broadcasts').update({ status: 'sent', sent: ok, failed: bad, sent_at: new Date().toISOString() }).eq('id', id);
  await done(`📣 Рассылка #${id} отправлена: ✅ ${ok}${bad ? ` · не доставлено ${bad}` : ''}` + (b.promo_percent ? `\nПромокоды: ${ok} шт., −${b.promo_percent}%, ${b.promo_days} дн. Использования видны в заказах (поле «промокод»).` : '') + `\nПереходы — в Метрике, метка utm_campaign=b${id}.`);
}
bot.callbackQuery(/^bc:(\d+):(go|no)$/, async (ctx) => {
  if (!isShop(ctx)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
  const id = Number(ctx.match[1]);
  if (ctx.match[2] === 'no') {
    await sb.from('bot_broadcasts').update({ status: 'canceled' }).eq('id', id).eq('status', 'draft');
    try { await ctx.editMessageText('✖️ Рассылка отменена.'); } catch (_) { /* */ }
    return ctx.answerCallbackQuery({ text: 'Отменено' });
  }
  const { data: rows } = await sb.from('bot_broadcasts').update({ status: 'sending', recipients: await audience() }).eq('id', id).eq('status', 'draft').select('id');
  if (!rows?.length) return ctx.answerCallbackQuery({ text: 'Уже отправлено или отменено' });
  try { await ctx.editMessageText('⏳ Отправляю…'); } catch (_) { /* */ }
  await ctx.answerCallbackQuery({ text: 'Отправляю…' });
  const chat = ctx.chat!.id;
  const job = runBroadcast(id, (t) => bot.api.sendMessage(chat, t)).catch((e) => console.error('broadcast error:', String(e)));
  // @ts-ignore EdgeRuntime есть в Supabase
  if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(job); else await job;
});
bot.callbackQuery('unsub', async (ctx) => {
  if (isPrivate(ctx)) await sb.from('bot_users').upsert({ chat_id: ctx.chat!.id, unsubscribed: true }, { onConflict: 'chat_id' });
  await ctx.answerCallbackQuery({ text: 'Вы отписались от акций' });
  return ctx.reply('🔕 Вы отписались от акций. Статусы заказов и ответы на вопросы будут приходить как раньше. Чтобы снова получать скидки — /start.');
});
bot.command('stop', async (ctx) => {
  if (!isPrivate(ctx)) return;
  await sb.from('bot_users').upsert({ chat_id: ctx.chat.id, unsubscribed: true }, { onConflict: 'chat_id' });
  return ctx.reply('🔕 Вы отписались от акций.');
});

/* ======================= Ответы магазина и свободный текст ======================= */
bot.on('message', async (ctx) => {
  // магазин отвечает на вопрос через Reply
  if (isShop(ctx)) {
    const r = ctx.message.reply_to_message;
    if (!r) return;
    const { data: q } = await sb.from('bot_questions').select('id,chat_id').eq('shop_msg_id', r.message_id).maybeSingle();
    if (!q) return;
    try {
      await bot.api.sendMessage(q.chat_id, `💬 <b>Ответ Luma Beauty</b> на ваш вопрос:`, { parse_mode: 'HTML' });
      await bot.api.copyMessage(q.chat_id, ctx.chat.id, ctx.message.message_id, { reply_markup: new InlineKeyboard().text('✍️ Задать ещё вопрос', 'ask:0').url('🛍 Сайт', utm(SITE, 'answer')) });
      await sb.from('bot_questions').update({ answered_at: new Date().toISOString() }).eq('id', q.id);
      return ctx.reply(`✅ Ответ на вопрос #${q.id} отправлен покупателю.`, { reply_parameters: { message_id: ctx.message.message_id } });
    } catch (e) {
      return ctx.reply('Не удалось отправить: покупатель мог заблокировать бота.');
    }
  }
  if (!isPrivate(ctx)) return;
  await remember(ctx);
  const st = await getState(ctx.chat.id);
  if (st?.startsWith('ask:')) return forwardQuestion(ctx, st);
  const text = String(ctx.message.text || '').trim();
  if (!text) return ctx.reply('Чтобы задать вопрос с фото — нажмите «❓ Вопросы» → «Задать свой вопрос».', { reply_markup: mainMenu() });
  // поиск товара по названию
  const words = text.replace(/[%_,().:"'*\\]/g, ' ').split(/\s+/).filter((w) => w.length > 1).slice(0, 4);
  let q = sb.from('products').select('id,title,kind,price,discount_percent').eq('active', true).gt('price', 0);
  words.forEach((w) => { q = q.or(`title.ilike.%${w}%,kind.ilike.%${w}%`); });
  const { data } = words.length ? await q.limit(8) : { data: [] as any[] };
  const kb = new InlineKeyboard();
  if (data?.length) {
    data.forEach((p: any) => kb.text(clip(`${p.kind ? p.kind + ' · ' : ''}${p.title}`, 40) + ' — ' + money(price(p)), `p:${p.id}`).row());
    kb.text('✍️ Не нашли? Спросите нас', 'ask:0');
    return ctx.reply(`🔎 Нашли по запросу «${esc(clip(text, 40))}»:`, { parse_mode: 'HTML', reply_markup: kb });
  }
  kb.text('✍️ Задать вопрос менеджеру', 'ask:0').row().text('🛍 Открыть каталог', 'cats');
  return ctx.reply(`Ничего не нашли по «${esc(clip(text, 40))}». Задайте вопрос — менеджер ответит, или посмотрите каталог.`, { parse_mode: 'HTML', reply_markup: kb });
});

// логируем только текст ошибки — без контекста, в котором есть токен бота
bot.catch((e) => console.error('bot error:', (e.error as Error)?.message || String(e.error)));
const HOOK = await hookSecret();
const handle = webhookCallback(bot, 'std/http', { secretToken: HOOK });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  if (req.headers.has('x-order-secret')) {
    if (!SECRET || req.headers.get('x-order-secret') !== SECRET) return new Response('Unauthorized', { status: 401 });
    const b = await req.json().catch(() => ({}));
    if (b.action === 'info') {
      const [me, wh] = await Promise.all([bot.api.getMe(), bot.api.getWebhookInfo()]);
      const chat = await bot.api.getChat(SHOP_CHAT).catch(() => null);
      return Response.json({ username: me.username, webhook: wh.url, pending: wh.pending_update_count, last_error: wh.last_error_message || null, shop_chat_type: chat?.type || null });
    }
    if (b.action === 'setup') {
      const ok = await bot.api.setWebhook(URL_SELF, { secret_token: HOOK, allowed_updates: ['message', 'callback_query'] });
      await bot.api.setMyCommands([{ command: 'start', description: 'Главное меню' }, { command: 'menu', description: 'Показать меню' }, { command: 'stop', description: 'Отписаться от акций' }]);
      if (SHOP_CHAT) await bot.api.setMyCommands([
        { command: 'send', description: 'Рассылка всем подписчикам' }, { command: 'promo', description: 'Рассылка с личными промокодами' },
        { command: 'questions', description: 'Вопросы без ответа' }, { command: 'stats', description: 'Статистика' }, { command: 'help', description: 'Справка' },
      ], { scope: { type: 'chat', chat_id: Number(SHOP_CHAT) } });
      await bot.api.setMyDescription('Luma Beauty — оригинальная косметика с доставкой по Узбекистану. Каталог с фото, акции, статусы заказов и ответы на вопросы.');
      await bot.api.setMyShortDescription('Каталог, акции, статусы заказов и вопросы — Luma Beauty 💄');
      const me = await bot.api.getMe();
      return Response.json({ ok, username: me.username });
    }
    if (b.type === 'status' && b.id) {
      const { data: o } = await sb.from('orders').select('id,status,address,tg_chat_id').eq('id', b.id).maybeSingle();
      if (!o?.tg_chat_id) return Response.json({ skipped: true });
      try { await bot.api.sendMessage(o.tg_chat_id, customerText(o, o.status), { parse_mode: 'HTML' }); }
      catch (e) { return Response.json({ ok: false, error: String(e) }); }
      return Response.json({ ok: true });
    }
    return new Response('bad request', { status: 400 });
  }
  return handle(req);
});
