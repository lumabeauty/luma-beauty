/* Luma Beauty — мобильное приложение: верхняя панель, нижняя навигация, шторки фильтров
   и сортировки, панель покупки, меню профиля. Работает только при html.lapp.
   Использует существующие функции сайта (render, add, buy, showFavorites, LP.*), данные не меняет. */
(function (W, D) {
  'use strict';
  var H = D.documentElement;
  if (!H.classList.contains('lapp')) return;

  var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var PG = path === '' || path === 'index.html' ? 'index' : path.replace('.html', '');
  H.classList.add(PG === 'index' ? 'ap-i' : PG === 'product' ? 'ap-p' : PG === 'account' ? 'ap-a' : 'ap-o');

  /* ---------- тексты на 5 языках ---------- */
  var T = {
    ru: { home: 'Главная', cat: 'Каталог', fav: 'Избранное', cart: 'Корзина', prof: 'Профиль', search: 'Поиск', back: 'Назад', filters: 'Фильтры', sort: 'Сортировка', reset: 'Сбросить', show: 'Показать', goods: 'товаров', category: 'Категория', all: 'Все', inStock: 'В наличии', left: 'Осталось {n} шт.', out: 'Нет в наличии', wheelT: 'Барабан удачи', wheelS: 'Сертификат до 15 000 сум каждый день', skinT: 'Тест кожи', skinS: '4 вопроса — и готовый уход', daily: 'Каждый день', lab: 'Skin Lab', addCart: 'В корзину', buyNow: 'Купить', orders: 'Мои заказы', track: 'Отследить заказ', chat: 'Консультация', chatS: 'Поможем подобрать уход', theme: 'Тёмная тема', lang: 'Язык', delivery: 'Доставка и оплата', help: 'Помощь', more: 'Ещё', gifts: 'Подарочные сертификаты', done: 'Готово' },
    uz: { home: 'Asosiy', cat: 'Katalog', fav: 'Sevimlilar', cart: 'Savat', prof: 'Profil', search: 'Qidiruv', back: 'Orqaga', filters: 'Filtrlar', sort: 'Saralash', reset: 'Tozalash', show: 'Ko‘rsatish', goods: 'ta mahsulot', category: 'Kategoriya', all: 'Barchasi', inStock: 'Mavjud', left: '{n} dona qoldi', out: 'Mavjud emas', wheelT: 'Omad barabani', wheelS: 'Har kuni 15 000 so‘mgacha sertifikat', skinT: 'Teri testi', skinS: '4 savol — tayyor parvarish', daily: 'Har kuni', lab: 'Skin Lab', addCart: 'Savatga', buyNow: 'Sotib olish', orders: 'Buyurtmalarim', track: 'Buyurtmani kuzatish', chat: 'Maslahat', chatS: 'Parvarish tanlashga yordam beramiz', theme: 'Tungi rejim', lang: 'Til', delivery: 'Yetkazish va to‘lov', help: 'Yordam', more: 'Yana', gifts: 'Sovg‘a sertifikatlari', done: 'Tayyor' },
    en: { home: 'Home', cat: 'Catalog', fav: 'Favorites', cart: 'Bag', prof: 'Profile', search: 'Search', back: 'Back', filters: 'Filters', sort: 'Sort', reset: 'Reset', show: 'Show', goods: 'products', category: 'Category', all: 'All', inStock: 'In stock', left: 'Only {n} left', out: 'Out of stock', wheelT: 'Lucky wheel', wheelS: 'A gift card up to 15 000 sum daily', skinT: 'Skin test', skinS: '4 questions — your routine', daily: 'Daily', lab: 'Skin Lab', addCart: 'Add to bag', buyNow: 'Buy now', orders: 'My orders', track: 'Track order', chat: 'Consultation', chatS: 'We’ll help you choose', theme: 'Dark theme', lang: 'Language', delivery: 'Delivery & payment', help: 'Help', more: 'More', gifts: 'Gift cards', done: 'Done' },
    kk: { home: 'Басты бет', cat: 'Каталог', fav: 'Таңдаулылар', cart: 'Себет', prof: 'Профиль', search: 'Іздеу', back: 'Артқа', filters: 'Сүзгілер', sort: 'Сұрыптау', reset: 'Тазалау', show: 'Көрсету', goods: 'тауар', category: 'Санат', all: 'Барлығы', inStock: 'Бар', left: '{n} дана қалды', out: 'Жоқ', wheelT: 'Сәттілік барабаны', wheelS: 'Күн сайын 15 000 сұмға дейін сертификат', skinT: 'Тері тесті', skinS: '4 сұрақ — дайын күтім', daily: 'Күн сайын', lab: 'Skin Lab', addCart: 'Себетке', buyNow: 'Сатып алу', orders: 'Тапсырыстарым', track: 'Тапсырысты қадағалау', chat: 'Кеңес', chatS: 'Күтім таңдауға көмектесеміз', theme: 'Қараңғы тақырып', lang: 'Тіл', delivery: 'Жеткізу және төлем', help: 'Көмек', more: 'Тағы', gifts: 'Сыйлық сертификаттары', done: 'Дайын' },
    ko: { home: '홈', cat: '카탈로그', fav: '찜', cart: '장바구니', prof: '프로필', search: '검색', back: '뒤로', filters: '필터', sort: '정렬', reset: '초기화', show: '보기', goods: '개 상품', category: '카테고리', all: '전체', inStock: '재고 있음', left: '{n}개 남음', out: '품절', wheelT: '행운의 룰렛', wheelS: '매일 최대 15 000숨 상품권', skinT: '피부 테스트', skinS: '4가지 질문으로 맞춤 케어', daily: '매일', lab: 'Skin Lab', addCart: '담기', buyNow: '구매', orders: '내 주문', track: '주문 조회', chat: '상담', chatS: '맞춤 케어를 도와드려요', theme: '다크 모드', lang: '언어', delivery: '배송 및 결제', help: '도움말', more: '더보기', gifts: '기프트 카드', done: '완료' }
  };
  function lang() { var l = W.LUMA_LANG || H.lang || 'ru'; l = String(l).slice(0, 2); return T[l] ? l : 'ru'; }
  function t(k, n) { var s = (T[lang()] || T.ru)[k] || T.ru[k] || k; return n != null ? s.replace('{n}', n) : s; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function waitFor(test, cb, max) { var n = 0; (function go() { var v; try { v = test(); } catch (e) { } if (v) return cb(v); if (++n < (max || 120)) setTimeout(go, 250); })(); }
  function has(fn) { return typeof W[fn] === 'function'; }

  var IC = {
    home: '<path d="M3.5 10.5 12 4l8.5 6.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
    cat: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
    fav: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/>',
    cart: '<path d="M5.5 8h13l-1 12h-11z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    prof: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.7 4-5.5 7.5-5.5s6.3 1.8 7.5 5.5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    filt: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    sort: '<path d="M8 5v14M5 16l3 3 3-3M16 19V5M13 8l3-3 3 3"/>'
  };
  function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + IC[k] + '</svg>'; }
  function navSvg(k) { return '<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + '</svg>'; }

  /* ---------- корзина: открыть / число ---------- */
  function openCart() {
    var dr = D.getElementById('dr');
    if (dr && PG === 'index') { dr.classList.add('open'); return; }
    location.href = 'index.html#cart';
  }
  function cartCount() {
    var e = D.getElementById('lpNavCnt') || D.getElementById('cnt') || D.getElementById('cartCount');
    var n = e ? parseInt(e.textContent, 10) || 0 : 0;
    return n;
  }

  /* ---------- верхняя панель ---------- */
  function topBar() {
    if ($('.ap-top')) return;
    var h = D.createElement('header'); h.className = 'ap-top'; h.setAttribute('data-noi18n', '');
    var back = PG === 'index' ? '' : '<button type="button" class="ap-ib ap-back" data-k="back" aria-label="' + t('back') + '">' + svg('back') + '</button>';
    h.innerHTML = back + '<a class="ap-logo" href="index.html" aria-label="Luma Beauty"><img src="img/logo-luma.png" alt="Luma Beauty" width="73" height="30"></a>' +
      '<button type="button" class="ap-ib" data-k="search" aria-label="' + t('search') + '">' + svg('search') + '</button>' +
      '<button type="button" class="ap-ib" data-k="cart" aria-label="' + t('cart') + '">' + svg('cart') + '<em id="apTopCnt"></em></button>';
    D.body.insertBefore(h, D.body.firstChild);
    h.addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]'); if (!b) return;
      var k = b.getAttribute('data-k');
      if (k === 'back') { if (history.length > 1 && D.referrer && D.referrer.indexOf(location.host) > -1) history.back(); else location.href = 'index.html'; }
      if (k === 'search') { if (W.LP && LP.openSearch) LP.openSearch(); else location.href = 'index.html#catalog'; }
      if (k === 'cart') openCart();
    });
    var y0 = -1;
    W.addEventListener('scroll', function () { var y = W.scrollY > 4; if (y !== y0) { y0 = y; h.classList.toggle('sc', y); } }, { passive: true });
    // полоса акции над панелью — внутрь потока, сразу под шапку
    waitFor(function () { return D.getElementById('promoBar'); }, function (pb) {
      var box = pb.closest('.lw-top') || pb; if (box.previousElementSibling !== h && h.nextElementSibling !== box) h.after(box);
    }, 40);
  }

  /* ---------- нижняя навигация ---------- */
  var favMode = false;
  function navHTML() {
    var on = function (k) {
      if (k === 'fav') return favMode;
      if (k === 'home') return PG === 'index' && !favMode;
      if (k === 'prof') return PG === 'account';
      return false;
    };
    var a = function (k, href) { return '<a href="' + href + '" data-k="' + k + '" class="' + (on(k) ? 'on' : '') + '">' + navSvg(k) + '<span>' + t(k) + '</span>' + (k === 'cart' ? '<em id="lpNavCnt"></em>' : '') + '</a>'; };
    return a('home', 'index.html') + a('cat', 'index.html#catalog') + a('fav', 'index.html#fav') + a('cart', 'index.html#cart') + a('prof', 'account.html');
  }
  function nav() {
    waitFor(function () { return D.getElementById('lpNav'); }, function (n) {
      var cnt = cartCount();
      n.setAttribute('data-noi18n', '');
      n.innerHTML = navHTML();
      if (W.LP && LP.navCount) try { LP.navCount(); } catch (e) { }
      if (!cartCount() && cnt) { var em = D.getElementById('lpNavCnt'); if (em) em.textContent = cnt; }
      if (n.__ap) return; n.__ap = 1;
      n.addEventListener('click', function (e) {
        var a = e.target.closest('a[data-k]'); if (!a) return;
        var k = a.getAttribute('data-k');
        if (k === 'cat') { e.preventDefault(); if (W.LP && LP.openMega) LP.openMega(); else location.href = 'index.html#catalog'; }
        if (k === 'cart') { e.preventDefault(); openCart(); }
        if (k === 'fav' && PG === 'index') { e.preventDefault(); showFav(); }
        if (k === 'home' && PG === 'index') { e.preventDefault(); hideFav(); W.scrollTo({ top: 0, behavior: 'smooth' }); }
      });
    });
  }
  function setNavOn(k) { $$('#lpNav a[data-k]').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-k') === k); }); }
  function showFav() {
    if (!has('showFavorites')) return;
    favMode = true; setNavOn('fav');
    try { W.showFavorites(); } catch (e) { }
    var f = D.getElementById('favorites');
    if (f) setTimeout(function () { var top = f.getBoundingClientRect().top + W.scrollY - 76; W.scrollTo({ top: Math.max(0, top), behavior: 'smooth' }); }, 30);
  }
  function hideFav() { favMode = false; setNavOn('home'); var f = D.getElementById('favorites'); if (f) f.classList.remove('show'); }

  /* число на значке корзины вверху = число в навигации */
  function syncCount() {
    var src = D.getElementById('lpNavCnt'), dst = D.getElementById('apTopCnt');
    if (!dst) return;
    var n = src ? (src.textContent || '').trim() : '';
    if (!n && D.getElementById('cnt')) n = D.getElementById('cnt').textContent.trim();
    if (!n && D.getElementById('cartCount')) n = D.getElementById('cartCount').textContent.trim();
    if (n === '0') n = '';
    if (dst.textContent !== n) dst.textContent = n;
  }

  /* панель прячется, когда открыто окно */
  function watchModals() {
    var check = function () {
      var open = !!(
        $('#md.on') || $('#dr.open') || $('.lp-mega.on, .lp-mega.open') || $('.lp-search.on, .lp-search.open') ||
        $('.lp-story.on') || $('.lp-sheet.on, .lp-sheet.open') || $('.ap-sh.on') || D.getElementById('lwModal') || $('#lightbox.on, #lightbox.open, .lb.on')
      );
      H.classList.toggle('ap-modal', open);
      syncCount();
    };
    new MutationObserver(check).observe(D.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    check();
  }

  /* ---------- шторки ---------- */
  function sheet(id, title, bodyHTML, footHTML, opts) {
    var s = D.getElementById(id);
    if (!s) {
      s = D.createElement('div'); s.id = id; s.className = 'ap-sh'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true');
      s.innerHTML = '<div class="ap-shp"><div class="ap-shh"><b></b><button type="button" class="ap-shx">' + t('done') + '</button></div><div class="ap-shb"></div><div class="ap-shf"></div></div>';
      D.body.appendChild(s);
      s.addEventListener('click', function (e) { if (e.target === s || e.target.closest('.ap-shx')) closeSheet(s); });
      // свайп вниз закрывает
      var y0 = null, p = s.firstChild;
      p.addEventListener('touchstart', function (e) { if (e.target.closest('.ap-shb') && s.querySelector('.ap-shb').scrollTop > 0) { y0 = null; return; } y0 = e.touches[0].clientY; }, { passive: true });
      p.addEventListener('touchmove', function (e) { if (y0 == null) return; var dy = e.touches[0].clientY - y0; if (dy > 0) p.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
      p.addEventListener('touchend', function (e) { if (y0 == null) return; var dy = e.changedTouches[0].clientY - y0; p.style.transform = ''; y0 = null; if (dy > 90) closeSheet(s); }, { passive: true });
    }
    s.querySelector('.ap-shh b').textContent = title;
    s.querySelector('.ap-shx').textContent = t('done');
    if (bodyHTML != null) s.querySelector('.ap-shb').innerHTML = bodyHTML;
    var f = s.querySelector('.ap-shf'); f.innerHTML = footHTML || ''; f.style.display = footHTML ? '' : 'none';
    if (opts && opts.onclose) s.__onclose = opts.onclose;
    requestAnimationFrame(function () { s.classList.add('on'); });
    return s;
  }
  function closeSheet(s) { s.classList.remove('on'); if (s.__onclose) try { s.__onclose(); } catch (e) { } }

  /* ---------- главная ---------- */
  function promoCards() {
    if (D.getElementById('apPromo')) return;
    var s = D.createElement('section'); s.id = 'apPromo'; s.className = 'ap-promo'; s.setAttribute('data-noi18n', '');
    s.innerHTML = '<button type="button" class="ap-pc dark" data-k="wheel"><i></i><div><small>' + t('daily') + '</small><b>' + t('wheelT') + '</b></div><span>' + t('wheelS') + '</span></button>' +
      '<button type="button" class="ap-pc" data-k="skin"><i></i><div><small>' + t('lab') + '</small><b>' + t('skinT') + '</b></div><span>' + t('skinS') + '</span></button>';
    s.addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]'); if (!b) return;
      if (b.getAttribute('data-k') === 'wheel') { if (W.LumaWheel) LumaWheel.open(); }
      else if (has('goSkin')) W.goSkin(); else { var sh = D.getElementById('skinHelp'); if (sh) sh.scrollIntoView({ behavior: 'smooth' }); }
    });
    var cats = $('.bloom-categories');
    if (cats) cats.after(s); else { var c = D.getElementById('catalog'); if (c) c.before(s); }
  }

  function catalogTools() {
    var cat = D.getElementById('catalog'), chips = D.getElementById('chips'), sq = $('#catalog .sq');
    if (!cat || !chips || !sq || $('.ap-tools')) return;
    var tb = D.createElement('div'); tb.className = 'ap-tools'; tb.setAttribute('data-noi18n', '');
    tb.innerHTML = '<div class="ap-srch">' + svg('search') + '</div><div class="ap-tbr"><button type="button" class="ap-tb" data-k="filt">' + svg('filt') + '<span>' + t('filters') + '</span><b id="apFn"></b></button><button type="button" class="ap-tb" data-k="sort">' + svg('sort') + '<span id="apSortL">' + t('sort') + '</span></button></div>';
    chips.before(tb);
    tb.querySelector('.ap-srch').appendChild(sq);
    sq.setAttribute('type', 'search'); sq.setAttribute('enterkeyhint', 'search'); sq.setAttribute('autocomplete', 'off');
    sq.addEventListener('keydown', function (e) { if (e.key === 'Enter') sq.blur(); });
    tb.addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]'); if (!b) return;
      if (b.getAttribute('data-k') === 'filt') openFilters(); else openSort();
    });
    paintTools();
  }
  function g(name) { try { return W.eval(name); } catch (e) { return undefined; } }
  function activeFilters() {
    var n = 0;
    ['fB', 'fMin', 'fMax', 'fSale', 'fStock'].forEach(function (k) { if (g(k)) n++; });
    if (W.LP && LP.f) ['t', 'sk', 'cn', 'ing'].forEach(function (k) { if (LP.f[k]) n++; });
    var c = g('cur'); if (c && c !== 'Все') n++;
    return n;
  }
  function paintTools() {
    var fn = D.getElementById('apFn'); if (fn) { var n = activeFilters(); fn.textContent = n ? n : ''; }
    var sl = D.getElementById('apSortL'), fs = D.getElementById('fSort');
    if (sl && fs) sl.textContent = fs.value ? fs.options[fs.selectedIndex].text : t('sort');
    var btn = $('#apFilt .ap-shf .ap-btn.gold'); if (btn) { var m = /\d+/.exec(countText()); btn.textContent = t('show') + (m ? ' ' + m[0] : ''); }
  }
  function countText() { var s = D.getElementById('sub'); return s ? s.textContent.trim() : ''; }
  function openFilters() {
    var fbar = D.getElementById('fbar'); if (!fbar) return;
    var chips = D.getElementById('chips'), cur = g('cur') || 'Все';
    var cats = chips ? $$('[data-c]', chips).map(function (b) { return '<button type="button" class="ap-chip' + (b.dataset.c === cur ? ' on' : '') + '" data-c="' + esc(b.dataset.c) + '">' + esc(b.textContent.trim()) + '</button>'; }).join('') : '';
    var s = sheet('apFilt', t('filters'), '<div class="ap-fl"><span>' + t('category') + '</span><div class="ap-chips" id="apCats">' + cats + '</div></div><div id="apFbarHost"></div>',
      '<button type="button" class="ap-btn line" data-k="reset">' + t('reset') + '</button><button type="button" class="ap-btn gold" data-k="show">' + t('show') + '</button>', { onclose: paintTools });
    D.getElementById('apFbarHost').appendChild(fbar);
    // цена — две колонки
    var mn = D.getElementById('fMin'), mx = D.getElementById('fMax');
    if (mn && mx && !$('.ap-pr2', fbar)) { var w = D.createElement('div'); w.className = 'ap-pr2'; var l1 = mn.closest('label'), l2 = mx.closest('label'); l1.before(w); w.appendChild(l1); w.appendChild(l2); }
    if (!s.__wired) {
      s.__wired = 1;
      s.addEventListener('click', function (e) {
        var c = e.target.closest('#apCats [data-c]');
        if (c) { $$('#apCats .ap-chip').forEach(function (x) { x.classList.toggle('on', x === c); }); var y = W.scrollY; if (has('setCategory')) W.setCategory(c.dataset.c); W.scrollTo(0, y); paintTools(); return; }
        var b = e.target.closest('.ap-shf [data-k]'); if (!b) return;
        if (b.getAttribute('data-k') === 'reset') { if (has('resetFilters')) W.resetFilters(); if (W.LP && LP.f) { LP.f.t = LP.f.sk = LP.f.cn = LP.f.ing = ''; if (LP.syncFilterUI) try { LP.syncFilterUI(); } catch (x) { } } var y2 = W.scrollY; if (has('setCategory')) W.setCategory('Все'); W.scrollTo(0, y2); $$('#apCats .ap-chip').forEach(function (x) { x.classList.toggle('on', x.dataset.c === 'Все'); }); if (has('render')) W.render(); paintTools(); }
        else { closeSheet(s); var cat = D.getElementById('catalog'); if (cat) cat.scrollIntoView({ behavior: 'smooth' }); }
      });
      s.addEventListener('change', function () { setTimeout(paintTools, 30); });
      s.addEventListener('input', function () { setTimeout(paintTools, 30); });
    }
    paintTools();
  }
  function openSort() {
    var fs = D.getElementById('fSort'); if (!fs) return;
    var opts = Array.prototype.map.call(fs.options, function (o) { return '<button type="button" class="ap-opt' + (o.value === fs.value ? ' on' : '') + '" data-v="' + esc(o.value) + '">' + esc(o.text) + '</button>'; }).join('');
    var s = sheet('apSort', t('sort'), opts, '', { onclose: paintTools });
    if (!s.__wired) {
      s.__wired = 1;
      s.addEventListener('click', function (e) {
        var b = e.target.closest('.ap-opt'); if (!b) return;
        var f = D.getElementById('fSort'); f.value = b.dataset.v; f.dispatchEvent(new Event('change'));
        $$('.ap-opt', s).forEach(function (x) { x.classList.toggle('on', x === b); });
        setTimeout(function () { closeSheet(s); var cat = D.getElementById('catalog'); if (cat) cat.scrollIntoView({ behavior: 'smooth' }); }, 160);
      });
    }
  }

  // наличие на карточках и skeleton до загрузки
  function decorateGrid(grid) {
    var P = g('P'); if (!P || !P.length) return;
    $$('.pc', grid).forEach(function (pc) {
      if (pc.__ap) return; pc.__ap = 1;
      var b = $('.pc-bag', pc) || $('.pc-ask', pc); var m = b && /\((\d+)\)/.exec(b.getAttribute('onclick') || '');
      var p = m ? P[+m[1]] : null; if (!p || !p.p) return;
      var st = p.st, el = D.createElement('span'); el.setAttribute('data-noi18n', '');
      if (st != null && st <= 0) { el.className = 'ap-stock out'; el.textContent = t('out'); pc.classList.add('ap-out'); }
      else if (st != null && st <= 5) { el.className = 'ap-stock low'; el.textContent = t('left', st); }
      else { el.className = 'ap-stock'; el.textContent = t('inStock'); }
      var tt = $('.pc-title', pc); if (tt) tt.after(el);
    });
  }
  function gridWatch() {
    var grid = D.getElementById('grid'); if (!grid) return;
    if (!grid.children.length) grid.innerHTML = new Array(7).join('<div class="ap-sk" aria-hidden="true"><i></i><b></b><b></b></div>');
    new MutationObserver(function () { decorateGrid(grid); paintTools(); }).observe(grid, { childList: true });
    decorateGrid(grid);
  }

  // приветственное окно «−5%» — не сразу, а через 15 сек и после прокрутки
  function delayWelcome() {
    var orig = W.welcomeSplash; if (typeof orig !== 'function' || orig.__ap) return;
    var t0 = Date.now(), shown = false;
    var fn = function () {
      var args = arguments;
      (function wait() {
        if (shown) return;
        var ok = Date.now() - t0 > 15000 && (W.scrollY > W.innerHeight * .6 || Date.now() - t0 > 30000) && !H.classList.contains('ap-modal');
        if (!ok) return setTimeout(wait, 1000);
        shown = true; orig.apply(W, args);
      })();
    };
    fn.__ap = 1; W.welcomeSplash = fn;
  }

  function indexInit() {
    promoCards(); delayWelcome();
    waitFor(function () { return D.getElementById('chips') && $('#catalog .sq'); }, catalogTools);
    waitFor(function () { return D.getElementById('grid'); }, gridWatch);
    // хэши из навигации других страниц и «Купить сейчас»
    var h = location.hash;
    var P0 = function () { var P = g('P'); return P && P.length; };
    if (h === '#cart' || h === '#fav' || h === '#favorites') {
      waitFor(P0, function () {
        if (h === '#cart') openCart(); else showFav();
        try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
      });
    }
    if (W.__lappBuy) waitFor(function () { var c = g('cart'); return P0() && c && Object.keys(c).length; }, function () { setTimeout(function () { if (has('buy')) W.buy(); }, 300); });
    // во время окна избранного «Главная» снова активна при прокрутке наверх
    var away = false;
    W.addEventListener('scroll', function () { if (!favMode) { away = false; return; } if (W.scrollY > 400) away = true; else if (away && W.scrollY < 80) { away = false; hideFav(); } }, { passive: true });
  }

  /* ---------- товар ---------- */
  function curPhoto() { var th = $$('.thumb'); for (var k = 0; k < th.length; k++) if (th[k].classList.contains('active')) return k; return 0; }
  function productInit() {
    D.body.classList.add('ap-pdp');
    // свайп фото и точки
    waitFor(function () { return has('showPhoto') && D.getElementById('mainPhoto'); }, function (img) {
      var thumbs = $$('.thumb'); var n = thumbs.length;
      if (n > 1 && !$('.ap-dots')) {
        var d = D.createElement('div'); d.className = 'ap-dots'; d.innerHTML = new Array(n + 1).join('<i></i>');
        var host = img.parentElement; host.after(d);
        var paint = function () { var i = curPhoto(); $$('i', d).forEach(function (x, k) { x.classList.toggle('on', k === i); }); };
        var sp = W.showPhoto; W.showPhoto = function (i) { sp(i); paint(); }; paint();
      }
    });
    // нижняя панель: цена, избранное, «В корзину», «Купить»
    waitFor(function () { return g('product') && D.getElementById('lpSticky'); }, function (sb) {
      var p = g('product') || {};
      var price = $('b', sb) ? $('b', sb).textContent : '';
      var d = Number(p.discount_percent) || 0, old = d && p.price ? Math.round(p.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';
      var favs = []; try { favs = JSON.parse(localStorage.getItem('luma_favorites') || '[]'); } catch (e) { }
      var isFav = favs.indexOf(String(p.id)) > -1;
      sb.setAttribute('data-noi18n', '');
      sb.innerHTML = '<div><small>' + esc(p.kind || p.category || '') + '</small>' + (old ? '<s>' + old + '</s>' : '') + '<b>' + esc(price) + '</b></div>' +
        '<button type="button" class="ap-fav' + (isFav ? ' on' : '') + '" aria-label="' + t('fav') + '">' + (isFav ? '♥' : '♡') + '</button>' +
        '<button type="button" class="ap-add">' + t('addCart') + '</button><button type="button" class="ap-now">' + t('buyNow') + '</button>';
      sb.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.classList.contains('ap-fav')) { if (has('toggleFavorite')) W.toggleFavorite(); var on = b.textContent === '♡'; b.textContent = on ? '♥' : '♡'; b.classList.toggle('on', on); }
        if (b.classList.contains('ap-add') && has('addToCart')) W.addToCart();
        if (b.classList.contains('ap-now')) { var q = g('qty') || 1; location.href = 'index.html?add=' + encodeURIComponent(p.id) + '&qty=' + q + '&buy=1'; }
      });
    });
  }

  /* ---------- профиль ---------- */
  function accountMenu() {
    var app = D.getElementById('app'); if (!app) return;
    var put = function () {
      if (!app.children.length || $('.sk', app) || $('.ap-menu', app)) return;
      var dark = H.classList.contains('dark');
      var cur = lang();
      var m = D.createElement('div'); m.setAttribute('data-noi18n', '');
      var row = function (ico, label, sub, attrs) { return '<' + (attrs.href ? 'a href="' + attrs.href + '"' : 'button type="button" data-k="' + attrs.k + '"') + ' class="ap-mi' + (attrs.sw ? ' sw' : '') + '"><i>' + ico + '</i><span>' + label + '</span>' + (sub ? '<small>' + sub + '</small>' : '') + (attrs.extra || '') + '</' + (attrs.href ? 'a' : 'button') + '>'; };
      m.innerHTML = '<div class="ap-mh">' + t('more') + '</div><div class="ap-menu">' +
        row('♡', t('fav'), '', { href: 'index.html#fav' }) +
        row('◎', t('wheelT'), t('daily'), { k: 'wheel' }) +
        row('✉', t('chat'), '', { k: 'chat' }) +
        row('▤', t('track'), '', { href: 'track.html' }) +
        row('✦', t('gifts'), '', { href: 'gifts.html' }) + '</div>' +
        '<div class="ap-menu">' +
        '<label class="ap-mi sw"><i>☾</i><span>' + t('theme') + '</span><span class="ap-sw" style="border:0;min-height:0"><input type="checkbox" data-k="theme"' + (dark ? ' checked' : '') + '><i></i></span></label>' +
        '<label class="ap-mi sw"><i>A</i><span>' + t('lang') + '</span><select class="ap-in" data-k="lang" style="width:auto;height:40px;padding-right:34px;background-position:calc(100% - 18px) 17px,calc(100% - 13px) 17px">' +
        [['ru', 'Русский'], ['uz', 'O‘zbekcha'], ['en', 'English'], ['kk', 'Қазақша'], ['ko', '한국어']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === cur ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
        row('⛟', t('delivery'), '', { href: 'delivery.html' }) +
        row('?', t('help'), '', { href: 'faq.html' }) + '</div>';
      m.className = 'ap-mwrap';
      app.appendChild(m);
      m.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-k]'); if (!b) return;
        var k = b.getAttribute('data-k');
        if (k === 'wheel' && W.LumaWheel) LumaWheel.open();
        if (k === 'chat') { var c = D.getElementById('lpChat'); if (c) { e.stopPropagation(); c.classList.add('open'); } }
      });
      m.addEventListener('change', function (e) {
        var k = e.target.getAttribute('data-k');
        if (k === 'theme' && W.LumaTheme) LumaTheme.set(e.target.checked);
        if (k === 'lang' && has('setLang')) W.setLang(e.target.value);
      });
    };
    new MutationObserver(put).observe(app, { childList: true });
    put();
  }

  /* ---------- барабан: фирменные цвета ---------- */
  W.LW_COLORS = ['#B8955D', '#F1E7D6', '#8E6D3B', '#FFFDF8', '#C9AB78', '#E9DDCA', '#6E5434', '#F6EEE2'];

  /* ---------- язык ---------- */
  function relang() {
    var tb = $('.ap-top'); if (tb) { tb.remove(); topBar(); syncCount(); }
    var n = D.getElementById('lpNav'); if (n) { n.innerHTML = navHTML(); if (W.LP && LP.navCount) try { LP.navCount(); } catch (e) { } }
    var pr = D.getElementById('apPromo'); if (pr) { pr.remove(); promoCards(); }
    var tools = $('.ap-tools'); if (tools) { $$('.ap-tb span', tools)[0].textContent = t('filters'); paintTools(); }
    $$('.ap-stock').forEach(function (e) { var pc = e.closest('.pc'); e.remove(); if (pc) pc.__ap = 0; });
    var grid = D.getElementById('grid'); if (grid) decorateGrid(grid);
    var mw = $('.ap-mwrap'); if (mw) { mw.remove(); accountMenu(); }
  }
  D.addEventListener('luma:lang', function () { setTimeout(relang, 60); });

  function init() {
    topBar(); nav(); watchModals();
    if (PG === 'index') indexInit();
    if (PG === 'product') productInit();
    if (PG === 'account') accountMenu();
    setInterval(syncCount, 1200);
  }
  if (D.body) init(); else D.addEventListener('DOMContentLoaded', init);
  W.LumaApp = { sheet: sheet, openCart: openCart, showFav: showFav };
})(window, document);
