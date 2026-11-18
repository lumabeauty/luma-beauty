/* Luma Beauty — shared store features: search, mega-menu, hits/new, stories, collections,
   smart filters, breadcrumbs, cart progress, delivery/city, gift card, product extras,
   chat button, bottom nav, footer, newsletter. Loaded after the page's own scripts. */
(function () {
'use strict';
const D = document, W = window;
const LP = W.LP = W.LP || {};
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => Number(n || 0).toLocaleString('ru-RU').replace(/ | /g, ' ') + ' сум';
const num = n => Number(n || 0).toLocaleString('ru-RU').replace(/ | /g, ' ');
const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
const PAGE = file === '' || file === 'index.html' ? 'index' : file.replace('.html', '');
LP.page = PAGE;
const store = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v } catch (e) { return d } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } } };
LP.store = store;
const T = s => (typeof W.LUMA_T === 'function' ? W.LUMA_T(s) : s);
const isIndex = PAGE === 'index';

/* ---------- Supabase ---------- */
LP.sb = function () {
  try { if (typeof sb !== 'undefined' && sb && sb.from) return sb } catch (e) { }
  if (!LP._sb && W.supabase && W.CFG && W.CFG.SUPABASE_URL) LP._sb = W.supabase.createClient(W.CFG.SUPABASE_URL, W.CFG.SUPABASE_KEY);
  return LP._sb || null;
};

/* ---------- Shop settings ---------- */
LP.shop = { delivery_tashkent: 25000, delivery_region: 35000, free_from: 500000, gift_active: true, gift_from: 1000000, gift_text: 'Миниатюра в подарок' };
LP.shopReady = (async () => {
  const c = LP.sb(); if (!c) return;
  try { const { data } = await c.from('site_settings').select('value').eq('key', 'shop').maybeSingle(); if (data && data.value) Object.assign(LP.shop, data.value) } catch (e) { }
  D.dispatchEvent(new Event('lp:shop'));
})();
LP.city = () => store.get('luma_city', 'tashkent');
LP.cityName = c => (c || LP.city()) === 'tashkent' ? 'Ташкент' : 'Регионы Узбекистана';
LP.fee = (sub, city) => { const s = LP.shop; if (s.free_from && sub >= s.free_from) return 0; return (city || LP.city()) === 'tashkent' ? +s.delivery_tashkent || 0 : +s.delivery_region || 0 };

/* ---------- Product data (normalized) ---------- */
const norm = r => ({ id: r.id, t: r.title, k: r.kind || '', c: r.category, v: r.volume || '', p: r.price, d: Number(r.discount_percent) || 0, i: r.image || '', su: r.suits || '', ds: r.description || '', ing: r.ingredients || '', st: r.stock == null ? null : Number(r.stock) });
LP.products = async function () {
  try { if (typeof P !== 'undefined' && Array.isArray(P) && P.length) return P } catch (e) { }
  if (LP._P) return LP._P;
  const c = LP.sb(); if (!c) return [];
  if (!LP._PP) LP._PP = c.from('products').select('id,title,kind,category,volume,price,discount_percent,image,suits,description,ingredients,stock,sort').eq('active', true).order('sort').order('id').then(({ data }) => (LP._P = (data || []).map(norm)));
  return LP._PP;
};
const sale = p => Math.round(Number(p.p || 0) * (100 - (p.d || 0)) / 100);
LP.sale = sale;

/* ---------- Tags: type / skin / concern / ingredient ---------- */
const TYPES = [
  { k: 'cert', l: 'Подарочные сертификаты', c: ['Сертификаты'], all: 1 },
  { k: 'perfume', l: 'Ароматы', c: ['Парфюмерия'], all: 1 },
  { k: 'set', l: 'Наборы и миниатюры', c: ['Лицо', 'Тело', 'Волосы'], w: ['набор', ' kit', 'trial'] },
  { k: 'lips', l: 'Помады и блески', c: ['Макияж'], w: ['помад', 'блеск', 'для губ', 'lip'] },
  { k: 'eyesh', l: 'Тени, пигменты и подводки', c: ['Макияж'], w: ['теней', 'пигмент', 'подводк'] },
  { k: 'brow', l: 'Брови', c: ['Макияж'], w: ['бров'] },
  { k: 'base', l: 'Тон, пудра и румяна', c: ['Макияж'], w: ['тональн', 'пудр', 'румян', 'бронзер', 'хайлайтер', 'праймер', 'тинт', 'контур', 'contour'] },
  { k: 'fix', l: 'Спреи для макияжа', c: ['Макияж'], w: ['спрей', 'mist'] },
  { k: 'eye', l: 'Для кожи вокруг глаз', c: ['Лицо'], w: ['глаз', 'eye'] },
  { k: 'makeup', l: 'Кушоны и BB-кремы', c: ['Лицо'], w: ['кушон', 'вв-крем', 'bb ', 'cushion', 'pact'] },
  { k: 'spf', l: 'Солнцезащита SPF', c: ['Лицо', 'Загар и SPF', 'Тело'], w: ['солнцезащ', 'sun', 'spf'] },
  { k: 'clean', l: 'Очищение и умывание', c: ['Лицо'], w: ['пенк', 'умыван', 'гидрофил', 'очищ', 'снятия макияж', 'cleans', 'foam', 'soap'] },
  { k: 'toner', l: 'Тонеры и тоники', c: ['Лицо'], w: ['тонер', 'тоник', 'toner', 'tonic'] },
  { k: 'serum', l: 'Сыворотки и эссенции', c: ['Лицо'], w: ['сыворот', 'эссенц', 'ампул', 'serum', 'essence', 'ampoule'] },
  { k: 'cream', l: 'Кремы, гели и эмульсии', c: ['Лицо'], w: ['крем', 'эмульс', 'флюид', 'гель', 'лосьон', 'moistur'] },
  { k: 'scrub', l: 'Скрабы и пилинги', c: ['Тело'], w: ['скраб', 'пилинг'] },
  { k: 'shower', l: 'Гели для душа', c: ['Тело'], w: ['для душа'] },
  { k: 'hand', l: 'Кремы для рук', c: ['Тело'], w: ['для рук'] },
  { k: 'oil', l: 'Масла для тела', c: ['Тело'], w: ['масло'] },
  { k: 'lotion', l: 'Лосьоны и молочко', c: ['Тело'], w: ['лосьон', 'молочко', 'крем'] },
  { k: 'style', l: 'Стайлинг', c: ['Волосы'], w: ['гель для волос', 'укладк', 'фиксац'] },
  { k: 'tint', l: 'Оттеночные средства', c: ['Волосы'], w: ['оттеночн'] },
  { k: 'shampoo', l: 'Шампуни', c: ['Волосы'], w: ['шампун'] },
  { k: 'cond', l: 'Кондиционеры и бальзамы', c: ['Волосы'], w: ['кондиционер', 'бальзам'] },
  { k: 'hmask', l: 'Маски и уход', c: ['Волосы'], w: ['маск', 'уход'] }
];
const SKIN = [
  { k: 'dry', l: 'Сухая', w: ['сух'] }, { k: 'oily', l: 'Жирная', w: ['жирн'] }, { k: 'combo', l: 'Комбинированная', w: ['комбинир'] },
  { k: 'normal', l: 'Нормальная', w: ['нормальн'] }, { k: 'sens', l: 'Чувствительная', w: ['чувствит', 'раздраж'] },
  { k: 'mature', l: 'Зрелая', w: ['зрел', 'морщин', 'упругост', 'anti-wrinkle', 'lifting'] }
];
const CONCERNS = [
  { k: 'acne', l: 'Акне и расширенные поры', e: '🫧', w: ['акне', 'воспален', 'несовершенств', 'поры', 'жирн', 'прыщ', 'soak out'], cat: ['Лицо', 'Загар и SPF'], img: 'https://wbxglomqselnmoobdmfw.supabase.co/storage/v1/object/public/products/hq/309.jpg?v=3' },
  { k: 'glow', l: 'Сияние и ровный тон', e: '✨', w: ['сияни', 'тускл', 'неровн', 'тон кожи', 'выравн', 'пигмент', 'осветл', 'whitening', 'radiance', 'ниацинамид', 'glow', 'aura'], cat: ['Лицо', 'Загар и SPF'], img: 'https://wbxglomqselnmoobdmfw.supabase.co/storage/v1/object/public/products/hq/300.jpg?v=3' },
  { k: 'age', l: 'Морщины и упругость', e: '🌹', w: ['морщин', 'упруг', 'зрел', 'лифтинг', 'lifting', 'коллаген', 'collagen', 'anti-wrinkle', 'resilience', 'женьшен', 'spicule'], cat: ['Лицо'], img: 'https://wbxglomqselnmoobdmfw.supabase.co/storage/v1/object/public/products/hq/290.jpg?v=3' },
  { k: 'hydra', l: 'Глубокое увлажнение', e: '💧', w: ['увлаж', 'обезвож', 'гиалурон', 'hyalu', 'moist', 'сух'], cat: ['Лицо', 'Загар и SPF'], img: 'https://wbxglomqselnmoobdmfw.supabase.co/storage/v1/object/public/products/hq/307.jpg?v=3' },
  { k: 'calm', l: 'Покраснения и раздражение', e: '🌿', w: ['чувствит', 'раздраж', 'центелл', 'cica', 'пантенол', 'panthenol', 'успока', 'алоэ', 'ромашк'], cat: ['Лицо', 'Загар и SPF'], img: 'img/unni-cleansing-soap-foam-3.jpg' },
  { k: 'sun', l: 'Защита от солнца', e: '☀️', w: ['spf', 'солнцезащ'], cat: ['Лицо', 'Загар и SPF', 'Тело'], img: 'https://wbxglomqselnmoobdmfw.supabase.co/storage/v1/object/public/products/hq/294.jpg?v=3' },
  { k: 'hair', l: 'Ломкость и сухость волос', e: '💇‍♀️', w: ['ломк', 'восстанавл', 'питани', 'поврежд', 'глубокого', 'укреплен'], cat: ['Волосы'], img: 'img/11.jpg' },
  { k: 'blonde', l: 'Блонд без желтизны', e: '👱‍♀️', w: ['блонд', 'желтизн', 'жемчуг'], cat: ['Волосы'], img: 'https://wbxglomqselnmoobdmfw.supabase.co/storage/v1/object/public/products/hq/288.jpg?v=3' },
  { k: 'dandruff', l: 'Перхоть и кожа головы', e: '🧴', w: ['перхот'], cat: ['Волосы'], img: 'img/21.jpg' },
  { k: 'lips', l: 'Макияж губ', e: '💄', w: ['помад', 'блеск для губ', 'для губ', 'lip gloss', 'lip oil'], cat: ['Макияж'], img: 'https://wbxglomqselnmoobdmfw.supabase.co/storage/v1/object/public/products/dessi/p/03-0.jpg' },
  { k: 'eyes', l: 'Глаза и брови', e: '👁️', w: ['теней', 'пигмент для век', 'подводк', 'бров'], cat: ['Макияж'], img: 'https://wbxglomqselnmoobdmfw.supabase.co/storage/v1/object/public/products/dessi/p/27-0.jpg' },
  { k: 'tone', l: 'Тон, пудра и румяна', e: '🎨', w: ['тональн', 'пудр', 'румян', 'бронзер', 'хайлайтер', 'праймер', 'тинт для лица'], cat: ['Макияж'], img: 'https://wbxglomqselnmoobdmfw.supabase.co/storage/v1/object/public/products/dessi/p/45-0.jpg' },
  { k: 'curly', l: 'Уход за кудрявыми волосами', e: '🌀', w: ['кудряв'], cat: ['Волосы'], img: 'https://wbxglomqselnmoobdmfw.supabase.co/storage/v1/object/public/products/hq/394.jpg?v=3' },
  { k: 'scent', l: 'Ароматный уход за телом', e: '🌸', w: ['парфюм', 'аромат', 'эфирн', 'цвет'], cat: ['Тело'], img: 'img/1.jpg' }
];
const INGR = [
  { k: 'cica', l: 'Центелла (cica)', w: ['центелл', 'cica'] }, { k: 'nia', l: 'Ниацинамид', w: ['ниацинамид', 'niacinamide'] },
  { k: 'hya', l: 'Гиалуроновая кислота', w: ['гиалурон', 'hyalu'] }, { k: 'pan', l: 'Пантенол', w: ['пантенол', 'panthenol'] },
  { k: 'col', l: 'Коллаген', w: ['коллаген', 'collagen'] }, { k: 'gin', l: 'Женьшень', w: ['женьшен', 'ginseng'] },
  { k: 'gold', l: 'Золото / платина', w: ['золот', 'gold', '24k', 'platinum', 'платин'] }, { k: 'tea', l: 'Зелёный чай', w: ['зелён', 'зелен', 'green tea'] },
  { k: 'aloe', l: 'Алоэ вера', w: ['алоэ'] }, { k: 'aha', l: 'AHA-кислоты', w: ['aha', 'кислот'] },
  { k: 'ginger', l: 'Имбирь', w: ['имбир'] }, { k: 'oils', l: 'Эфирные масла', w: ['эфирн'] }
];
LP.TYPES = TYPES; LP.SKIN = SKIN; LP.CONCERNS = CONCERNS; LP.INGR = INGR;
const has = (s, w) => w.some(x => s.includes(x));
const TAGC = {};
LP.tags = function (p) {
  if (TAGC[p.id]) return TAGC[p.id];
  const name = ((p.k || '') + ' ' + (p.t || '')).toLowerCase() + ' ';
  const txt = name + ' ' + (p.su || '').toLowerCase() + ' ' + (p.ing || '').toLowerCase();
  let ty = null;
  for (const t of TYPES) { if (!t.c.includes(p.c)) continue; if (t.all || has(name, t.w)) { ty = t.k; break } }
  const face = ['Лицо', 'Загар и SPF'].includes(p.c);
  const skAll = face && has(txt, ['всех типов', 'любой кож']);
  const sk = face ? SKIN.filter(s => has(txt, s.w)).map(s => s.k) : [];
  const cn = CONCERNS.filter(c => c.cat.includes(p.c) && has(txt, c.w)).map(c => c.k);
  const ing = INGR.filter(g => has(txt, g.w)).map(g => g.k);
  return (TAGC[p.id] = { ty, sk, skAll, cn, ing });
};
LP.typeLabel = k => (TYPES.find(t => t.k === k) || {}).l || '';

