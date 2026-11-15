import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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
  if (Number(r.cashback_used) > 0) out.push(`✦ Списан кэшбэк: ${money(r.cashback_used)}`);
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
  const text = isPartner ? buildPartner(record) : buildOrder(record);
  const keyboard = { inline_keyboard: [[{ text: isPartner ? "📋 Открыть заявки" : "📋 Открыть заказ в админке", url: "https://lumabeauty.uz/admin.html" }]] };

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
    response = await send({ text: plain, disable_web_page_preview: true });
  }
  if (!response.ok) return Response.json({ error: "Telegram delivery failed" }, { status: 502 });
  return Response.json({ success: true });
});
