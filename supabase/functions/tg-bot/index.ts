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

bot.command('start', async (ctx) => {
  if (ctx.chat?.type !== 'private') return;
  const arg = String(ctx.match || '').trim();
  const m = arg.match(/^o(\d+)_([a-f0-9]{6,32})$/);
  if (!m) {
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
      return Response.json({ username: me.username, webhook: wh.url, pending: wh.pending_update_count, last_error: wh.last_error_message || null });
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