/* ---------- Filter state ---------- */
LP.f = { t: '', sk: '', cn: '', ing: '' };
W.LP_MATCH = function (p) {
  const f = LP.f; if (!f.t && !f.sk && !f.cn && !f.ing) return p.c !== 'Сертификаты' || (typeof cur !== 'undefined' && cur === 'Сертификаты');
  const g = LP.tags(p);
  if (f.t && g.ty !== f.t) return false;
  if (f.sk && !(g.sk.includes(f.sk) || g.skAll)) return false;
  if (f.cn && !g.cn.includes(f.cn)) return false;
  if (f.ing && !g.ing.includes(f.ing)) return false;
  return true;
};

/* ---------- Hits & new ---------- */
LP.hits = []; LP.hitIds = new Set(); LP.newIds = new Set();
LP.loadHits = async function () {
  const list = await LP.products(); const c = LP.sb();
  let sold = [];
  try { const { data } = await c.rpc('top_products', { n: 16 }); sold = (data || []).filter(r => r.sold >= 1) } catch (e) { }
  const byId = new Map(list.map(p => [String(p.id), p]));
  LP.hits = sold.map(r => byId.get(String(r.product_id))).filter(p => p && p.c !== 'Сертификаты');
  LP.hitIds = new Set(sold.filter(r => r.sold >= 2).slice(0, 8).map(r => String(r.product_id)));
  const fresh = list.filter(p => p.c !== 'Сертификаты').slice().sort((a, b) => b.id - a.id).slice(0, 10);
  LP.newIds = new Set(fresh.map(p => String(p.id)));
  LP.fresh = fresh;
};

/* ---------- Mini card ---------- */
const idxOf = p => { try { if (typeof P !== 'undefined' && Array.isArray(P)) return P.indexOf(p) } catch (e) { } return -1 };
LP.priceHTML = function (p) {
  try { if (isIndex && typeof productPrice === 'function') return productPrice(p) } catch (e) { }
  return (p.d ? `<s class="old">${money(p.p)}</s>` : '') + `<span class="${p.d ? 'new' : ''}">${money(sale(p))}</span>`;
};
LP.addById = function (id, btn) {
  if (isIndex) { const i = (typeof P !== 'undefined') ? P.findIndex(p => String(p.id) === String(id)) : -1; if (i >= 0 && typeof add === 'function') { add(i); return } }
  location.href = 'index.html?add=' + encodeURIComponent(id);
};
LP.card = function (p, opt) {
  opt = opt || {};
  const u = 'product.html?id=' + encodeURIComponent(p.id);
  const badge = LP.hitIds.has(String(p.id)) ? '<span class="lp-b lp-hit">HIT</span>' : (LP.newIds.has(String(p.id)) ? '<span class="lp-b lp-new">NEW</span>' : '');
  return `<article class="lp-card"><a class="lp-ph" href="${u}">${p.i ? `<img loading="lazy" src="${esc(p.i)}" alt="${esc(p.t)}">` : ''}${badge}${p.d ? `<span class="lp-b lp-sale">−${p.d}%</span>` : ''}${opt.rank ? `<span class="lp-rank">${opt.rank}</span>` : ''}</a><div class="lp-cb"><span class="lp-br">${esc(p.k)}</span><a class="lp-tt" href="${u}">${esc(p.t)}</a><div class="lp-cf"><span class="lp-pr">${p.p ? LP.priceHTML(p) : ''}</span>${p.p ? `<button class="lp-add" onclick="LP.addById(${JSON.stringify(p.id)},this)" aria-label="В корзину">+</button>` : ''}</div></div></article>`;
};
LP.rail = function (id, title, sub, items, opt) {
  if (!items.length) return '';
  return `<section class="lp-rail" id="${id}"><div class="lp-rh"><div><h2 class="serif">${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div><div class="lp-rnav"><button type="button" onclick="LP.scrollRail('${id}',-1)" aria-label="Назад">‹</button><button type="button" onclick="LP.scrollRail('${id}',1)" aria-label="Вперёд">›</button></div></div><div class="lp-track">${items.map((p, n) => LP.card(p, { rank: opt && opt.rank ? n + 1 : 0 })).join('')}</div></section>`;
};
LP.scrollRail = (id, d) => { const t = D.querySelector('#' + id + ' .lp-track'); if (t) t.scrollBy({ left: d * t.clientWidth * .85, behavior: 'smooth' }) };

/* ---------- Search (live, everywhere) ---------- */
const POP = ['центелла', 'SPF', 'сыворотка', 'Ottie', 'шампунь', 'крем для глаз', 'кушон', 'набор'];
LP.searchFind = async function (q) {
  const list = await LP.products(); q = q.trim().toLowerCase(); if (!q) return { items: [], brands: [], types: [] };
  const words = q.split(/\s+/);
  const score = p => { const s = (p.k + ' ' + p.t + ' ' + p.c + ' ' + LP.typeLabel(LP.tags(p).ty)).toLowerCase(); let n = 0; for (const w of words) { if (!s.includes(w)) return 0; n += s.indexOf(w) === 0 ? 3 : 1 } return n };
  const items = list.map(p => [p, score(p)]).filter(x => x[1]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const brands = [...new Set(list.map(p => p.k).filter(b => b && b.toLowerCase().includes(q) && b.length < 30))].slice(0, 4);
  const types = TYPES.filter(t => t.l.toLowerCase().includes(q)).slice(0, 3);
  return { items, brands, types };
};
const hl = (s, q) => { const i = s.toLowerCase().indexOf(q.toLowerCase()); return i < 0 || !q ? esc(s) : esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length)) };
LP.openSearch = function (pre) {
  let o = D.getElementById('lpSearch');
  if (!o) {
    o = D.createElement('div'); o.id = 'lpSearch'; o.className = 'lp-search'; o.setAttribute('role', 'dialog');
    o.innerHTML = `<div class="lp-sbox"><div class="lp-sin"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="lpSq" type="search" autocomplete="off" placeholder="Поиск: крем, SPF, Ottie, центелла…" aria-label="Поиск"><button type="button" class="lp-sx" onclick="LP.closeSearch()" aria-label="Закрыть">×</button></div><div class="lp-sres" id="lpSres"></div></div>`;
    D.body.appendChild(o);
    o.addEventListener('click', e => { if (e.target === o) LP.closeSearch() });
    const inp = o.querySelector('#lpSq');
    inp.addEventListener('input', () => LP.drawSearch(inp.value));
    inp.addEventListener('keydown', e => { if (e.key === 'Escape') LP.closeSearch(); if (e.key === 'Enter') LP.searchGo(inp.value) });
  }
  o.classList.add('on'); D.body.classList.add('lp-lock');
  const inp = o.querySelector('#lpSq'); inp.value = pre || ''; LP.drawSearch(inp.value); setTimeout(() => inp.focus(), 30);
};
LP.closeSearch = () => { const o = D.getElementById('lpSearch'); if (o) o.classList.remove('on'); D.body.classList.remove('lp-lock') };
LP.setQ = function (v) { try { q = v } catch (e) { } };
LP.searchGo = function (term) {
  term = (term || '').trim(); if (!term) return;
  const h = store.get('luma_sh', []).filter(x => x !== term); h.unshift(term); store.set('luma_sh', h.slice(0, 6));
  LP.closeSearch();
  if (isIndex && typeof render === 'function') { const s = D.querySelector('.sq'); if (s) s.value = term; LP.setQ(term.toLowerCase()); LP.f = { t: '', sk: '', cn: '', ing: '' }; LP.syncFilterUI(); LP.setCat('Все'); render(); const c = D.getElementById('catalog'); if (c) c.scrollIntoView({ behavior: 'smooth' }) }
  else location.href = 'index.html?q=' + encodeURIComponent(term) + '#catalog';
};
LP.drawSearch = async function (q) {
  const box = D.getElementById('lpSres'); if (!box) return;
  if (!q.trim()) {
    const h = store.get('luma_sh', []);
    const rec = store.get('luma_recent', []);
    const list = await LP.products(); const recP = rec.map(id => list.find(p => String(p.id) === String(id))).filter(Boolean).slice(0, 4);
    box.innerHTML = (h.length ? `<div class="lp-sg"><b>Вы искали</b><div class="lp-chips">${h.map(x => `<button type="button" onclick="LP.openSearch(${esc(JSON.stringify(x))})">🕘 ${esc(x)}</button>`).join('')}</div></div>` : '') +
      `<div class="lp-sg"><b>Популярные запросы</b><div class="lp-chips">${POP.map(x => `<button type="button" onclick="LP.openSearch('${esc(x)}')">🔥 ${esc(x)}</button>`).join('')}</div></div>` +
      (recP.length ? `<div class="lp-sg"><b>Вы недавно смотрели</b>${recP.map(p => LP.sRow(p, '')).join('')}</div>` : '');
    return;
  }
  const r = await LP.searchFind(q);
  if (!r.items.length && !r.brands.length) { box.innerHTML = `<div class="lp-sempty">По запросу «${esc(q)}» ничего не нашлось. Попробуйте другое слово или <a href="index.html#catalog" onclick="LP.closeSearch()">откройте каталог</a>.</div>`; return }
  box.innerHTML = (r.brands.length || r.types.length ? `<div class="lp-sg"><b>Бренды и разделы</b><div class="lp-chips">${r.brands.map(b => `<a href="brands.html#${encodeURIComponent(b)}" onclick="LP.closeSearch();LP.goBrand(${esc(JSON.stringify(b))});return false">🏷 ${hl(b, q)}</a>`).join('')}${r.types.map(t => `<button type="button" onclick="LP.closeSearch();LP.goType('${t.k}')">📂 ${hl(t.l, q)}</button>`).join('')}</div></div>` : '') +
    `<div class="lp-sg"><b>Товары · ${r.items.length}</b>${r.items.slice(0, 7).map(p => LP.sRow(p, q)).join('')}</div>` +
    (r.items.length > 7 ? `<button type="button" class="lp-sall" onclick="LP.searchGo(${esc(JSON.stringify(q))})">Показать все ${r.items.length} товаров →</button>` : '');
};
LP.sRow = (p, q) => `<a class="lp-srow" href="product.html?id=${encodeURIComponent(p.id)}">${p.i ? `<img src="${esc(p.i)}" alt="" loading="lazy">` : '<i></i>'}<span><small>${hl(p.k, q)}</small>${hl(p.t, q)}</span><b>${p.p ? money(sale(p)) : ''}</b></a>`;

