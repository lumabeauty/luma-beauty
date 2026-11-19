// Накладная заказа в PDF (отправляется в Telegram вместе с уведомлением о заказе)
import { PDFDocument, rgb } from "npm:pdf-lib@1.17.1";
import fontkit from "npm:@pdf-lib/fontkit@1.1.1";

const FONT_URL = "https://lumabeauty.uz/fonts/";
let fontCache: [Uint8Array, Uint8Array] | null = null;
async function fonts(): Promise<[Uint8Array, Uint8Array]> {
  if (fontCache) return fontCache;
  const get = async (f: string) => {
    const r = await fetch(FONT_URL + f);
    if (!r.ok) throw new Error("font " + f + " " + r.status);
    return new Uint8Array(await r.arrayBuffer());
  };
  fontCache = await Promise.all([get("DejaVuSans.ttf"), get("DejaVuSans-Bold.ttf")]) as [Uint8Array, Uint8Array];
  return fontCache;
}

const num = (n: unknown) => Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const PAY: Record<string, string> = { payme: "Payme", click: "Click", cash: "Наличными", card: "Картой" };

// deno-lint-ignore no-explicit-any
export async function buildInvoice(r: any): Promise<Uint8Array> {
  const [reg, bold] = await fonts();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const F = await doc.embedFont(reg, { subset: true });
  const FB = await doc.embedFont(bold, { subset: true });
  const okChars = new Set(F.getCharacterSet());
  // убираем эмодзи и символы, которых нет в шрифте
  const clean = (s: unknown) => Array.from(String(s ?? "")).filter((c) => c === " " || okChars.has(c.codePointAt(0)!)).join("").replace(/\s+/g, " ").trim();

  doc.setTitle(`Накладная ${r.id}`);
  const W = 595, H = 842, M = 40;
  const ink = rgb(0.19, 0.15, 0.12), gold = rgb(0.61, 0.47, 0.27), grey = rgb(0.45, 0.42, 0.4), line = rgb(0.85, 0.82, 0.78);
  let page = doc.addPage([W, H]);
  let y = H - M;

  // deno-lint-ignore no-explicit-any
  const text = (s: string, x: number, yy: number, size = 10, font: any = F, color = ink) => page.drawText(s, { x, y: yy, size, font, color });
  // deno-lint-ignore no-explicit-any
  const right = (s: string, xr: number, yy: number, size = 10, font: any = F, color = ink) => text(s, xr - font.widthOfTextAtSize(s, size), yy, size, font, color);
  // deno-lint-ignore no-explicit-any
  const wrap = (s: string, width: number, size: number, font: any = F) => {
    const out: string[] = [];
    let cur = "";
    for (const w of clean(s).split(" ")) {
      const t = cur ? cur + " " + w : w;
      if (font.widthOfTextAtSize(t, size) <= width) { cur = t; continue; }
      if (cur) out.push(cur);
      cur = w;
      while (font.widthOfTextAtSize(cur, size) > width && cur.length > 1) {
        let k = cur.length - 1;
        while (k > 1 && font.widthOfTextAtSize(cur.slice(0, k), size) > width) k--;
        out.push(cur.slice(0, k)); cur = cur.slice(k);
      }
    }
    if (cur) out.push(cur);
    return out.length ? out : [""];
  };
  const hr = (yy: number, c = line, t = 0.7) => page.drawLine({ start: { x: M, y: yy }, end: { x: W - M, y: yy }, thickness: t, color: c });

  // ── шапка
  text("LUMA BEAUTY", M, y - 16, 20, FB, gold);
  text("lumabeauty.uz  ·  +998 91 001 01 84  ·  Ташкент", M, y - 32, 9, F, grey);
  const when = new Date(r.created_at || Date.now());
  const date = when.toLocaleString("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  right(`НАКЛАДНАЯ № ${r.id}`, W - M, y - 16, 14, FB);
  right(`от ${date}`, W - M, y - 32, 9, F, grey);
  y -= 46;
  hr(y, gold, 1.2);
  y -= 20;

  // ── получатель
  const addrAll = String(r.address || "").split("\n").map((s) => s.trim()).filter(Boolean);
  const addr = addrAll.filter((s) => !/^https?:\/\//.test(s));
  const pickup = /^Самовывоз/i.test(addr[0] || "");
  const rows: [string, string][] = [
    ["Получатель", clean(r.customer_name || "—")],
    ["Телефон", clean(r.phone || "—")],
    [pickup ? "Самовывоз" : "Адрес доставки", clean(addr.join(", ").replace(/^(Самовывоз|Доставка):\s*/i, "")) || "—"],
    ["Оплата", clean(PAY[String(r.payment || "").toLowerCase()] || r.payment || "не указана")],
  ];
  for (const [k, v] of rows) {
    text(k + ":", M, y, 9.5, F, grey);
    const ls = wrap(v, W - M * 2 - 110, 10.5, FB);
    ls.forEach((l, i) => text(l, M + 110, y - i * 14, 10.5, FB));
    y -= Math.max(1, ls.length) * 14 + 4;
  }
  y -= 8;

  // ── таблица товаров
  const cN = M, cT = M + 26, cQ = W - M - 175, cP = W - M - 85, cS = W - M;
  const head = () => {
    page.drawRectangle({ x: M, y: y - 6, width: W - M * 2, height: 20, color: rgb(0.96, 0.94, 0.9) });
    text("№", cN + 4, y, 9, FB); text("Наименование", cT, y, 9, FB);
    right("Кол-во", cQ + 30, y, 9, FB); right("Цена", cP + 30, y, 9, FB); right("Сумма", cS - 4, y, 9, FB);
    y -= 22;
  };
  head();
  const items = Array.isArray(r.items) ? r.items : [];
  let sub = 0, qtyAll = 0;
  items.forEach((it: any, n: number) => {
    const q = Number(it.qty) || 0, p = Number(it.price) || 0;
    sub += q * p; qtyAll += q;
    let title = String(it.title || "Товар #" + it.id);
    if (it.kind && !title.toLowerCase().startsWith(String(it.kind).toLowerCase())) title = it.kind + " " + title;
    if (Number(it.discount_percent) > 0) title += ` (скидка −${Number(it.discount_percent)}%)`;
    const ls = wrap(title, cQ - cT - 10, 9.5);
    const h = ls.length * 12 + 8;
    if (y - h < M + 150) { page = doc.addPage([W, H]); y = H - M; head(); }
    text(String(n + 1), cN + 4, y, 9.5, F, grey);
    ls.forEach((l, i) => text(l, cT, y - i * 12, 9.5));
    right(String(q), cQ + 30, y, 9.5); right(num(p), cP + 30, y, 9.5); right(num(q * p), cS - 4, y, 9.5, FB);
    y -= h - 4;
    hr(y + 6);
    y -= 6;
  });

  // ── итоги
  y -= 8;
  const tot: [string, string][] = [[`Товаров: ${qtyAll} шт., на сумму`, num(sub) + " сум"]];
  const disc = Number(r.discount) || 0;
  if (r.promo) {
    const name = r.promo === "ПРИВЕТСТВЕННАЯ СКИДКА" ? "Приветственная скидка" : /^АКЦИЯ/.test(String(r.promo)) ? String(r.promo).replace(/^АКЦИЯ:\s*/, "Акция: ") : "Промокод " + r.promo;
    tot.push([clean(name) + (disc ? ` (−${disc}%)` : ""), disc ? "−" + num(sub * disc / 100) + " сум" : ""]);
  }
  if (Number(r.delivery_fee) > 0) tot.push(["Доставка", num(r.delivery_fee) + " сум"]);
  else if (!pickup) tot.push(["Доставка", "бесплатно"]);
  if (Number(r.gift_card_used) > 0) tot.push([clean(`Сертификат ${r.gift_card_code || ""}`), "−" + num(r.gift_card_used) + " сум"]);
  if (Number(r.cashback_used) > 0) tot.push(["Оплачено кешбэком", "−" + num(r.cashback_used) + " сум"]);
  for (const [k, v] of tot) { right(k, W - M - 120, y, 9.5, F, grey); right(v, W - M - 4, y, 9.5); y -= 15; }
  y -= 4;
  page.drawRectangle({ x: W - M - 250, y: y - 8, width: 250, height: 26, color: rgb(0.96, 0.94, 0.9) });
  right("ИТОГО К ОПЛАТЕ:", W - M - 120, y, 11, FB);
  right(num(r.total) + " сум", W - M - 4, y, 12, FB, gold);
  y -= 34;

  if (r.gift) { text("Подарок в заказ: " + clean(r.gift), M, y, 10, FB, gold); y -= 18; }
  if (r.comment) { wrap("Комментарий: " + r.comment, W - M * 2, 9.5).forEach((l) => { text(l, M, y, 9.5, F, grey); y -= 13; }); }

  // ── подписи
  y = Math.min(y - 30, M + 70);
  text("Отпустил: ____________________", M, y, 10);
  right("Получил: ____________________", W - M, y, 10);
  text("Товар получен в полном объёме, претензий к упаковке и комплектности нет.", M, y - 22, 8, F, grey);
  text("Спасибо, что выбрали Luma Beauty!", M, M - 10, 8, F, gold);

  return await doc.save();
}
