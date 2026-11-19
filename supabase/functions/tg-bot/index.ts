// Luma Beauty — Telegram-бот статусов заказов (grammY)
// • вебхук Telegram: /start o<id>_<token> — покупатель подписывается на статус заказа;
//   кнопки st:<id>:<status> в чате магазина — смена статуса заказа
// • внутренние вызовы из базы (x-order-secret): type=status — уведомить покупателя; action=info|setup
import { Bot, InlineKeyboard, webhookCallback } from 'npm:grammy@1.30.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const TOKEN = (Deno.env.get('TELEGRAM_BOT_TOKEN') || '').trim();
const SHOP_CHAT = String(Deno.env.get('TELEGRAM_CHAT_ID') || '').trim();
const SECRET = Deno.env.get('ORDER_WEBHOOK_SECRET') || '';
const URL_SELF = `${Deno.env.get('SUPABASE_URL')}/functions/v1/tg-bot`;
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

async function hookSecret() {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(SECRET + ':tg-webhook'));
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 48);
}

const LABEL: Record<string, string> = { new: '🆕 Новый', paid: '💳 Оплачен', shipped: '🚚 Передан курьеру', done: '✅ Выполнен', canceled: '✖️ Отменён' };
const esc = (x: unknown) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// deno-lint-ignore no-explicit-any
const isPickup = (o: any) => /^Самовывоз/i.test(String(o.address || ''));

// deno-lint-ignore no-explicit-any
function customerText(o: any, status: string) {
  const n = `#${o.id}`;
  switch (status) {
    case 'new': return `🛍 Ваш заказ <b>${n}</b> принят. Мы скоро свяжемся с вами.`;
    case 'paid': return `💳 Заказ <b>${n}</b> оплачен и готовится к отправке. Спасибо!`;
    case 'shipped': return isPickup(o)
      ? `🏬 Заказ <b>${n}</b> готов к выдаче. Ждём вас в точке самовывоза!`
      : `🚚 Заказ <b>${n}</b> передан курьеру. Скоро он будет у вас!`;
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
  kb.row().url('📋 Открыть в админке', 'https://lumabeauty.uz/admin.html');
  return kb;
}

const bot = new Bot(TOKEN);

async function remember(ctx: any) {
  if (ctx.chat?.type !== 'private') return;
  await sb.from('bot_users').upsert({ chat_id: ctx.chat.id, first_name: ctx.from?.first_name ?? null, username: ctx.from?.username ?? null, last_seen: new Date().toISOString(), unsubscribed: false }, { onConflict: 'chat_id' });
}

bot.command('start', async (ctx) => {
  if (ctx.chat?.type !== 'private') return;
  await remember(ctx);
  const arg = String(ctx.match || '').trim();
  const m = arg.match(/^o(\d+)_([a-f0-9]{6,32})$/);
  if (!m) {
    if (isShop(ctx)) return ctx.reply(HELP, { parse_mode: 'HTML' });
    return ctx.reply('Здравствуйте! Это бот Luma Beauty 💄\nЧтобы получать статус заказа, нажмите «Следить за заказом в Telegram» после оформления на сайте lumabeauty.uz или на странице «Отследить заказ».');
  }
  const id = Number(m[1]);
  const { data: o } = await sb.from('orders').select('id,status,address,tg_token').eq('id', id).maybeSingle();
  if (!o || o.tg_token !== m[2]) return ctx.reply('Не нашли такой заказ. Проверьте ссылку или напишите нам.');
  await sb.from('orders').update({ tg_chat_id: ctx.chat.id }).eq('id', id);
  await ctx.reply(`🔔 Готово! Будем присылать сюда статус заказа <b>#${id}</b>.\nСейчас: <b>${LABEL[o.status] || esc(o.status)}</b>`, { parse_mode: 'HTML' });
});

bot.callbackQuery(/^st:(\d+):(paid|shipped|done)$/, async (ctx) => {
  if (String(ctx.chat?.id) !== SHOP_CHAT) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
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
    // deno-lint-ignore no-explicit-any
    const msg = ctx.callbackQuery.message as any;
    const base = msg?.text ? String(msg.text).replace(/\n\n📌 Статус:[\s\S]*$/, '') : '';
    if (base) await ctx.editMessageText(base + `\n\n📌 Статус: ${LABEL[st]}${who}`, { entities: msg.entities, reply_markup: shopKeyboard(id, st), link_preview_options: { is_disabled: true } });
    else await ctx.editMessageReplyMarkup({ reply_markup: shopKeyboard(id, st) });
  } catch (_) { /* сообщение не изменилось — не страшно */ }
  return ctx.answerCallbackQuery({ text: `Заказ #${id}: ${LABEL[st]}` });
});