/* ---------- Navigation helpers (index) ---------- */
LP.setCat = function (c) {
  try { cur = c } catch (e) { }
  D.querySelectorAll('#chips button').forEach(b => b.classList.toggle('on', (b.dataset.c || b.textContent.trim()) === c));
};
LP.goType = function (k) {
  if (!isIndex) { location.href = 'index.html?type=' + k + '#catalog'; return }
  const t = TYPES.find(x => x.k === k); LP.f = { t: k, sk: '', cn: '', ing: '' };
  LP.setCat(t && t.c.length === 1 ? t.c[0] : 'Все'); LP.syncFilterUI(); render(); LP.closeMega();
  D.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
};
LP.goConcern = function (k) {
  if (!isIndex) { location.href = 'index.html?concern=' + k + '#catalog'; return }
  LP.f = { t: '', sk: '', cn: k, ing: '' }; LP.setCat('Все'); LP.syncFilterUI(); render(); LP.closeMega();
  D.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
};
LP.goCat = function (c) {
  if (!isIndex) { location.href = 'index.html?cat=' + encodeURIComponent(c) + '#catalog'; return }
  LP.f = { t: '', sk: '', cn: '', ing: '' }; LP.setCat(c); LP.syncFilterUI(); render(); LP.closeMega();
  D.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
};
LP.goBrand = function (b) {
  if (!isIndex) { location.href = 'index.html?brand=' + encodeURIComponent(b) + '#catalog'; return }
  try { fB = b } catch (e) { } const s = D.getElementById('fBrand'); if (s) s.value = b; LP.setCat('Все'); render(); LP.closeMega();
  D.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
};

/* ---------- Mega menu ---------- */
const MEGA = [
  { c: 'Лицо', ic: '🧖‍♀️', t: ['clean', 'toner', 'serum', 'cream', 'eye', 'makeup', 'spf', 'set'] },
  { c: 'Макияж', ic: '💄', t: ['lips', 'eyesh', 'brow', 'base', 'fix'] },
  { c: 'Тело', ic: '🛁', t: ['shower', 'lotion', 'scrub', 'hand', 'oil'] },
  { c: 'Волосы', ic: '💇‍♀️', t: ['shampoo', 'cond', 'hmask', 'tint', 'style'] },
  { c: 'Парфюмерия', ic: '🌸', t: ['perfume'] }
];
LP.megaHTML = function (list) {
  const cols = MEGA.map(m => `<div class="lp-mcol"><button type="button" class="lp-mh" onclick="LP.goCat('${m.c}')">${m.ic} ${m.c} <span>${list.filter(p => p.c === m.c).length}</span></button>${m.t.map(k => { const n = list.filter(p => LP.tags(p).ty === k && (k === 'spf' || p.c === m.c)).length; return n ? `<button type="button" onclick="LP.goType('${k}')">${esc(LP.typeLabel(k))} <span>${n}</span></button>` : '' }).join('')}</div>`).join('');
  const col = `<div class="lp-mcol"><div class="lp-mh2">✨ Подборки</div>${CONCERNS.map(c => `<button type="button" onclick="LP.goConcern('${c.k}')">${c.e} ${esc(c.l)}</button>`).join('')}</div>`;
  const more = `<div class="lp-mcol lp-mmore"><a href="offers.html">🔥 Все акции</a><a href="brands.html">🏷 Бренды A–Я</a><a href="gifts.html">🎁 Подарки и сертификаты</a><a href="index.html#bundles" onclick="LP.closeMega()">🧺 Готовые наборы</a><a href="#" onclick="LP.closeMega();if(typeof goSkin==='function'){goSkin();return false}location.href='index.html#skinQuiz';return false">🧪 Тест кожи — подбор ухода</a><a href="blog.html">📖 Блог о красоте</a><div class="lp-mpromo"><b>Первый заказ?</b><span>Промокод <em>NEW</em> — скидка 10%</span></div></div>`;
  return `<div class="lp-mgrid">${cols}${col}${more}</div>`;
};
LP.openMega = async function () {
  let m = D.getElementById('lpMega');
  if (!m) { m = D.createElement('div'); m.id = 'lpMega'; m.className = 'lp-mega'; m.innerHTML = '<div class="lp-mbox"><button type="button" class="lp-mx" onclick="LP.closeMega()" aria-label="Закрыть">×</button><div id="lpMegaIn">Загрузка…</div></div>'; D.body.appendChild(m); m.addEventListener('click', e => { if (e.target === m) LP.closeMega() }) }
  m.classList.add('on'); const list = await LP.products(); D.getElementById('lpMegaIn').innerHTML = LP.megaHTML(list);
};
LP.closeMega = () => { const m = D.getElementById('lpMega'); if (m) m.classList.remove('on') };

/* ---------- Utility bar (city + delivery) ---------- */
LP.utilBar = function () {
  if (D.getElementById('lpUtil')) return;
  const b = D.createElement('div'); b.id = 'lpUtil'; b.className = 'lp-util';
  const tb = D.querySelector('.topbar'); if (tb) { tb.replaceWith(b) } else {
  const hdr = D.querySelector('body > header, header.head, header.top, header');
  const top = D.querySelector('.promo-bar') || hdr;
  if (!top) return;
  top.parentNode.insertBefore(b, top); }
  LP.paintUtil();
};
LP.paintUtil = function () {
  const b = D.getElementById('lpUtil'); if (!b) return; const s = LP.shop, c = LP.city();
  const fee = c === 'tashkent' ? s.delivery_tashkent : s.delivery_region;
  b.innerHTML = `<button type="button" class="lp-city" onclick="LP.pickCity()">📍 <b>${esc(LP.cityName())}</b> ▾</button><span class="lp-uinfo"><span>🚚 Доставка ${money(fee)}</span> · <b>бесплатно от ${money(s.free_from)}</b></span><span class="lp-ulinks"><a href="track.html">📦 Отследить заказ</a><a href="delivery.html">Доставка и оплата</a><a href="faq.html">Помощь</a><a href="tel:+998910010184">☎ +998 91 001 01 84</a></span>`;
};
LP.pickCity = function () {
  const s = LP.shop;
  LP.sheet(`<h3 class="serif">Куда доставить?</h3><p class="lp-mu">От города зависит стоимость и срок доставки.</p>
  <button type="button" class="lp-opt${LP.city() === 'tashkent' ? ' on' : ''}" onclick="LP.setCity('tashkent')"><b>🏙 Ташкент</b><small>Курьер в день заказа или на следующий день · ${money(s.delivery_tashkent)} · бесплатно от ${money(s.free_from)}</small></button>
  <button type="button" class="lp-opt${LP.city() === 'region' ? ' on' : ''}" onclick="LP.setCity('region')"><b>🇺🇿 Регионы Узбекистана</b><small>Почтой BTS / EMU за 1–3 дня · ${money(s.delivery_region)} · бесплатно от ${money(s.free_from)}</small></button>
  <button type="button" class="lp-opt" onclick="LP.setCity('tashkent')"><b>🏬 Самовывоз</b><small>Ташкент, Order Plaza — бесплатно</small></button>
  <a class="lp-link" href="delivery.html">Подробнее о доставке и оплате →</a>`);
};
LP.setCity = c => { store.set('luma_city', c); LP.closeSheet(); LP.paintUtil(); LP.paintCartBars(); D.dispatchEvent(new Event('lp:city')) };

/* ---------- Sheet (simple modal) ---------- */
LP.sheet = function (html) {
  let s = D.getElementById('lpSheet');
  if (!s) { s = D.createElement('div'); s.id = 'lpSheet'; s.className = 'lp-sheet'; s.innerHTML = '<div class="lp-shbox"><button type="button" class="lp-mx" onclick="LP.closeSheet()" aria-label="Закрыть">×</button><div id="lpSheetIn"></div></div>'; D.body.appendChild(s); s.addEventListener('click', e => { if (e.target === s) LP.closeSheet() }) }
  D.getElementById('lpSheetIn').innerHTML = html; s.classList.add('on');
};
LP.closeSheet = () => { const s = D.getElementById('lpSheet'); if (s) s.classList.remove('on') };

