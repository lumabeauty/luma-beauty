/* Luma Beauty — тёмная тема.
   Светлые фоны перекрашиваются в тёмные тона бренда, тёмный текст — в светлый.
   Фото и яркие фирменные цвета (коралловый, тиффани) не меняются. */
(function () {
  var KEY = 'luma_theme';
  var D = document, H = D.documentElement;
  function saved() { try { return localStorage.getItem(KEY) } catch (e) { return null } }
  function save(v) { try { localStorage.setItem(KEY, v) } catch (e) { } }
  function prefersDark() { return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) }
  var dark = saved() ? saved() === 'dark' : prefersDark();

  // Ранний фон, чтобы не мигало белым
  var early = D.createElement('style');
  early.id = 'luma-dark-early';
  early.textContent =
    'html.dark{color-scheme:dark;background:#161114}' +
    'html.dark body{background:#161114!important;color:#eee3e6}' +
    'html.dark img,html.dark video{filter:brightness(.94);mix-blend-mode:normal!important}' +
    'html.dark .logo-img,html.dark img[src*="logo-luma"]{filter:invert(1) brightness(1.15)!important}' +
    'html.dark #bg .word,html.dark #bg canvas{opacity:.25}' +
    'html.dark input,html.dark select,html.dark textarea{background-color:#241b1f!important;color:#f3e9ec!important;border-color:#3d2f35!important}' +
    'html.dark ::placeholder{color:#a8949b!important}' +
    'html.dark a{color:inherit}' +
    '.luma-theme-btn{display:inline-grid;place-items:center;width:40px;height:40px;flex:0 0 40px;border-radius:50%;border:1px solid #efdfe3;background:#fff;color:#c9364b;cursor:pointer;padding:0;margin:0 2px;transition:transform .3s ease,background .3s ease}' +
    '.luma-theme-btn:hover{transform:rotate(-18deg)}' +
    '.luma-theme-btn svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
    '.luma-theme-btn .sun{display:none}html.dark .luma-theme-btn .sun{display:block}html.dark .luma-theme-btn .moon{display:none}' +
    'html.dark .luma-theme-btn{background:#241b1f!important;border-color:#3d2f35!important;color:#ffb3bf!important}' +
    '.luma-theme-btn.floating{position:fixed;left:16px;bottom:84px;z-index:9998;box-shadow:0 4px 14px rgba(0,0,0,.18)}';
  (D.head || H).appendChild(early);
  if (dark) H.classList.add('dark');

  /* ---------- цвета ---------- */
  function parse(c) {
    var m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255; var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2;
    if (mx !== mn) { var d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6 }
    return [h, s, l];
  }
  function css(h, s, l, a) {
    return 'hsla(' + Math.round(h * 360) + ',' + Math.round(s * 100) + '%,' + Math.round(l * 100) + '%,' + (a == null ? 1 : +a.toFixed(3)) + ')';
  }
  // светлый фон -> тёмный (оттенок сохраняется, лёгкий розовый подтон бренда)
  function darkBg(c) {
    var x = hsl(c.r, c.g, c.b), l = x[2];
    if (l < .62) return null;
    var nl = .085 + (1 - l) * .5;          // белый -> ~8.5%, светло-розовый -> ~12%
    var ns = Math.min(x[1], .35) * .6 + .08;
    var nh = x[1] < .08 ? 0.94 : x[0];     // нейтральный белый получает тёплый розовый подтон
    return css(nh, ns, nl, c.a);
  }
  // тёмный текст -> светлый
  function lightText(c) {
    var x = hsl(c.r, c.g, c.b), l = x[2];
    if (l > .5) return null;
    return css(x[0], Math.min(x[1], .3), .93 - l * .45, c.a);
  }
  function darkLine(c) {
    var x = hsl(c.r, c.g, c.b);
    if (x[2] < .7) return null;
    return css(x[1] < .08 ? .94 : x[0], .16, .24, c.a);
  }
  function gradientDark(bgi) {
    if (bgi.indexOf('gradient') < 0 || bgi.indexOf('url(') >= 0) return null;
    var changed = false;
    var out = bgi.replace(/rgba?\([^)]+\)/g, function (m) {
      var c = parse(m); if (!c || c.a === 0) return m; var d = darkBg(c); if (d) { changed = true; return d } return m;
    });
    return changed ? out : null;
  }

  /* ---------- применение ---------- */
  var orig = new WeakMap(), touched = [];
  var SKIP = { IMG: 1, VIDEO: 1, CANVAS: 1, SVG: 1, PATH: 1, SCRIPT: 1, STYLE: 1, LINK: 1, META: 1, BR: 1, SOURCE: 1, IFRAME: 1, HEAD: 1, TITLE: 1, NOSCRIPT: 1 };
  function paint(el) {
    if (!el || el.nodeType !== 1 || SKIP[el.tagName.toUpperCase()] || el.closest && el.closest('svg')) return;
    if (el.classList && el.classList.contains('luma-theme-btn')) return;
    var cs = getComputedStyle(el), set = {};
    var bg = parse(cs.backgroundColor); if (bg && bg.a > .02) { var nb = darkBg(bg); if (nb) set['background-color'] = nb }
    if (cs.backgroundImage && cs.backgroundImage !== 'none') { var g = gradientDark(cs.backgroundImage); if (g) set['background-image'] = g }
    var fg = parse(cs.color); if (fg) { var nf = lightText(fg); if (nf) set['color'] = nf }
    ['Top', 'Right', 'Bottom', 'Left'].forEach(function (s) {
      if (parseFloat(cs['border' + s + 'Width']) > 0) { var bc = parse(cs['border' + s + 'Color']); if (bc && bc.a > .05) { var nl = darkLine(bc); if (nl) set['border-' + s.toLowerCase() + '-color'] = nl } }
    });
    if (cs.boxShadow && cs.boxShadow !== 'none' && /rgba?\(2[0-5]\d, ?2[0-5]\d, ?2[0-5]\d/.test(cs.boxShadow)) set['box-shadow'] = 'none';
    var keys = Object.keys(set); if (!keys.length) return;
    if (!orig.has(el)) { orig.set(el, el.getAttribute('style')); touched.push(el) }
    keys.forEach(function (k) { el.style.setProperty(k, set[k], 'important') });
    el.setAttribute('data-dk', '1');
  }
  function paintTree(root) {
    if (!root || root.nodeType !== 1) return;
    paint(root);
    var all = root.getElementsByTagName('*'); for (var i = 0; i < all.length; i++) paint(all[i]);
  }
  function unpaint() {
    touched.forEach(function (el) {
      var o = orig.get(el); if (o == null) el.removeAttribute('style'); else el.setAttribute('style', o);
      el.removeAttribute('data-dk');
    });
    touched = []; orig = new WeakMap();
  }

  var queue = [], scheduled = false, observer = null;
  function flush() {
    scheduled = false; var q = queue; queue = [];
    if (!H.classList.contains('dark')) return;
    if (observer) observer.disconnect();
    q.forEach(paintTree);
    if (observer) observer.observe(D.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
  function enqueue(n) { queue.push(n); if (!scheduled) { scheduled = true; requestAnimationFrame(flush) } }
  function start() {
    if (!observer) observer = new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === 'childList') m.addedNodes.forEach(function (n) { if (n.nodeType === 1) enqueue(n) });
        else if (m.target.getAttribute('data-dk') == null) enqueue(m.target);
      });
    });
    enqueue(D.body);
    // повторный проход после загрузки картинок, шрифтов и данных магазина
    setTimeout(function () { enqueue(D.body) }, 1500);
    setTimeout(function () { enqueue(D.body) }, 4000);
  }
  function stop() { if (observer) observer.disconnect(); unpaint() }

  function setDark(v) {
    dark = v; save(v ? 'dark' : 'light');
    H.classList.toggle('dark', v);
    if (v) start(); else stop();
  }
  window.LumaTheme = { toggle: function () { setDark(!dark) }, set: setDark };

  /* ---------- кнопка ---------- */
  function addButton() {
    if (D.querySelector('.luma-theme-btn')) return;
    var b = D.createElement('button');
    b.type = 'button'; b.className = 'luma-theme-btn';
    b.setAttribute('aria-label', 'Тёмная тема'); b.title = 'Тёмная / светлая тема';
    b.innerHTML = '<svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>' +
      '<svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
    b.onclick = function () { setDark(!dark) };
    var lang = D.getElementById('lang');
    var host = D.querySelector('header .lp-acts') || D.querySelector('header .actions');
    if (lang && lang.parentNode) lang.parentNode.insertBefore(b, lang);
    else if (host) host.insertBefore(b, host.firstChild);
    else { b.classList.add('floating'); D.body.appendChild(b) }
  }

  function init() { addButton(); if (dark) start() }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();

  if (!saved() && window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', function (e) { if (!saved()) { setDark(e.matches); try { localStorage.removeItem(KEY) } catch (x) { } } });
  }
})();
