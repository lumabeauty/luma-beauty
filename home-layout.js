/* Luma Beauty — порядок и компактность блоков главной страницы */
(function (W, D) {
  'use strict';
  var LIMIT = 20;

  var css = [
    /* одна полоса сверху */
    '.lw-top{display:flex;align-items:stretch;background:#2a1e22;position:relative;z-index:80}',
    '.lw-top>#lpUtil{flex:1 1 auto;min-width:0;background:transparent;padding-right:12px}',
    '.lw-top>#promoBar{flex:0 1 auto;background:transparent!important;border-left:1px solid rgba(255,255,255,.12)}',
    '.lw-top>#promoBar .pb-main{padding-top:4px!important;padding-bottom:4px!important;font-size:12.5px}',
    '.lw-top #lpUtil .lp-ulinks a:not([href^="tel"]){display:none}',
    '@media(max-width:1100px){.lw-top{flex-direction:column}.lw-top>#promoBar{border-left:0;border-top:1px solid rgba(255,255,255,.1)}.lw-top #lpUtil .lp-ulinks{display:none}}',
    /* преимущества под баннером */
    '.lw-trust{max-width:1280px;margin:18px auto 0;padding:0 16px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;font-family:Jost,Arial,sans-serif}',
    '.lw-trust>div{display:grid;grid-template-columns:38px 1fr;column-gap:12px;align-items:center;background:#fff;border:1px solid #f1dfe5;border-radius:18px;padding:12px 16px}',
    '.lw-trust>div>em{grid-row:span 2}',
    'html.lw-home .home-benefits{display:none!important}',
    '.lw-trust em{flex:none;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#fdeef2;color:#c9364b;font-style:normal;font-size:17px}',
    '.lw-trust b{display:block;font-size:14.5px;color:#2b1d22}',
    '.lw-trust span{display:block;font-size:12.5px;color:#8a7178;line-height:1.35}',
    '@media(max-width:900px){.lw-trust{grid-template-columns:repeat(2,1fr);gap:8px;padding:0 10px;margin-top:12px}.lw-trust>div{padding:10px 12px;column-gap:9px;grid-template-columns:32px 1fr}.lw-trust span{display:none}.lw-trust em{width:32px;height:32px;font-size:15px}.lw-trust b{font-size:13px}}',
    'html.lw-home #lpFoot .lp-why{display:none}',
    /* наборы — лента */
    '#bundles .bd-rail{position:relative}',
    '#bundles .bd-grid{display:flex!important;gap:18px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;padding:4px 2px 14px;scrollbar-width:thin}',
    '#bundles .bd-grid>*{flex:0 0 calc((100% - 54px)/4);scroll-snap-align:start;min-width:0}',
    '@media(max-width:1100px){#bundles .bd-grid>*{flex-basis:calc((100% - 36px)/3)}}',
    '@media(max-width:760px){#bundles .bd-grid{gap:12px}#bundles .bd-grid>*{flex-basis:80%}}',
    '.bd-arr{position:absolute;top:38%;z-index:3;width:44px;height:44px;border-radius:50%;border:0;background:#fff;color:#2b1d22;font-size:24px;line-height:1;cursor:pointer;box-shadow:0 10px 24px -10px rgba(80,20,40,.45)}',
    '.bd-arr.l{left:-14px}.bd-arr.r{right:-14px}.bd-arr:hover{background:#2b1d22;color:#fff}',
    '@media(max-width:760px){.bd-arr{display:none}}',
    /* каталог: кнопка «показать все» */
    '.cat-more{display:flex;justify-content:center;margin:26px 0 8px}',
    '.cat-more button{border:0;border-radius:99px;background:#2b1d22;color:#fff;font:600 15px Jost,Arial,sans-serif;padding:15px 32px;cursor:pointer;box-shadow:0 14px 30px -16px rgba(43,29,34,.7)}',
    '.cat-more button:hover{background:#c9364b}',
    /* бренды — компактно, одна строка */
    'html.lw-home .brand-marquee{padding-top:34px!important;padding-bottom:34px!important}',
    'html.lw-home .brand-marquee .bm-title{font-size:clamp(30px,4vw,46px)!important;margin-bottom:2px!important}',
    'html.lw-home .brand-marquee .bm-row{margin-top:14px}',
    'html.dark .lw-trust>div{background:#241c20;border-color:#3a2d33}html.dark .lw-trust b{color:#f3e8ec}html.dark .lw-trust em{background:#3a2229}html.dark .bd-arr{background:#2b2226;color:#f3e8ec}'
  ].join('\n');

  function $(s) { return D.querySelector(s); }

  function mergeTop() {
    var u = D.getElementById('lpUtil'), p = D.getElementById('promoBar');
    if (!u || !p || u.parentNode.classList.contains('lw-top')) return;
    var w = D.createElement('div'); w.className = 'lw-top';
    u.parentNode.insertBefore(w, u); w.appendChild(u); w.appendChild(p);
  }

  function trust() {
    if ($('.lw-trust')) return $('.lw-trust');
    var why = $('#lpFoot .lp-why');
    if (!why) return null;
    var t = D.createElement('section'); t.className = 'lw-trust'; t.setAttribute('aria-label', 'Почему Luma Beauty');
    t.innerHTML = why.innerHTML;
    return t;
  }

  function brands() {
    var bm = $('.brand-marquee'); if (!bm || bm.dataset.lw) return;
    var have = {};
    try { (typeof P !== 'undefined' ? P : []).forEach(function (p) { if (p.k) have[String(p.k).toLowerCase()] = 1; }); } catch (e) { }
    if (!Object.keys(have).length) return; // ждём каталог
    var seen = {}, names = [];
    bm.querySelectorAll('.bm-pill:not([aria-hidden])').forEach(function (b) {
      var n = b.textContent.trim(), k = n.toLowerCase();
      if (seen[k] || !have[k]) return; seen[k] = 1; names.push(n);
    });
    if (!names.length) return;
    var pill = function (n, dup) { return '<button type="button" class="bm-pill"' + (dup ? ' aria-hidden="true" tabindex="-1"' : '') + ' onclick="brandPick(this)">' + n.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</button>'; };
    var rows = bm.querySelectorAll('.bm-row');
    rows.forEach(function (r, i) { if (i) r.remove(); });
    if (rows[0]) {
      rows[0].style.setProperty('--d', Math.max(30, names.length * 3.2) + 's');
      rows[0].querySelector('.bm-track').innerHTML = names.map(function (n) { return pill(n); }).join('') + names.map(function (n) { return pill(n, 1); }).join('');
    }
    bm.dataset.lw = '1';
  }

  function bundleArrows() {
    var g = D.getElementById('bdGrid'); if (!g || g.parentNode.classList.contains('bd-rail')) return;
    var r = D.createElement('div'); r.className = 'bd-rail'; g.parentNode.insertBefore(r, g); r.appendChild(g);
    var mk = function (cls, dir, txt) { var b = D.createElement('button'); b.type = 'button'; b.className = 'bd-arr ' + cls; b.setAttribute('aria-label', dir < 0 ? 'Назад' : 'Вперёд'); b.textContent = txt; b.onclick = function () { g.scrollBy({ left: dir * g.clientWidth * 0.9 }); }; return b; };
    r.appendChild(mk('l', -1, '‹')); r.appendChild(mk('r', 1, '›'));
  }

  W.catMore = function (total) {
    var g = D.getElementById('grid'); if (!g) return;
    var box = D.getElementById('catMore');
    if (W.CAT_ALL || total <= LIMIT) { if (box) box.remove(); return; }
    if (!box) { box = D.createElement('div'); box.id = 'catMore'; box.className = 'cat-more'; g.after(box); }
    var L = { ru: 'Показать все товары', en: 'Show all products', uz: 'Barcha mahsulotlar', kk: 'Барлық тауарлар', ko: '전체 상품 보기' }[W.LUMA_LANG || D.documentElement.lang || 'ru'] || 'Показать все товары';
    box.innerHTML = '<button type="button" data-noi18n>' + L + ' (' + total + ')</button>';
    box.firstChild.onclick = function () { W.CAT_ALL = true; if (typeof W.render === 'function') W.render(); };
  };

  function arrange() {
    var hero = D.getElementById('lpHeroP') || $('.luma-hero');
    if (!hero) return false;
    var ins = $('.bloom-insta'); if (ins) ins.remove();
    var order = [trust(), D.getElementById('lpStories'), $('.bloom-categories'), D.getElementById('lpHits'), D.getElementById('bundles'),
      D.getElementById('lpNew'), D.getElementById('collections'), D.getElementById('skinHelp'), D.getElementById('catalog'),
      D.getElementById('lpRecent'), $('.brand-marquee')];
    var anchor = hero.classList.contains('luma-hero') ? hero : ($('.luma-hero') || hero);
    order.forEach(function (el) { if (!el) return; if (anchor.nextElementSibling !== el) anchor.after(el); anchor = el; });
    mergeTop(); brands(); bundleArrows();
    return !!D.getElementById('lpHits');
  }

  function init() {
    D.documentElement.classList.add('lw-home');
    var st = D.createElement('style'); st.id = 'home-layout-css'; st.textContent = css; D.head.appendChild(st);
    var ok = 0, ticks = 0, t = setInterval(function () { ticks++; if (arrange()) ok++; if (ok > 3 || ticks > 60) clearInterval(t); }, 400);
    setTimeout(arrange, 6000); setTimeout(arrange, 12000);
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})(window, document);