/* ---------- Stories ---------- */
LP.STORIES = [
  { k: 'new', l: 'Новинки', e: '✨' }, { k: 'hits', l: 'Хиты', e: '🔥' }, { k: 'sale', l: 'Скидки', e: '%' },
  { k: 'quiz', l: 'Тест кожи', e: '🧪' }, { k: 'sets', l: 'Наборы', e: '🧺' }, { k: 'gift', l: 'Подарки', e: '🎁' },
  { k: 'spf', l: 'SPF', e: '☀️' }, { k: 'cica', l: 'Центелла', e: '🌿' }, { k: 'blog', l: 'Советы', e: '📖' }
];
LP.storyItems = function (k, list) {
  const L = list.filter(p => p.c !== 'Сертификаты' && p.i);
  if (k === 'new') return (LP.fresh || []).slice(0, 5);
  if (k === 'hits') return (LP.hits.length >= 3 ? LP.hits : L.filter(p => p.d)).slice(0, 5);
  if (k === 'sale') return L.filter(p => p.d).sort((a, b) => b.d - a.d).slice(0, 5);
  if (k === 'spf') return L.filter(p => LP.tags(p).ty === 'spf' || LP.tags(p).cn.includes('sun')).slice(0, 5);
  if (k === 'cica') return L.filter(p => LP.tags(p).ing.includes('cica')).slice(0, 5);
  if (k === 'gift') return list.filter(p => p.c === 'Сертификаты').concat(L.filter(p => LP.tags(p).ty === 'set')).slice(0, 5);
  return [];
};
LP.storiesRow = async function (host) {
  const list = await LP.products(); const seen = store.get('luma_st_seen', []);
  const thumb = k => { const it = LP.storyItems(k, list)[0]; return it ? `<img src="${esc(it.i)}" alt="" loading="lazy">` : `<i>${LP.STORIES.find(s => s.k === k).e}</i>` };
  host.innerHTML = `<div class="lp-stories" role="list">${LP.STORIES.map(s => `<button type="button" role="listitem" class="lp-st${seen.includes(s.k) ? ' seen' : ''}" onclick="LP.story('${s.k}')"><span class="lp-stc">${thumb(s.k)}</span><small>${esc(s.l)}</small></button>`).join('')}</div>`;
};
LP.story = async function (k) {
  if (k === 'quiz') { if (typeof goSkin === 'function') goSkin(); return }
  if (k === 'sets') { const b = D.getElementById('bundles'); if (b && !b.hidden) { b.scrollIntoView({ behavior: 'smooth' }); return } location.href = 'offers.html'; return }
  if (k === 'blog') { location.href = 'blog.html'; return }
  const list = await LP.products(); const items = LP.storyItems(k, list); if (!items.length) return;
  const seen = store.get('luma_st_seen', []); if (!seen.includes(k)) { seen.push(k); store.set('luma_st_seen', seen) }
  const btn = D.querySelector(`.lp-st[onclick*="'${k}'"]`); if (btn) btn.classList.add('seen');
  const meta = LP.STORIES.find(s => s.k === k);
  let v = D.getElementById('lpStory'); if (!v) { v = D.createElement('div'); v.id = 'lpStory'; v.className = 'lp-story'; D.body.appendChild(v) }
  let n = 0, tm = null; const dur = 5000;
  const show = () => {
    const p = items[n]; clearTimeout(tm);
    v.innerHTML = `<div class="lp-sv"><div class="lp-bars">${items.map((x, j) => `<i><b class="${j < n ? 'done' : j === n ? 'run' : ''}"></b></i>`).join('')}</div><div class="lp-svh"><span>${meta.e} ${esc(meta.l)}</span><button type="button" onclick="LP.closeStory()" aria-label="Закрыть">×</button></div><img src="${esc(p.i)}" alt="${esc(p.t)}"><div class="lp-svb"><small>${esc(p.k)}</small><b class="serif">${esc(p.t)}</b><div class="lp-svp">${p.p ? LP.priceHTML(p) : ''}</div><div class="lp-svbtn"><a href="product.html?id=${encodeURIComponent(p.id)}">Подробнее</a>${p.p ? `<button type="button" onclick="LP.addById(${JSON.stringify(p.id)});LP.closeStory()">В корзину</button>` : ''}</div></div><button type="button" class="lp-svl" aria-label="Назад" onclick="LP._st(-1)"></button><button type="button" class="lp-svr" aria-label="Дальше" onclick="LP._st(1)"></button></div>`;
    tm = setTimeout(() => LP._st(1), dur);
  };
  LP._st = d => { n += d; if (n < 0) n = 0; if (n >= items.length) { LP.closeStory(); return } show() };
  LP.closeStory = () => { clearTimeout(tm); v.classList.remove('on'); D.body.classList.remove('lp-lock') };
  v.classList.add('on'); D.body.classList.add('lp-lock'); show();
};

/* ---------- Collections ---------- */
LP.collectionsHTML = function (list) {
  const L = list.filter(p => p.c !== 'Сертификаты');
  const cards = CONCERNS.map(c => { const items = L.filter(p => LP.tags(p).cn.includes(c.k)); if (items.length < 2) return ''; const im = c.img ? { i: c.img } : items.find(p => p.i); return `<button type="button" class="lp-col" onclick="LP.goConcern('${c.k}')">${im ? `<img src="${esc(im.i)}" alt="" loading="lazy">` : ''}<span class="lp-colt"><em>${c.e}</em><b>${esc(c.l)}</b><small>${items.length} ${LP.word(items.length)}</small></span></button>` }).join('');
  return cards ? `<section class="lp-cols" id="collections"><div class="lp-rh"><div><h2 class="serif">Подборки по задачам</h2><p>Выберите, что хотите решить, — покажем подходящие средства</p></div></div><div class="lp-colgrid">${cards}</div></section>` : '';
};
LP.word = n => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? 'товар' : (a >= 2 && a <= 4 && (b < 10 || b >= 20) ? 'товара' : 'товаров') };

/* ---------- Recently viewed ---------- */
LP.pushRecent = id => { const r = store.get('luma_recent', []).filter(x => String(x) !== String(id)); r.unshift(id); store.set('luma_recent', r.slice(0, 12)) };
LP.recentRail = async function (exceptId) {
  const list = await LP.products(); const r = store.get('luma_recent', []).filter(x => String(x) !== String(exceptId));
  const items = r.map(id => list.find(p => String(p.id) === String(id))).filter(Boolean).slice(0, 10);
  return items.length ? LP.rail('lpRecent', 'Вы недавно смотрели', '', items) : '';
};

/* ---------- Index: filters UI, crumbs, cards ---------- */
LP.syncFilterUI = function () {
  const s = (id, v) => { const e = D.getElementById(id); if (e) e.value = v };
  s('fType', LP.f.t); s('fSkin', LP.f.sk); s('fConc', LP.f.cn); s('fIng', LP.f.ing);
};
LP.filterUI = function () {
  const bar = D.getElementById('fbar'); if (!bar || D.getElementById('fType')) return;
  const sel = (id, label, all, opts, key) => `<label class="fb-f lp-ff"><span>${label}</span><select id="${id}" onchange="LP.f.${key}=this.value;render()"><option value="">${all}</option>${opts.map(o => `<option value="${o.k}">${esc(o.l)}</option>`).join('')}</select></label>`;
  const html = sel('fType', 'Тип средства', 'Все типы', TYPES, 't') + sel('fSkin', 'Тип кожи', 'Любой', SKIN, 'sk') + sel('fConc', 'Задача', 'Любая', CONCERNS, 'cn') + sel('fIng', 'Компонент', 'Любой', INGR, 'ing');
  const first = bar.querySelector('.fb-f'); first ? first.insertAdjacentHTML('beforebegin', html) : bar.insertAdjacentHTML('afterbegin', html);
};
LP.crumb = function () {
  const cat = D.getElementById('catalog'); if (!cat) return;
  let c = D.getElementById('lpCrumb'); if (!c) { c = D.createElement('nav'); c.id = 'lpCrumb'; c.className = 'lp-crumb'; c.setAttribute('aria-label', 'Навигация'); cat.insertBefore(c, cat.firstChild) }
  const parts = ['<a href="index.html">Главная</a>', '<a href="#catalog" onclick="LP.goCat(\'Все\');return false">Каталог</a>'];
  let curC = 'Все'; try { curC = cur } catch (e) { }
  if (curC && curC !== 'Все') parts.push(`<a href="#catalog" onclick="LP.goCat(${esc(JSON.stringify(curC))});return false">${esc(curC)}</a>`);
  if (LP.f.t) parts.push(`<span>${esc(LP.typeLabel(LP.f.t))}</span>`);
  if (LP.f.cn) parts.push(`<span>${esc((CONCERNS.find(x => x.k === LP.f.cn) || {}).l || '')}</span>`);
  let fb = ''; try { fb = fB } catch (e) { } if (fb) parts.push(`<span>${esc(fb)}</span>`);
  let qq = ''; try { qq = q } catch (e) { } if (qq) parts.push(`<span>«${esc(qq)}»</span>`);
  c.innerHTML = parts.join('<i>›</i>');
};
LP.enhanceCards = function () {
  const grid = D.getElementById('grid'); if (!grid) return;
  grid.querySelectorAll('article.pc').forEach(a => {
    const btn = a.querySelector('.pc-bag,.pc-quick'); const m = btn && (btn.getAttribute('onclick') || '').match(/add\((\d+)\)/); if (!m) return;
    const i = +m[1], p = P[i]; if (!p) return; a.dataset.i = i;
    const media = a.querySelector('.pc-media');
    if (media && !media.querySelector('.lp-b')) {
      const tag = LP.hitIds.has(String(p.id)) ? '<span class="lp-b lp-hit lp-onpc">HIT</span>' : (LP.newIds.has(String(p.id)) ? '<span class="lp-b lp-new lp-onpc">NEW</span>' : '');
      if (tag) media.insertAdjacentHTML('beforeend', tag);
    }
    const pr = a.querySelector('.pc-price');
    if (pr && p.p && p.d && !a.querySelector('.lp-save')) {
      const sv = Number(p.p) - sale(p); if (sv > 0) pr.insertAdjacentHTML('beforeend', `<small class="lp-save">Экономия ${money(sv)}</small>`);
    }
    LP.paintAct(a, i);
  });
};
LP.paintAct = function (a, i) {
  const foot = a.querySelector('.pc-foot'); if (!foot) return; const p = P[i]; if (!p || !p.p) return;
  let q = 0; try { q = cart[i] || 0 } catch (e) { }
  let st = foot.querySelector('.lp-step'); const bag = foot.querySelector('.pc-bag');
  if (q > 0) {
    if (bag) bag.style.display = 'none';
    if (!st) { st = D.createElement('span'); st.className = 'lp-step'; foot.appendChild(st) }
    st.innerHTML = `<button type="button" onclick="ch(${i},-1)" aria-label="Меньше">−</button><b>${q}</b><button type="button" onclick="ch(${i},1)" aria-label="Больше">+</button>`;
  } else { if (st) st.remove(); if (bag) bag.style.display = '' }
};
LP.syncActs = function () { if (typeof P === 'undefined') return; D.querySelectorAll('#grid article.pc[data-i]').forEach(a => LP.paintAct(a, +a.dataset.i)) };

/* ---------- Cart drawer bars ---------- */
LP.cartSub = function () { try { return Object.keys(cart).reduce((s, k) => s + finalPrice(P[k]) * cart[k], 0) } catch (e) { return 0 } };
LP.paintCartBars = function () {
  const dr = D.getElementById('dr'); if (!dr) return;
  let b = D.getElementById('lpCartBars'); if (!b) { b = D.createElement('div'); b.id = 'lpCartBars'; const bb = D.getElementById('bulkBar'); bb ? bb.after(b) : dr.querySelector('#items').after(b) }
  const sub = LP.cartSub(), s = LP.shop; if (!sub) { b.innerHTML = ''; return }
  const fee = LP.fee(sub), city = LP.city();
  const left = Math.max(0, s.free_from - sub), pct = Math.min(100, sub / s.free_from * 100);
  let h = `<div class="lp-cb1"><div class="lp-cbt">${left > 0 ? `<span>🚚 До бесплатной доставки осталось</span> <b>${money(left)}</b>` : '<b>🎉 Доставка бесплатно!</b>'}</div><i class="lp-pg"><b style="width:${pct}%"></b></i></div>`;
  if (s.gift_active && s.gift_from) { const gl = Math.max(0, s.gift_from - sub), gp = Math.min(100, sub / s.gift_from * 100); h += `<div class="lp-cb1 lp-gift"><div class="lp-cbt">${gl > 0 ? `<span>🎁 До подарка осталось</span> <b>${money(gl)}</b><br><small>${esc(s.gift_text)}</small>` : `<b>🎁 ${esc(s.gift_text)}</b><br><small>Положим в ваш заказ!</small>`}</div><i class="lp-pg"><b style="width:${gp}%"></b></i></div>` }
  h += `<div class="lp-cdel"><span>Доставка · <button type="button" onclick="LP.pickCity()">${esc(LP.cityName(city))} ▾</button></span><b>${fee ? money(fee) : 'бесплатно'}</b></div>`;
  let first = !store.get('luma_has_order', false); if (first) h += `<div class="lp-first"><span>🎉 Первый заказ? Промокод NEW — скидка 10%</span></div>`;
  b.innerHTML = h;
};

