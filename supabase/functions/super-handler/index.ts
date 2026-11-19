import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { buildInvoice } from "./invoice.ts";

// Accepts calls only from the database triggers (they send the shared x-order-secret header).
const esc = (x: unknown) => String(x ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const num = (n: unknown) => Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const money = (n: unknown) => num(n) + " сум";
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const PAY: Record<string, string> = { payme: "Payme", click: "Click", cash: "Наличными", card: "Картой" };

// deno-lint-ignore no-explicit-any
function buildOrder(r: any) {
  const items = Array.isArray(r.items) ? r.items : [];
  const when = r.created_at ? new Date(r.created_at) : new Date();
  const time = when.toLocaleString("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const out = [];
  out.push(`🛍 <b>НОВЫЙ ЗАКАЗ #${esc(r.id)}</b>`);
  out.push(`🕒 ${esc(time)}`);
  out.push("");
  out.push(`👤 <b>${esc(clip(String(r.customer_name || "Без имени"), 80))}</b>`);
  if (r.phone) out.push(`📞 ${esc(r.phone)}`);
  out.push("");
  out.push(`📦 <b>Состав заказа</b> (${items.reduce((s: number, i: any) => s + (Number(i.qty) || 0), 0)} шт.)`);
  let sub = 0;
  items.slice(0, 40).forEach((it: any, n: number) => {
    const q = Number(it.qty) || 0, p = Number(it.price) || 0;
    sub += q * p;
    const disc = Number(it.discount_percent) > 0 ? `  <i>−${Number(it.discount_percent)}%</i>` : "";
    out.push(`${n + 1}. ${esc(clip(String(it.title || "Товар #" + it.id), 120))}`);
    out.push(`    ${q} шт × ${num(p)} = <b>${money(q * p)}</b>${disc}`);
  });
  if (items.length > 40) out.push(`… и ещё ${items.length - 40} позиций`);
  out.push("");
  const addr = String(r.address || "").split("\n").map((s: string) => s.trim()).filter(Boolean);
  const link = addr.find((s: string) => /^https?:\/\//.test(s));
  const lines = addr.filter((s: string) => s !== link);
  let head = "🚚 <b>Доставка</b>", first = lines[0] || "";
  const m = first.match(/^(Самовывоз|Доставка):\s*(.*)$/);
  if (m) { head = m[1] === "Самовывоз" ? "🏬 <b>Самовывоз</b>" : "🚚 <b>Доставка</b>"; lines[0] = m[2]; }
  out.push(head);
  lines.filter(Boolean).forEach((l: string) => out.push(esc(clip(l, 300))));
  if (link) out.push(`📍 <a href="${esc(link)}">Открыть на карте</a>`);
  out.push("");
  out.push(`💳 Оплата: <b>${esc(PAY[String(r.payment || "").toLowerCase()] || r.payment || "не указана")}</b>`);
  if (r.promo === "ПРИВЕТСТВЕННАЯ СКИДКА") out.push(`🎁 <b>Приветственная скидка</b> (−${Number(r.discount) || 0}%)`);
  else if (r.promo) out.push(/^АКЦИЯ/.test(String(r.promo)) ? `🔥 <b>${esc(String(r.promo).replace(/^АКЦИЯ:\s*/, "Акция недели: "))}</b>${Number(r.discount) ? ` (−${Number(r.discount)}%)` : ""}` : `🎟 Промокод: <b>${esc(r.promo)}</b>${Number(r.discount) ? ` (−${Number(r.discount)}%)` : ""}`);
  if (Number(r.delivery_fee) > 0) out.push(`🚚 Доставка: ${money(r.delivery_fee)}`);
  else if (!/^Самовывоз/.test(String(r.address || ""))) out.push(`🚚 Доставка: <b>бесплатно</b>`);
  if (Number(r.gift_card_used) > 0) out.push(`💳 Сертификат ${esc(r.gift_card_code || "")}: −${money(r.gift_card_used)}`);
  if (Number(r.cashback_used) > 0) out.push(`✦ Списан кэшбэк: ${money(r.cashback_used)}`);
  if (r.gift) out.push(`🎁 <b>ПОДАРОК: ${esc(r.gift)}</b> — положить в заказ!`);
  if (Math.round(sub) !== Math.round(Number(r.total) || 0) && sub > 0) out.push(`Сумма товаров: ${money(sub)}`);
  out.push("━━━━━━━━━━━━");
  out.push(`💰 <b>ИТОГО: ${money(r.total)}</b>`);
  return out.join("\n");
}

// deno-lint-ignore no-explicit-any
function buildPartner(r: any) {
  const out = [];
  out.push(`🤝 <b>НОВАЯ ЗАЯВКА ПАРТНЁРА #${esc(r.id)}</b>`);
  out.push("");
  out.push(`👤 <b>${esc(clip(String(r.name || "Без имени"), 120))}</b>`);
  if (r.company) out.push(`🏢 ${esc(clip(String(r.company), 200))}`);
  if (r.phone) out.push(`📞 ${esc(r.phone)}`);
  if (r.email) out.push(`✉️ ${esc(r.email)}`);
  if (r.message) { out.push(""); out.push(`💬 <i>${esc(clip(String(r.message), 1500))}</i>`); }
  return out.join("\n");
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("ORDER_WEBHOOK_SECRET");
  const provided = req.headers.get("x-order-secret");
  if (!secret || provided !== secret) return new Response("Unauthorized", { status: 401 });

  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!token || !chatId) return Response.json({ error: "Telegram secrets are missing" }, { status: 500 });

  const body = await req.json();
  const record = body.record ?? body;
  const isPartner = body.type === "partner";
  if (body.type === "wheel") {
    const t = `🎡 <b>ВЫИГРЫШ В БАРАБАНЕ: ${esc(record.label)}</b>\n\n👤 ${esc(record.name || "Покупатель")}\n📞 ${esc(record.phone || "—")}\n\nСвяжитесь с покупателем, чтобы передать приз.`;
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text: t, parse_mode: "HTML" }) });
    return Response.json({ success: r.ok });
  }
  const text = isPartner ? buildPartner(record) : buildOrder(record);
  const adminRow = [{ text: isPartner ? "📋 Открыть заявки" : "📋 Открыть заказ в админке", url: "https://lumabeauty.uz/admin.html" }];
  // Кнопки смены статуса обрабатывает функция tg-bot (вебхук бота).
  const keyboard = isPartner || !record.id
    ? { inline_keyboard: [adminRow] }
    : { inline_keyboard: [[
        { text: "💳 Оплачен", callback_data: `st:${record.id}:paid` },
        { text: "🚚 Передан курьеру", callback_data: `st:${record.id}:shipped` },
        { text: "✅ Выполнен", callback_data: `st:${record.id}:done` },
      ], adminRow] };

  const send = (payload: Record<string, unknown>) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, ...payload }),
    });

  let response = await send({ text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: keyboard });
  if (!response.ok) {
    // Fallback: plain text without HTML tags, so a formatting problem never loses an order.
    const plain = text.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    response = await send({ text: plain, disable_web_page_preview: true, reply_markup: keyboard });
  }
  if (!response.ok) return Response.json({ error: "Telegram delivery failed" }, { status: 502 });

  // Накладная PDF ответом на сообщение о заказе — в фоне, чтобы не задерживать ответ базе.
  // Ошибка здесь не мешает уведомлению; при сбое Telegram — ещё 2 попытки.
  if (!isPartner && record.id) {
    const msg = await response.json().catch(() => null);
    const job = (async () => {
      const pdf = await buildInvoice(record);
      const caption = `🧾 Накладная к заказу #${record.id} — откройте и распечатайте`;
      const reply = msg?.result?.message_id ? { message_id: msg.result.message_id, allow_sending_without_reply: true } : undefined;
      // 1) кладём PDF в хранилище и отправляем ссылкой — Telegram сам скачивает файл (надёжнее загрузки)
      try {
        const SB = Deno.env.get("SUPABASE_URL")!, KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const path = `${record.id}/Nakladnaya-${record.id}-${crypto.randomUUID().slice(0, 8)}.pdf`;
        const up = await fetch(`${SB}/storage/v1/object/invoices/${path}`, { method: "POST", headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, "Content-Type": "application/pdf", "x-upsert": "true" }, body: pdf, signal: AbortSignal.timeout(20000) });
        if (!up.ok) throw new Error("upload " + up.status + " " + (await up.text()).slice(0, 120));
        const sg = await fetch(`${SB}/storage/v1/object/sign/invoices/${path}`, { method: "POST", headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 86400 }) });
        const sj = await sg.json();
        if (!sj?.signedURL) throw new Error("sign " + sg.status);
        const url = `${SB}/storage/v1${sj.signedURL}`;
        const r = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, document: url, caption, reply_parameters: reply, disable_notification: true }), signal: AbortSignal.timeout(30000) });
        if (r.ok) return;
        console.error("invoice url send:", r.status, (await r.text()).slice(0, 200));
      } catch (e) {
        console.error("invoice url:", (e as Error)?.message || String(e));
      }
      // 2) запасной путь — прямая загрузка файла
      for (let k = 0; k < 2; k++) {
        try {
          const fd = new FormData();
          fd.append("chat_id", String(chatId));
          fd.append("document", new Blob([pdf], { type: "application/pdf" }), `Nakladnaya-${record.id}.pdf`);
          fd.append("caption", caption);
          if (reply) fd.append("reply_parameters", JSON.stringify(reply));
          fd.append("disable_notification", "true");
          const r = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method: "POST", body: fd, signal: AbortSignal.timeout(25000) });
          if (r.ok) return;
          console.error("invoice send:", r.status, (await r.text()).slice(0, 200));
        } catch (e) {
          console.error("invoice try " + (k + 1) + ":", (e as Error)?.message || String(e));
        }
        await new Promise((res) => setTimeout(res, 3000));
      }
    })().catch((e) => console.error("invoice:", (e as Error)?.message || String(e)));
    // @ts-ignore EdgeRuntime есть в Supabase
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(job); else await job;
  }
  return Response.json({ success: true });
});