/* ---------------- Рассылки (только из чата магазина) ---------------- */
const isShop = (ctx: any) => String(ctx.chat?.id) === SHOP_CHAT;
const SITE = 'https://lumabeauty.uz/';
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => 'LB' + Array.from(crypto.getRandomValues(new Uint8Array(6))).map((b) => ABC[b % ABC.length]).join('');
const dmy = (d: Date) => d.toLocaleDateString('ru-RU', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit' });

const HELP = `📣 <b>Рассылка покупателям</b>

<b>/send текст</b> — обычная рассылка
<b>/promo 10 7 текст</b> — каждому свой промокод на −10%, действует 7 дней, одно использование
<b>/stats</b> — сколько подписчиков

Чтобы добавить фото — отправьте фото с подписью, которая начинается с /send или /promo.
Перед отправкой бот покажет предпросмотр и спросит подтверждение.`;

async function audience() {
  const { count } = await sb.from('bot_users').select('chat_id', { count: 'exact', head: true }).eq('unsubscribed', false);
  return count || 0;
}

function body(b: any, code?: string, until?: Date) {
  let t = esc(b.text);
  if (b.promo_percent && code && until) t += `\n\n🎁 Ваш личный промокод: <code>${code}</code>\nСкидка <b>${b.promo_percent}%</b> до ${dmy(until)} — введите его при оформлении заказа.`;
  return t;
}
function custKb(id: number) {
  return new InlineKeyboard().url('🛍 Смотреть на сайте', `${SITE}?utm_source=telegram&utm_medium=bot&utm_campaign=b${id}`).row().text('🔕 Отписаться от акций', 'unsub');
}

async function draft(ctx: any, isPromo: boolean) {
  if (!isShop(ctx)) return;
  const raw = String(ctx.match || '').trim();
  let pct: number | null = null, days: number | null = null, text = raw;
  if (isPromo) {
    const m = raw.match(/^(\d{1,2})\s+(\d{1,3})\s+([\s\S]+)$/);
    if (!m) return ctx.reply('Формат: /promo ПРОЦЕНТ ДНЕЙ текст\nНапример: /promo 10 7 Вернитесь — для вас скидка!');
    pct = Number(m[1]); days = Number(m[2]); text = m[3].trim();
    if (pct < 1 || pct > 50) return ctx.reply('Процент должен быть от 1 до 50.');
    if (days < 1 || days > 90) return ctx.reply('Срок — от 1 до 90 дней.');
  }
  if (!text) return ctx.reply(HELP, { parse_mode: 'HTML' });
  if (text.length > 900) return ctx.reply('Текст слишком длинный (максимум 900 символов).');
  const photo = ctx.message?.photo?.length ? ctx.message.photo[ctx.message.photo.length - 1].file_id : null;
  const { data: b, error } = await sb.from('bot_broadcasts').insert({ text, photo, promo_percent: pct, promo_days: days, created_by: ctx.from?.first_name ?? null }).select().single();
  if (error) return ctx.reply('Ошибка: ' + error.message);
  const n = await audience();
  const sampleUntil = days ? new Date(Date.now() + days * 864e5) : undefined;
  const preview = '👁 <b>Предпросмотр</b>\n\n' + body(b, pct ? 'LBXXXXXX' : undefined, sampleUntil);
  const kb = new InlineKeyboard().text(`✅ Отправить (${n} чел.)`, `bc:${b.id}:go`).text('✖️ Отмена', `bc:${b.id}:no`);
  if (photo) await ctx.replyWithPhoto(photo, { caption: preview, parse_mode: 'HTML', reply_markup: kb });
  else await ctx.reply(preview, { parse_mode: 'HTML', reply_markup: kb, link_preview_options: { is_disabled: true } });
}

bot.command('send', (ctx) => draft(ctx, false));
bot.command('promo', (ctx) => draft(ctx, true));
bot.command(['help', 'rassylka'], (ctx) => isShop(ctx) ? ctx.reply(HELP, { parse_mode: 'HTML' }) : undefined);
bot.command('stats', async (ctx) => {
  if (!isShop(ctx)) return;
  const n = await audience();
  const { count: all } = await sb.from('bot_users').select('chat_id', { count: 'exact', head: true });
  return ctx.reply(`👥 Подписчиков бота: <b>${all || 0}</b>\n📣 Получат рассылку: <b>${n}</b> (остальные отписались)`, { parse_mode: 'HTML' });
});

async function runBroadcast(id: number, done: (t: string) => Promise<unknown>) {
  const { data: b } = await sb.from('bot_broadcasts').select('*').eq('id', id).single();
  const { data: users } = await sb.from('bot_users').select('chat_id').eq('unsubscribed', false);
  let ok = 0, bad = 0;
  for (const u of users || []) {
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
      const t = body(b, code, until);
      if (b.photo) await bot.api.sendPhoto(u.chat_id, b.photo, { caption: t, parse_mode: 'HTML', reply_markup: custKb(id) });
      else await bot.api.sendMessage(u.chat_id, t, { parse_mode: 'HTML', reply_markup: custKb(id), link_preview_options: { is_disabled: true } });
      ok++;
    } catch (e) {
      bad++;
      const d = String((e as any)?.description || '');
      if (/blocked|deactivated|chat not found/i.test(d)) await sb.from('bot_users').update({ unsubscribed: true }).eq('chat_id', u.chat_id);
    }
    await new Promise((r) => setTimeout(r, 60)); // не больше ~15 сообщений в секунду
  }
  await sb.from('bot_broadcasts').update({ status: 'sent', sent: ok, failed: bad, sent_at: new Date().toISOString() }).eq('id', id);
  await done(`📣 Рассылка #${id} отправлена: ✅ ${ok}${bad ? ` · не доставлено ${bad}` : ''}` + (b.promo_percent ? `\nПромокоды: ${ok} шт., −${b.promo_percent}%, ${b.promo_days} дн. Использования видны в заказах (поле «промокод»).` : '') + `\nПереходы — в Метрике: метка utm_campaign=b${id}.`);
}