/* ---------- Pay step: delivery + gift card ---------- */
LP.gc = null;
LP.payExtras = function () {
  const mb = D.getElementById('mb'); if (!mb || D.getElementById('lpPayX')) return;
  const firstPay = mb.querySelector('.pay'); if (!firstPay) return;
  let pickup = false; try { pickup = mode === 'pickup' } catch (e) { }
  let tash = true; try { tash = /^г\. Ташкент/.test(addr) } catch (e) { }
  const sub = LP.cartSub(), s = LP.shop;
  const fee = pickup ? 0 : (s.free_from && sub >= s.free_from ? 0 : (tash ? s.delivery_tashkent : s.delivery_region));
  const gift = s.gift_active && sub >= s.gift_from ? s.gift_text : '';
  firstPay.insertAdjacentHTML('beforebegin', `<div id="lpPayX" class="lp-payx"><div class="lp-prow"><span>Товары</span><b>${money(sub)}</b></div><div class="lp-prow"><span>${pickup ? '🏬 Самовывоз' : '🚚 Доставка' + (tash ? ' по Ташкенту' : ' в регион')}</span><b>${fee ? money(fee) : 'бесплатно'}</b></div>${gift ? `<div class="lp-prow lp-pg2"><span>🎁 ${esc(gift)}</span><b>в подарок</b></div>` : ''}<div class="lp-prow lp-gcrow" id="lpGcRow"></div><div class="lp-gc"><input id="lpGc" placeholder="Код подарочного сертификата" autocomplete="off" value="${esc(LP.gc ? LP.gc.code : '')}"><button type="button" onclick="LP.checkGc()">Применить</button></div><p class="lp-mu" id="lpGcMsg"></p><div class="lp-prow lp-ptot"><span>Итого к оплате</span><b id="lpPayTot"></b></div></div>`);
  LP._fee = fee; LP.paintPayTot();
};
LP.paintPayTot = function () {
  const e = D.getElementById('lpPayTot'); if (!e) return; const sub = LP.cartSub(); let t = sub + (LP._fee || 0);
  const r = D.getElementById('lpGcRow'); let gu = 0; if (LP.gc) { gu = Math.min(LP.gc.balance, t); t -= gu } if (r) r.innerHTML = gu ? `<span>💳 Сертификат ${esc(LP.gc.code)}</span><b>−${money(gu)}</b>` : '';
  const cbv = Math.max(0, Math.floor(Number((D.getElementById('cbUse') || {}).value) || 0)); t -= Math.min(cbv, t);
  e.textContent = money(t);
};
LP.checkGc = async function () {
  const v = (D.getElementById('lpGc').value || '').trim().toUpperCase(), m = D.getElementById('lpGcMsg');
  if (!v) { LP.gc = null; m.textContent = ''; LP.paintPayTot(); return }
  const { data, error } = await LP.sb().rpc('check_gift_card', { c: v });
  if (error || data == null || data < 0) { LP.gc = null; m.textContent = 'Сертификат не найден. Проверьте код.'; m.className = 'lp-mu lp-err' }
  else if (data === 0) { LP.gc = null; m.textContent = 'На этом сертификате не осталось средств.'; m.className = 'lp-mu lp-err' }
  else { LP.gc = { code: v, balance: data }; m.textContent = 'Сертификат применён. Баланс: ' + money(data); m.className = 'lp-mu lp-ok' }
  LP.paintPayTot();
};
D.addEventListener('input', e => { if (e.target && e.target.id === 'cbUse') LP.paintPayTot() });

/* ---------- Global: chat button, bottom nav, footer ---------- */
LP.chat = function () {
  if (D.getElementById('lpChat')) return;
  const tg = (W.CFG && W.CFG.TG_USER) || 'lumabeautyuzz';
  const b = D.createElement('div'); b.id = 'lpChat'; b.className = 'lp-chat';
  b.innerHTML = `<button type="button" class="lp-chb" onclick="this.parentNode.classList.toggle('open')" aria-label="Консультация"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg></button><div class="lp-chp"><b>Нужна консультация?</b><span>Поможем подобрать уход под вашу кожу — бесплатно.</span><a href="https://t.me/${esc(tg)}" target="_blank" rel="noopener" class="lp-tg">✈ Написать в Telegram</a><a href="https://www.instagram.com/lumabeautyuz/" target="_blank" rel="noopener" class="lp-ig">◎ Instagram Direct</a><a href="tel:+998910010184" class="lp-ph2">☎ +998 91 001 01 84</a><small>Отвечаем ежедневно 9:00–22:00</small></div>`;
  D.body.appendChild(b);
  D.addEventListener('click', e => { if (!b.contains(e.target)) b.classList.remove('open') });
};
LP.bottomNav = function () {
  if (D.getElementById('lpNav')) return;
  const n = D.createElement('nav'); n.id = 'lpNav'; n.className = 'lp-nav'; n.setAttribute('aria-label', 'Меню');
  const ic = { home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>', cat: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>', sale: '<path d="M20 12 12 20l-8-8V4h8z"/><circle cx="8.5" cy="8.5" r="1.2"/>', bag: '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>' };
  const svg = k => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ic[k]}</svg>`;
  const cartClick = isIndex ? `onclick="document.getElementById('dr').classList.add('open');return false"` : '';
  n.innerHTML = `<a href="index.html" class="${isIndex ? 'on' : ''}">${svg('home')}<span>Главная</span></a><a href="#" onclick="LP.openMega();return false">${svg('cat')}<span>Каталог</span></a><a href="offers.html" class="${PAGE === 'offers' ? 'on' : ''}">${svg('sale')}<span>Акции</span></a><a href="index.html#cart" ${cartClick}>${svg('bag')}<span>Корзина</span><em id="lpNavCnt"></em></a><a href="account.html" class="${PAGE === 'account' ? 'on' : ''}">${svg('user')}<span>Профиль</span></a>`;
  D.body.appendChild(n); D.body.classList.add('lp-has-nav'); LP.navCount();
};
LP.navCount = function () {
  const e = D.getElementById('lpNavCnt'); if (!e) return; let n = 0;
  try { if (typeof cart !== 'undefined') n = Object.values(cart).reduce((a, b) => a + b, 0); else n = Object.values(store.get('luma_cart', {}) || {}).reduce((a, b) => a + b, 0) } catch (e2) { }
  e.textContent = n || ''; e.hidden = !n;
};
LP.footer = function () {
  if (D.getElementById('lpFoot')) return;
  const f = D.createElement('section'); f.id = 'lpFoot'; f.className = 'lp-foot';
  f.innerHTML = `<div class="lp-news"><div><b class="serif">Скидки и новинки — первыми</b><span>Подпишитесь: раз в неделю присылаем акции, новинки и советы по уходу. Без спама.</span></div><form onsubmit="LP.subscribe(event)"><input id="lpNl" required minlength="5" maxlength="120" placeholder="Телефон, email или @telegram" autocomplete="email"><button>Подписаться</button></form><p id="lpNlMsg" class="lp-mu"></p></div>
  <div class="lp-why"><div><em>✓</em><b>100% оригинал</b><span>Прямые поставки из Кореи, сертификаты качества</span></div><div><em>💬</em><b>Консультация бесплатно</b><span>Подберём уход под ваш тип кожи в Telegram</span></div><div><em>🚚</em><b>Доставка за 1 день</b><span>По Ташкенту, в регионы — за 1–3 дня</span></div><div><em>✦</em><b>Кешбэк до 3%</b><span>Баллы с каждого заказа на следующие покупки</span></div></div>
  <div class="lp-fcols"><div><b>Покупателям</b><a href="delivery.html">Доставка и оплата</a><a href="track.html">Отследить заказ</a><a href="faq.html#returns">Возврат и обмен</a><a href="faq.html">Вопросы и ответы</a></div><div><b>Магазин</b><a href="index.html#catalog">Каталог</a><a href="brands.html">Бренды</a><a href="offers.html">Акции</a><a href="gifts.html">Подарочные сертификаты</a></div><div><b>Luma Beauty</b><a href="about.html">О нас</a><a href="blog.html">Блог</a><a href="account.html">Личный кабинет</a><a href="https://t.me/lumabeautyuzz" target="_blank" rel="noopener">Telegram-канал</a></div><div><b>Мы принимаем</b><div class="lp-pay"><span class="pm-payme">Payme</span><span class="pm-click">CLICK</span></div><small>Безопасная оплата через платёжные системы Узбекистана</small></div></div>`;
  const ft = D.querySelector('body > footer') || D.querySelector('footer');
  ft ? ft.parentNode.insertBefore(f, ft) : D.body.appendChild(f);
};
LP.subscribe = async function (e) {
  e.preventDefault(); const v = D.getElementById('lpNl').value.trim(), m = D.getElementById('lpNlMsg');
  if (v.length < 5) { m.textContent = 'Введите телефон, email или Telegram.'; return }
  const btn = e.target.querySelector('button'); btn.disabled = true;
  const { error } = await LP.sb().from('newsletter_subscribers').insert({ contact: v.slice(0, 120), lang: (W.LUMA_LANG || 'ru') });
  btn.disabled = false;
  if (error) { m.textContent = 'Не удалось подписаться. Попробуйте ещё раз.'; return }
  m.textContent = '🎉 Готово! Вы подписаны — ждите первые акции.'; e.target.reset(); store.set('luma_nl', 1);
};

/* ---------- Header buttons ---------- */
LP.headerButtons = function () {
  const hdr = D.querySelector('body > header') || D.querySelector('header'); if (!hdr || D.getElementById('lpSBtn')) return;
  const sbtn = D.createElement('button'); sbtn.type = 'button'; sbtn.id = 'lpSBtn'; sbtn.className = 'lp-hbtn'; sbtn.setAttribute('aria-label', 'Поиск');
  sbtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  sbtn.onclick = () => LP.openSearch('');
  const mbtn = D.createElement('button'); mbtn.type = 'button'; mbtn.id = 'lpMBtn'; mbtn.className = 'lp-hbtn lp-catbtn'; mbtn.innerHTML = '<span>☰</span> Каталог'; mbtn.onclick = () => LP.openMega();
  { const logo = hdr.querySelector('.logo,.brand'); if (!isIndex) mbtn.classList.add('lp-tab'); if (logo) logo.after(mbtn); else hdr.prepend(mbtn) }
  // keep the language switcher visible when the header nav is collapsed on tablets
  setTimeout(() => { const ls = hdr.querySelector('nav #lang, nav .langsel'); const act = hdr.querySelector('.actions,.lp-acts'); if (ls && act) act.prepend(ls) }, 600);
  const old = hdr.querySelector('button[aria-label="Поиск"]');
  if (old) { old.onclick = () => LP.openSearch(''); old.removeAttribute('onclick') } else { const box = hdr.querySelector('.actions') || hdr.lastElementChild; box && box !== mbtn ? box.prepend(sbtn) : hdr.appendChild(sbtn) }
  // replace in-header nav "Каталог" link with mega
  hdr.querySelectorAll('nav a').forEach(a => { if (/^Каталог/.test(a.textContent.trim())) a.addEventListener('click', ev => { ev.preventDefault(); LP.openMega() }) });
};

/* ---------- Product page ---------- */
const BRANDS = {
  'ottie': { c: 'Южная Корея', d: 'Корейский бренд премиального ухода: линии с золотом, платиной, женьшенем и зелёным чаем.' },
  'eclado': { c: 'Южная Корея', d: 'Корейский бренд ухода и BB-кремов с лёгким покрытием и защитой от солнца.' },
  'кудрявый метод': { c: 'Россия', d: 'Бренд для кудрявых и окрашенных волос: оттеночные шампуни и бальзамы, уход по кудрявому методу.' },
  'french avenue': { c: 'ОАЭ', d: 'Парфюмерный дом из ОАЭ: стойкие восточные и древесные ароматы.' },
  'unni bomnal': { c: 'Южная Корея', d: 'Корейская косметика с центеллой и мягкими формулами для чувствительной кожи.' },
  'dr.setau': { c: 'Южная Корея', d: 'Корейский уход с золотом, пантенолом и пептидами.' },
  'dr. hours': { c: 'Южная Корея', d: 'Корейские кремы с пантенолом и центеллой для восстановления кожи.' },
  'darm': { c: 'Южная Корея', d: 'Корейские солнцезащитные средства с увлажняющей формулой.' },
  'milowi': { c: 'Южная Корея', d: 'Корейские средства для лица и тела: SPF-стики, пилинги и осветляющие кремы.' }
};
const HOWTO = {
  clean: 'Нанесите небольшое количество на влажную кожу, вспеньте и помассируйте 30–60 секунд. Смойте тёплой водой. Утром и вечером.',
  toner: 'После умывания нанесите на ладони или ватный диск и распределите по лицу похлопывающими движениями. Можно в 2–3 слоя.',
  serum: 'После тонера нанесите 2–3 капли на лицо и шею, распределите лёгкими похлопываниями до впитывания. Затем крем.',
  cream: 'Последним шагом ухода нанесите небольшое количество на лицо и шею по массажным линиям. Утром — под SPF.',
  eye: 'Возьмите количество с рисовое зерно и распределите безымянным пальцем по орбитальной кости, не растягивая кожу.',
  makeup: 'Нанесите спонжем или пуховкой лёгкими похлопываниями от центра лица к краям. Наслаивайте для большего покрытия.',
  spf: 'Последним шагом утреннего ухода, за 15 минут до выхода на улицу. Обновляйте каждые 2–3 часа на солнце.',
  set: 'Используйте средства по порядку: очищение → тонер → сыворотка → крем. Подробности — на упаковке каждого средства.',
  shower: 'Нанесите на влажную кожу или мочалку, вспеньте и смойте тёплой водой.',
  lotion: 'Нанесите на чистую сухую кожу тела после душа массажными движениями до впитывания.',
  scrub: 'На влажную кожу тела круговыми движениями 1–2 раза в неделю. Смойте. Не используйте на раздражённой коже.',
  hand: 'Нанесите на чистые руки и помассируйте до впитывания. Обновляйте после мытья рук.',
  oil: 'Разогрейте несколько капель в ладонях и нанесите на кожу массажными движениями.',
  shampoo: 'Нанесите на влажные волосы, помассируйте кожу головы, смойте. При необходимости повторите. Затем кондиционер.',
  cond: 'После шампуня распределите по длине волос, отступив от корней. Подержите 2–3 минуты и смойте.',
  hmask: 'Нанесите на чистые влажные волосы по длине на 5–10 минут, затем тщательно смойте.',
  tint: 'Нанесите на влажные волосы на 1–5 минут (начните с меньшего времени), смойте. 1–2 раза в неделю.',
  style: 'Распределите по влажным волосам, сожмите пряди снизу вверх и высушите диффузором или естественно.',
  perfume: 'Нанесите на пульсовые точки: запястья, шею, за ушами. Не растирайте — так аромат раскроется полностью.',
  cert: 'Код сертификата появится в личном кабинете после оплаты. Введите его при оформлении заказа в поле «Код подарочного сертификата».'
};
LP.productPage = async function () {
  let tries = 0; while ((typeof product === 'undefined' || !product || !D.querySelector('#content .layout')) && tries++ < 60) await new Promise(r => setTimeout(r, 200));
  let pr; try { pr = product } catch (e) { return } if (!pr) return;
  const p = norm(pr); LP.pushRecent(p.id);
  const list = await LP.products(); await LP.loadHits();
  const g = LP.tags(p);
  // breadcrumbs: category › type
  const cr = D.querySelector('.crumb'); if (cr) { const ty = g.ty; cr.innerHTML = `<a href="index.html">⌂ Главная</a>　›　<a href="index.html#catalog">Каталог</a>　›　<a href="index.html?cat=${encodeURIComponent(p.c)}#catalog">${esc(p.c)}</a>${ty ? `　›　<a href="index.html?type=${ty}#catalog">${esc(LP.typeLabel(ty))}</a>` : ''}　›　<span id="crumbName">${esc(p.t)}</span>` }
  // prev / next
  const same = list.filter(x => x.c === p.c); const at = same.findIndex(x => String(x.id) === String(p.id));
  if (at >= 0 && same.length > 1 && cr) { const pv = same[(at - 1 + same.length) % same.length], nx = same[(at + 1) % same.length]; cr.insertAdjacentHTML('afterend', `<div class="lp-pn"><a href="product.html?id=${encodeURIComponent(pv.id)}" title="${esc(pv.t)}">‹ Предыдущий</a><span>${at + 1} / ${same.length}</span><a href="product.html?id=${encodeURIComponent(nx.id)}" title="${esc(nx.t)}">Следующий ›</a></div>`) }
  // badges + views + savings + delivery
  const info = D.querySelector('.info'); const row = info && info.querySelector('.price-row');
  if (info) {
    const tg = LP.hitIds.has(String(p.id)) ? '<span class="lp-b lp-hit">HIT</span>' : (LP.newIds.has(String(p.id)) ? '<span class="lp-b lp-new">NEW</span>' : '');
    const pill = info.querySelector('.pill'); if (pill && tg) pill.insertAdjacentHTML('afterend', tg);
    if (row && p.d) row.insertAdjacentHTML('beforeend', `<small class="lp-save">Экономия ${money(p.p - sale(p))}</small>`);
    try { const ses = 'lpv_' + p.id; const { data: n } = await LP.sb().rpc('track_view', { pid: p.id }); if (!sessionStorage.getItem(ses)) sessionStorage.setItem(ses, 1); if (n >= 3 && row) row.insertAdjacentHTML('beforebegin', `<div class="lp-views">👀 <b>${n}</b> ${n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'человека смотрели' : 'человек смотрели'} этот товар за 3 часа</div>`) } catch (e) { }
    const buy = info.querySelector('.buyrow');
    if (buy && p.c !== 'Сертификаты') {
      const s = LP.shop, c = LP.city(), sp = sale(p), fee = LP.fee(sp);
      buy.insertAdjacentHTML('afterend', `<div class="lp-dbox"><div><b>🚚 Доставка: ${esc(LP.cityName(c))}</b> <button type="button" onclick="LP.pickCity()">изменить</button><span>${c === 'tashkent' ? 'Сегодня или завтра' : '1–3 дня'} · ${fee ? money(fee) : 'бесплатно'}${fee ? ` · бесплатно от ${money(s.free_from)}` : ''}</span></div><div><b>🏬 Самовывоз</b><span>Ташкент, Order Plaza — бесплатно</span></div><div><b>↩ Возврат</b><span>10 дней, если упаковка не вскрыта · <a href="faq.html#returns">условия</a></span></div><div><b>💬 Нужна консультация?</b><span><a href="https://t.me/${esc((W.CFG && W.CFG.TG_USER) || 'lumabeautyuzz')}" target="_blank" rel="noopener">Спросить в Telegram</a> · подберём уход бесплатно</span></div></div>`);
    }
  }
  // extra tabs: how to use, brand
  const tabs = D.querySelector('.details .tabs'), panels = D.querySelector('.details .panels');
  if (tabs && panels && !D.getElementById('tabHow')) {
    const bk = BRANDS[(p.k || '').toLowerCase()]; const bn = list.filter(x => x.k && x.k === p.k).length;
    tabs.insertAdjacentHTML('beforeend', `<button class="tab" data-tab="how" onclick="document.getElementById('tabHow').scrollIntoView({block:'nearest',behavior:'smooth'})">Применение</button>${p.k && bn > 1 ? `<button class="tab" data-tab="brand" onclick="document.getElementById('tabBrand').scrollIntoView({block:'nearest',behavior:'smooth'})">О бренде</button>` : ''}`);
    panels.insertAdjacentHTML('beforeend', `<article class="panel" id="tabHow"><h3>Как применять</h3><p>${esc(HOWTO[g.ty] || 'Используйте согласно инструкции на упаковке. Перед первым применением сделайте тест на небольшом участке кожи.')}</p></article>${p.k && bn > 1 ? `<article class="panel" id="tabBrand"><h3>О бренде ${esc(p.k)}</h3><p>${bk ? esc(bk.d) + '<br>Страна бренда: <b>' + esc(bk.c) + '</b><br>' : ''}В Luma Beauty: <b>${bn} ${LP.word(bn)}</b> бренда.<br><a class="lp-link" href="index.html?brand=${encodeURIComponent(p.k)}#catalog">Все товары ${esc(p.k)} →</a></p></article>` : ''}`);
  }
  // FBT + Q&A + recent
  const content = D.getElementById('content');
  const rel = content.querySelector('.related');
  const fbt = await LP.fbt(p, list);
  if (fbt) (rel || content.lastChild).insertAdjacentHTML(rel ? 'beforebegin' : 'afterend', fbt);
  const qa = D.createElement('section'); qa.id = 'lpQA'; qa.className = 'lp-qa'; const rv = D.getElementById('reviews'); (rv || rel || content.lastChild).after(qa); LP.loadQA(p.id);
  const rec = await LP.recentRail(p.id); if (rec) content.insertAdjacentHTML('beforeend', rec);
  // sticky add bar (mobile)
  if (p.p && !D.getElementById('lpSticky')) {
    const sb2 = D.createElement('div'); sb2.id = 'lpSticky'; sb2.className = 'lp-sticky';
    sb2.innerHTML = `<div><small>${esc(p.k || p.c)}</small><b>${money(sale(p))}</b></div><button type="button" onclick="addToCart()">В корзину</button>`; D.body.appendChild(sb2);
    const bt = D.querySelector('.buyrow'); if (bt && 'IntersectionObserver' in W) new IntersectionObserver(es => es.forEach(x => sb2.classList.toggle('on', !x.isIntersecting && x.boundingClientRect.top < 0))).observe(bt);
  }
};
LP.fbt = async function (p, list) {
  if (p.c === 'Сертификаты') return '';
  let ids = [];
  try { const { data } = await LP.sb().from('bundles').select('product_ids,title').eq('active', true); (data || []).forEach(b => { const a = (b.product_ids || []).map(x => typeof x === 'object' ? x.id : x); if (a.map(String).includes(String(p.id))) ids.push(...a) }) } catch (e) { }
  let items = [...new Set(ids.map(String))].filter(x => x !== String(p.id)).map(id => list.find(x => String(x.id) === id)).filter(Boolean);
  if (items.length < 2) {
    const g = LP.tags(p); const order = { clean: ['toner', 'serum', 'cream'], toner: ['serum', 'cream', 'clean'], serum: ['toner', 'cream', 'spf'], cream: ['serum', 'eye', 'spf'], eye: ['cream', 'serum'], spf: ['clean', 'cream'], makeup: ['spf', 'clean'], shampoo: ['cond', 'hmask'], cond: ['shampoo', 'hmask'], hmask: ['shampoo', 'cond'], tint: ['tint', 'cond'], shower: ['lotion', 'scrub'], lotion: ['shower', 'hand'], scrub: ['lotion', 'shower'], hand: ['lotion'], oil: ['lotion'], perfume: ['shower', 'lotion'] }[g.ty] || [];
    for (const t of order) { const c = list.find(x => x.p && LP.tags(x).ty === t && String(x.id) !== String(p.id) && !items.includes(x) && (x.k === p.k || !items.some(y => LP.tags(y).ty === t))); if (c) items.push(c) }
  }
  items = items.filter(x => x.p).slice(0, 3); if (!items.length) return '';
  const all = [p, ...items], tot = all.reduce((s, x) => s + sale(x), 0);
  return `<section class="lp-fbt"><h2>С этим товаром покупают</h2><div class="lp-fbtg">${all.map((x, n) => `${n ? '<i>+</i>' : ''}<a href="product.html?id=${encodeURIComponent(x.id)}" class="lp-fbi">${x.i ? `<img src="${esc(x.i)}" alt="" loading="lazy">` : ''}<small>${esc(x.k)}</small><span>${esc(x.t)}</span><b>${money(sale(x))}</b></a>`).join('')}<div class="lp-fbs"><small>Вместе ${all.length} ${LP.word(all.length)}</small><b>${money(tot)}</b><em>${all.length >= 3 ? '🔥 3+ шт — скидка по акции' : ''}</em><button type="button" onclick="LP.addMany(${esc(JSON.stringify(all.map(x => x.id)))})">Добавить всё в корзину</button></div></div></section>`;
};
LP.addMany = ids => { location.href = 'index.html?addmany=' + encodeURIComponent(ids.join(',')) };

/* Q&A */
LP.loadQA = async function (pid) {
  const box = D.getElementById('lpQA'); if (!box) return;
  const { data } = await LP.sb().from('product_questions').select('id,author_name,question,answer,created_at,answered_at').eq('product_id', pid).eq('status', 'published').order('created_at', { ascending: false }).limit(30);
  const L = data || [];
  const dt = s => new Date(s).toLocaleDateString(W.LUMA_LANG === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  box.innerHTML = `<div class="lp-qah"><h2>Вопросы и ответы</h2><span>${L.length ? L.length + ' ' + (L.length % 10 === 1 && L.length % 100 !== 11 ? 'вопрос' : (L.length % 10 >= 2 && L.length % 10 <= 4 && (L.length % 100 < 10 || L.length % 100 >= 20) ? 'вопроса' : 'вопросов')) : ''}</span></div>
  <form class="lp-qaf" onsubmit="LP.askQ(event,${JSON.stringify(pid)})"><textarea id="lpQ" required minlength="5" maxlength="500" rows="2" placeholder="Задайте вопрос о товаре: подойдёт ли моей коже, как сочетать, объём…"></textarea><div><input id="lpQn" maxlength="40" placeholder="Ваше имя (необязательно)"><button>Задать вопрос</button></div><p id="lpQm" class="lp-mu">Отвечаем в течение дня. Вопрос появится на странице после ответа.</p></form>
  ${L.length ? L.map(r => `<article class="lp-qi"><div class="lp-qq"><em>В</em><div><b>${esc(r.question)}</b><small>${esc(r.author_name || 'Покупатель')} · ${dt(r.created_at)}</small></div></div>${r.answer ? `<div class="lp-qa2"><em>О</em><div><span>${esc(r.answer)}</span><small>Ответ Luma Beauty${r.answered_at ? ' · ' + dt(r.answered_at) : ''}</small></div></div>` : ''}</article>`).join('') : '<p class="lp-mu lp-qe">Пока нет вопросов. Спросите первым — эксперт Luma Beauty ответит.</p>'}`;
};
LP.askQ = async function (e, pid) {
  e.preventDefault(); const q = D.getElementById('lpQ').value.trim(), n = D.getElementById('lpQn').value.trim(), m = D.getElementById('lpQm');
  if (q.length < 5) { m.textContent = 'Вопрос слишком короткий.'; return }
  const b = e.target.querySelector('button'); b.disabled = true;
  const { error } = await LP.sb().from('product_questions').insert({ product_id: pid, question: q.slice(0, 500), author_name: n.slice(0, 40) || null });
  b.disabled = false;
  if (error) { m.textContent = 'Не удалось отправить вопрос. Попробуйте ещё раз.'; return }
  e.target.reset(); m.textContent = '✓ Спасибо! Вопрос отправлен — ответим в течение дня.'; m.className = 'lp-mu lp-ok';
};

/* ---------- Index init ---------- */
LP.indexInit = async function () {
  let tries = 0; while ((typeof P === 'undefined' || !P.length) && tries++ < 80) await new Promise(r => setTimeout(r, 150));
  // wrap render / upd / resetFilters / payStep
  if (typeof W.render === 'function' && !W.render.__lp) { const r0 = W.render; W.render = function () { const x = r0.apply(this, arguments); try { LP.crumb(); LP.enhanceCards() } catch (e) { console.error(e) } return x }; W.render.__lp = 1 }
  if (typeof W.upd === 'function' && !W.upd.__lp) { const u0 = W.upd; W.upd = function () { const x = u0.apply(this, arguments); try { LP.syncActs(); LP.paintCartBars(); LP.navCount() } catch (e) { } return x }; W.upd.__lp = 1 }
  if (typeof W.resetFilters === 'function' && !W.resetFilters.__lp) { const f0 = W.resetFilters; W.resetFilters = function () { LP.f = { t: '', sk: '', cn: '', ing: '' }; LP.syncFilterUI(); return f0.apply(this, arguments) }; W.resetFilters.__lp = 1 }
  if (typeof W.payStep === 'function' && !W.payStep.__lp) { const p0 = W.payStep; W.payStep = async function () { const x = await p0.apply(this, arguments); try { LP.payExtras() } catch (e) { console.error(e) } return x }; W.payStep.__lp = 1 }
  LP.filterUI();
  const chipsEl = D.getElementById('chips'); if (chipsEl) chipsEl.addEventListener('click', e => { const c = e.target && e.target.dataset && e.target.dataset.c; if (!c || !LP.f.t) return; const t = TYPES.find(x => x.k === LP.f.t); if (!t || !t.c.includes(c)) { LP.f.t = ''; LP.syncFilterUI() } }, true);
  if (typeof W.setCategory === 'function' && !W.setCategory.__lp) { const s0 = W.setCategory; W.setCategory = function (c) { if (LP.f.t) { const t = TYPES.find(x => x.k === LP.f.t); if (!t || !t.c.includes(c)) LP.f.t = '' } LP.syncFilterUI(); return s0.apply(this, arguments) }; W.setCategory.__lp = 1 }
  // url params
  const sp = new URLSearchParams(location.search);
  if (sp.get('type')) LP.f.t = sp.get('type'); if (sp.get('concern')) LP.f.cn = sp.get('concern');
  if (sp.get('cat')) LP.setCat(sp.get('cat'));
  if (sp.get('brand')) { try { fB = sp.get('brand') } catch (e) { } const s = D.getElementById('fBrand'); if (s) s.value = sp.get('brand') }
  if (sp.get('q')) { LP.setQ(sp.get('q').toLowerCase()); const s = D.querySelector('.sq'); if (s) s.value = sp.get('q') }
  if (sp.get('addmany')) { sp.get('addmany').split(',').forEach(id => { const i = P.findIndex(p => String(p.id) === id); if (i >= 0) cart[i] = (cart[i] || 0) + 1 }); (typeof cartSave==='function'?cartSave():LS.set('luma_cart', cart)); upd(); toast('Добавлено в корзину'); D.getElementById('dr').classList.add('open') }
  if ([...sp.keys()].some(k => ['type', 'concern', 'cat', 'brand', 'q', 'addmany'].includes(k))) { history.replaceState(null, '', location.pathname + location.hash); setTimeout(() => { const c = D.getElementById('catalog'); if (c && location.hash === '#catalog') c.scrollIntoView() }, 400) }
  if (location.hash === '#cart') { D.getElementById('dr').classList.add('open'); history.replaceState(null, '', location.pathname) }
  LP.syncFilterUI();
  await LP.loadHits();
  render();
  // sections
  const st = D.createElement('section'); st.className = 'lp-stwrap'; st.id = 'lpStories';
  const cats = D.querySelector('.bloom-categories'); (cats || D.getElementById('catalog')).before(st); LP.storiesRow(st);
  const anchor = D.querySelector('.brand-marquee') || cats;
  const hitsT = LP.hits.length >= 4 ? 'Хиты продаж' : 'Популярное сейчас';
  const hitsList = (LP.hits.length >= 4 ? LP.hits : P.filter(p => p.c !== 'Сертификаты' && p.i && (p.d || (typeof RV !== 'undefined' && RV[p.id])))).slice(0, 12);
  const pop = hitsList.length >= 4 ? hitsList : P.filter(p => p.c !== 'Сертификаты' && p.i).slice(0, 12);
  const html = LP.rail('lpHits', hitsT, LP.hits.length >= 4 ? 'Что чаще всего покупают в Luma Beauty' : 'Товары, которые выбирают чаще всего', pop, { rank: LP.hits.length >= 4 }) + LP.rail('lpNew', 'Новинки', 'Только что приехали из Кореи', LP.fresh || []) + LP.collectionsHTML(P);
  if (anchor) anchor.insertAdjacentHTML('afterend', html);
  const rec = await LP.recentRail(); const catEl = D.getElementById('catalog'); if (rec && catEl) catEl.insertAdjacentHTML('afterend', rec);
  // search box -> live dropdown
  const sq = D.querySelector('.sq'); if (sq) { sq.setAttribute('readonly', 'readonly'); sq.addEventListener('click', () => LP.openSearch(sq.value)); sq.addEventListener('focus', () => { sq.blur(); LP.openSearch(sq.value) }) }
  const hb = D.querySelector('.home-benefits'); if (hb) hb.hidden = true;
  LP.paintCartBars();
  // has order flag for "first order" hint
  try { const c = LP.sb(); const { data: { session } } = await c.auth.getSession(); if (session) { const { count } = await c.from('orders').select('id', { count: 'exact', head: true }).neq('status', 'canceled'); store.set('luma_has_order', (count || 0) > 0); LP.paintCartBars() } } catch (e) { }
};

/* ---------- Account: gift certificates ---------- */
LP.accountExtras = async function () {
  const c = LP.sb(); if (!c) return; const { data: { session } } = await c.auth.getSession(); if (!session) return;
  const { data } = await c.from('gift_cards').select('code,amount,balance,active,created_at,order_id').order('created_at', { ascending: false });
  if (!data || !data.length) return;
  const app = D.getElementById('app'); if (!app) return;
  const box = D.createElement('section'); box.className = 'lp-page'; box.id = 'lpGcAcc'; box.style.maxWidth = '820px';
  box.innerHTML = `<div class="lp-card2"><h2>🎀 Мои подарочные сертификаты</h2><p class="lp-mu">Подарите код или используйте сами — введите его при оформлении заказа.</p>${data.map(g => `<div class="lp-prow" style="align-items:center;border-top:1px solid #efdfe3;padding:10px 0"><span><b style="font-family:monospace;font-size:16px;letter-spacing:.06em">${esc(g.code)}</b><br><small class="lp-mu">Номинал ${money(g.amount)} · заказ №${g.order_id || '—'}</small></span><span style="text-align:right"><b>${money(g.balance)}</b><br><button type="button" class="lp-link" style="border:0;background:none;cursor:pointer" onclick="navigator.clipboard&&navigator.clipboard.writeText('${esc(g.code)}');this.textContent='Скопировано ✓'">Скопировать код</button></span></div>`).join('')}</div>`;
  app.after(box);
};

/* ---------- Boot ---------- */
function boot() {
  LP.utilBar(); LP.headerButtons(); LP.chat(); LP.bottomNav(); LP.footer();
  D.addEventListener('lp:shop', () => { LP.paintUtil(); LP.paintCartBars() });
  D.addEventListener('keydown', e => { if (e.key === 'Escape') { LP.closeMega(); LP.closeSheet(); LP.closeSearch() } if ((e.key === '/' && !/input|textarea|select/i.test((D.activeElement || {}).tagName || ''))) { e.preventDefault(); LP.openSearch('') } });
  if (isIndex) LP.indexInit();
  if (PAGE === 'product') LP.productPage();
  if (PAGE === 'account') setTimeout(LP.accountExtras, 800);
  W.addEventListener('storage', LP.navCount);
}
if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
})();

/* ---------- Creative promo hero (index) ---------- */
(function () {
  const D = document, W = window; if (!W.LP || LP.page !== 'index') return;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => Number(n || 0).toLocaleString('ru-RU').replace(/ | /g, ' ') + ' сум';
  let idx = 0, timer = null, paused = false, slides = [], endAt = null;
  const DUR = 6500;
  const pics = (arr, cls) => arr.filter(Boolean).slice(0, 3).map((u, n) => `<figure class="hp-ph hp-ph${n + 1} ${cls || ''}"><img src="${esc(u)}" alt="" loading="${n ? 'lazy' : 'eager'}"></figure>`).join('');
  function pad(n) { return String(n).padStart(2, '0') }
  const PRODUCT = id => (typeof P !== 'undefined' ? P.find(p => String(p.id) === String(id)) : null);
  const ai = (img, pid, minis) => { const pr = PRODUCT(pid); const m = (minis || []).filter(Boolean).slice(0, 2); return `<a class="hp-ai" href="${pr ? 'product.html?id=' + encodeURIComponent(pr.id) : '#catalog'}" aria-label="${esc(pr ? pr.t : 'Luma Beauty')}"><img src="img/${img}" alt="${esc(pr ? pr.t : 'Luma Beauty')}" loading="lazy"><span class="hp-shine"></span>${pr && pr.p ? `<span class="hp-tag"><small>${esc(pr.k)}</small><b>${money(LP.sale(pr))}</b></span>` : ''}</a>${m.map((u, n) => `<figure class="hp-mini hp-mini${n + 1}"><img src="${esc(u)}" alt="" loading="lazy"></figure>`).join('')}` };
  function tick() {
    if (!endAt) return; const l = Math.max(0, endAt - Date.now());
    const d = Math.floor(l / 864e5), h = Math.floor(l % 864e5 / 36e5), m = Math.floor(l % 36e5 / 6e4), s = Math.floor(l % 6e4 / 1e3);
    D.querySelectorAll('.hp-cd').forEach(e => e.innerHTML = `<span><b>${d}</b><small>дн</small></span><span><b>${pad(h)}</b><small>час</small></span><span><b>${pad(m)}</b><small>мин</small></span><span><b>${pad(s)}</b><small>сек</small></span>`);
  }
  async function build() {
    let tries = 0; while ((typeof P === 'undefined' || !P.length) && tries++ < 80) await new Promise(r => setTimeout(r, 150));
    const old = D.querySelector('.luma-hero'); if (!old || D.getElementById('lpHeroP')) return;
    const c = LP.sb(); const L = P.filter(p => p.i && p.c !== 'Сертификаты');
    const by = ids => ids.map(id => L.find(p => String(p.id) === String(id))).filter(Boolean).map(p => p.i);
    let heroPh = []; try { const { data } = await c.from('home_hero').select('photos').eq('id', 1).maybeSingle(); if (Array.isArray(data?.photos)) heroPh = data.photos.filter(Boolean) } catch (e) { }
    let bp = null, bundles = []; try { const [a, b] = await Promise.all([c.from('site_settings').select('value').eq('key', 'bulk_promo').maybeSingle(), c.from('bundles').select('product_ids').eq('active', true).order('sort').limit(2)]); bp = a.data && a.data.value; bundles = b.data || [] } catch (e) { }
    await LP.shopReady; if (!LP.fresh) await LP.loadHits();
    const s = LP.shop, hits = (LP.hits.length ? LP.hits : L).map(p => p.i), fresh = (LP.fresh || []).map(p => p.i).filter(Boolean);
    const bundlePh = bundles.length ? by(bundles[0].product_ids || []) : hits;
    const cica = L.filter(p => LP.tags(p).ing.includes('cica')).map(p => p.i);
    const gc = P.filter(p => p.c === 'Сертификаты').sort((a, b) => b.p - a.p).map(p => p.i);
    slides = [];
    slides.push({ k: 'brand', cls: 'hp-brand', html: `<div class="hp-copy"><span class="hp-eye">LUMA BEAUTY · КОРЕЙСКАЯ КОСМЕТИКА</span><h2 class="hp-t">Искусство<br>быть <em>собой</em></h2><p class="hp-p">Премиальный уход из Кореи для вашей естественной красоты — 100% оригинал и доставка по всему Узбекистану.</p><div class="hp-btns"><a class="hp-cta" href="#catalog">Открыть каталог <span>→</span></a><a class="hp-ghost" href="https://www.instagram.com/lumabeautyuz/" target="_blank" rel="noopener">Instagram ↗</a></div></div><div class="hp-art">${ai('hero-brand.jpg', 307, [])}<span class="hp-stk hp-stk1">100%<br><small>оригинал</small></span><svg class="hp-ring" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="hpc" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"/></defs><text><textPath href="#hpc">BEAUTY IS A RITUAL • LUMA BEAUTY • KOREAN CARE • </textPath></text></svg></div>` });
    if (bp && bp.active && new Date(bp.ends_at) > Date.now()) {
      endAt = new Date(bp.ends_at).getTime(); const top = (bp.tiers || []).slice().sort((a, b) => b.pct - a.pct)[0] || { min: 3, pct: 10 };
      slides.push({ k: 'week', cls: 'hp-week', html: `<div class="hp-copy"><span class="hp-eye">🔥 АКЦИЯ НЕДЕЛИ</span><h2 class="hp-t hp-big"><span class="hp-num">−${top.pct}%</span><br>за ${top.min} товара</h2><p class="hp-p">${(bp.tiers || []).map(t => `${t.min} товара — −${t.pct}%`).join(' · ')}. Скидка применится в корзине сама.</p><div class="hp-cd"></div><div class="hp-btns"><a class="hp-cta" href="#bundles" onclick="if(typeof goBundles==='function'){goBundles();return false}">Собрать набор <span>→</span></a></div></div><div class="hp-art">${ai('hero-week.jpg', 290, bundlePh.slice(0, 1))}<span class="hp-stk hp-stk2"><small>${top.min} товара</small><b>−${top.pct}%</b></span></div>` });
    }
    slides.push({ k: 'new', cls: 'hp-first', html: `<div class="hp-copy"><span class="hp-eye">ДЛЯ НОВЫХ ПОКУПАТЕЛЕЙ</span><h2 class="hp-t">Первый заказ<br><em>−10%</em></h2><p class="hp-p">Введите промокод в корзине — скидка на весь первый заказ.</p><button type="button" class="hp-ticket" onclick="try{navigator.clipboard.writeText('NEW')}catch(e){};this.classList.add('ok');this.querySelector('small').textContent='Скопировано ✓'"><span>ПРОМОКОД</span><b>NEW</b><small>Нажмите, чтобы скопировать</small></button></div><div class="hp-art">${ai('hero-first.jpg', 294, [])}<span class="hp-stk hp-stk3">NEW</span></div>` });
    slides.push({ k: 'quiz', cls: 'hp-quiz', html: `<div class="hp-copy"><span class="hp-eye">🧪 SKIN LAB · 1 МИНУТА</span><h2 class="hp-t">Не знаете,<br>что <em>подойдёт?</em></h2><p class="hp-p">Ответьте на 4 вопроса — соберём уход под ваш тип кожи: очищение, тонер, сыворотка, крем и SPF.</p><div class="hp-chips"><span>Сухая</span><span>Жирная</span><span>Чувствительная</span><span>Комбинированная</span></div><div class="hp-btns"><button type="button" class="hp-cta" onclick="if(typeof goSkin==='function')goSkin()">Пройти тест <span>→</span></button></div></div><div class="hp-art">${ai('hero-quiz.jpg', 300, [])}<span class="hp-stk hp-stk4">✓ ваш<br>уход</span></div>` });
    if (gc.length) slides.push({ k: 'gift', cls: 'hp-gift', html: `<div class="hp-copy"><span class="hp-eye">🎀 ПОДАРОЧНЫЙ СЕРТИФИКАТ</span><h2 class="hp-t">Подарок,<br>который <em>точно</em><br>понравится</h2><p class="hp-p">200 000 · 500 000 · 1 000 000 сум. Код придёт сразу после оплаты, тратится частями.</p><div class="hp-btns"><a class="hp-cta" href="gifts.html">Выбрать подарок <span>→</span></a></div></div><div class="hp-art">${ai('hero-gift.jpg', 293, [gc[0]])}<span class="hp-stk hp-stk5">🎁</span></div>` });
    if (s.free_from) slides.push({ k: 'del', cls: 'hp-del', html: `<div class="hp-copy"><span class="hp-eye">🚚 ДОСТАВКА ПО УЗБЕКИСТАНУ</span><h2 class="hp-t">Бесплатно<br>от <em>${money(s.free_from).replace(' сум', '')}</em> сум</h2><p class="hp-p">По Ташкенту — в день заказа или завтра.${s.gift_active ? ` А от ${money(s.gift_from)} — ${esc(s.gift_text).toLowerCase()}.` : ''}</p><div class="hp-btns"><a class="hp-cta" href="#catalog">За покупками <span>→</span></a><a class="hp-ghost" href="delivery.html">Условия</a></div></div><div class="hp-art">${ai('hero-del.jpg', 288, [])}<span class="hp-stk hp-stk6">0 сум<br><small>доставка</small></span></div>` });
    const h = D.createElement('section'); h.id = 'lpHeroP'; h.className = 'hp'; h.setAttribute('aria-roledescription', 'carousel');
    h.innerHTML = `<div class="hp-track">${slides.map((x, n) => `<article class="hp-s ${x.cls}${n ? '' : ' on'}" aria-hidden="${n ? 'true' : 'false'}">${x.html}</article>`).join('')}</div><div class="hp-nav"><button type="button" class="hp-arr" aria-label="Назад" onclick="LP.heroGo(-1,1)">‹</button><div class="hp-dots">${slides.map((x, n) => `<button type="button" class="hp-dot${n ? '' : ' on'}" aria-label="Слайд ${n + 1}" onclick="LP.heroTo(${n})"><i></i></button>`).join('')}</div><button type="button" class="hp-arr" aria-label="Вперёд" onclick="LP.heroGo(1,1)">›</button></div>`;
    old.before(h); old.hidden = true; old.style.display = 'none'; const sk = D.getElementById('heroSkel'); sk && sk.remove(); D.documentElement.classList.remove('hero-fallback');
    h.addEventListener('mouseenter', () => { paused = true; h.classList.add('paused') }); h.addEventListener('mouseleave', () => { paused = false; h.classList.remove('paused') });
    let x0 = 0; h.addEventListener('touchstart', e => { x0 = e.touches[0].clientX }, { passive: true }); h.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 45) LP.heroGo(dx < 0 ? 1 : -1, 1) }, { passive: true });
    tick(); setInterval(tick, 1000); LP.heroTo(0);
  }
  LP.heroTo = function (n) {
    const h = D.getElementById('lpHeroP'); if (!h) return; idx = (n + slides.length) % slides.length;
    h.querySelectorAll('.hp-s').forEach((e, i) => { e.classList.toggle('on', i === idx); e.setAttribute('aria-hidden', i === idx ? 'false' : 'true') });
    h.querySelectorAll('.hp-dot').forEach((e, i) => { e.classList.toggle('on', i === idx); e.classList.toggle('done', i < idx) });
    const dot = h.querySelectorAll('.hp-dot i')[idx]; if (dot) { dot.style.animation = 'none'; void dot.offsetWidth; dot.style.animation = '' }
    clearTimeout(timer); const loop = () => { if (paused || D.hidden) { timer = setTimeout(loop, 800); return } LP.heroTo(idx + 1) }; timer = setTimeout(loop, DUR);
  };
  LP.heroGo = (d) => LP.heroTo(idx + d);
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', build); else build();
})();