bot.callbackQuery(/^bc:(\d+):(go|no)$/, async (ctx) => {
  if (!isShop(ctx)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
  const id = Number(ctx.match[1]);
  if (ctx.match[2] === 'no') {
    await sb.from('bot_broadcasts').update({ status: 'canceled' }).eq('id', id).eq('status', 'draft');
    try { await ctx.editMessageReplyMarkup({ reply_markup: undefined }); } catch (_) { /* */ }
    return ctx.answerCallbackQuery({ text: 'Рассылка отменена' });
  }
  // атомарно: отправить можно только один раз (даже если Telegram повторит запрос)
  const { data: rows } = await sb.from('bot_broadcasts').update({ status: 'sending', recipients: await audience() }).eq('id', id).eq('status', 'draft').select('id');
  if (!rows?.length) return ctx.answerCallbackQuery({ text: 'Уже отправлено или отменено' });
  try { await ctx.editMessageReplyMarkup({ reply_markup: undefined }); } catch (_) { /* */ }
  await ctx.answerCallbackQuery({ text: 'Отправляю…' });
  const chat = ctx.chat!.id;
  const job = runBroadcast(id, (t) => bot.api.sendMessage(chat, t)).catch((e) => console.error('broadcast error:', String(e)));
  // @ts-ignore EdgeRuntime есть в Supabase
  if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(job); else await job;
});

bot.callbackQuery('unsub', async (ctx) => {
  if (ctx.chat?.type === 'private') await sb.from('bot_users').upsert({ chat_id: ctx.chat.id, unsubscribed: true }, { onConflict: 'chat_id' });
  try { await ctx.editMessageReplyMarkup({ reply_markup: new InlineKeyboard().url('🛍 Смотреть на сайте', SITE) }); } catch (_) { /* */ }
  await ctx.answerCallbackQuery({ text: 'Вы отписались от акций' });
  return ctx.reply('🔕 Вы отписались от акций. Статусы ваших заказов будут приходить как раньше. Чтобы снова получать скидки — отправьте /start.');
});
bot.command('stop', async (ctx) => {
  if (ctx.chat?.type !== 'private') return;
  await sb.from('bot_users').upsert({ chat_id: ctx.chat.id, unsubscribed: true }, { onConflict: 'chat_id' });
  return ctx.reply('🔕 Вы отписались от акций.');
});

// логируем только текст ошибки — без контекста, в котором есть токен бота
bot.catch((e) => console.error('bot error:', (e.error as Error)?.message || String(e.error)));
const HOOK = await hookSecret();
const handle = webhookCallback(bot, 'std/http', { secretToken: HOOK });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');
  // внутренние вызовы из базы
  if (req.headers.has('x-order-secret')) {
    if (!SECRET || req.headers.get('x-order-secret') !== SECRET) return new Response('Unauthorized', { status: 401 });
    const b = await req.json().catch(() => ({}));
    if (b.action === 'info') {
      const [me, wh] = await Promise.all([bot.api.getMe(), bot.api.getWebhookInfo()]);
      const chat = await bot.api.getChat(SHOP_CHAT).catch(() => null);
      return Response.json({ username: me.username, webhook: wh.url, pending: wh.pending_update_count, last_error: wh.last_error_message || null, shop_chat_type: chat?.type || null, privacy: !me.can_read_all_group_messages });
    }
    if (b.action === 'setup') {
      const ok = await bot.api.setWebhook(URL_SELF, { secret_token: HOOK, allowed_updates: ['message', 'callback_query'] });
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
  // вебхук Telegram (grammY сам проверяет secret token)
  return handle(req);
});
