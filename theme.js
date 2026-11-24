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
    'html.dark{color-scheme:dark;background:#050505}' +
    'html.dark body{background:#050505!important;color:#ececec}' +
    'html.dark img,html.dark video{filter:brightness(.94);mix-blend-mode:normal!important}' +
    'html.dark .logo-img,html.dark img[src*="logo-luma"]{filter:invert(1) brightness(1.15)!important}' +
    'html.dark #bg .word,html.dark #bg canvas{opacity:.25}' +
    'html.dark input,html.dark select,html.dark textarea{background-color:#141414!important;color:#f2f2f2!important;border-color:#2a2a2a!important}html.dark input:focus,html.dark select:focus,html.dark textarea:focus{border-color:#2ee6e0!important}html.dark ::selection{background:#2ee6e0;color:#050505}' +
    'html.dark ::placeholder{color:#8a8a8a!important}' +
    'html.dark a{color:inherit}' +
    'html.dark .lw-wh{box-shadow:0 0 0 4px #2ee6e0,0 12px 26px -8px rgba(46,230,224,.45)!important}' +
    '.luma-theme-btn{display:inline-grid;place-items:center;width:40px;height:40px;flex:0 0 40px;border-radius:50%;border:1px solid #efdfe3;background:#fff;color:#c9364b;cursor:pointer;padding:0;margin:0 2px;transition:transform .3s ease,background .3s ease}' +
    '.luma-theme-btn:hover{transform:rotate(-18deg)}' +
    '.luma-theme-btn svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
    '.luma-theme-btn .sun{display:none}html.dark .luma-theme-btn .sun{display:block}html.dark .luma-theme-btn .moon{display:none}' +
    'html.dark .luma-theme-btn{background:#141414!important;border-color:#2a2a2a!important;color:#2ee6e0!important}' +
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
  // Ночной режим: чистый чёрный + бирюза #2ee6e0
  var TEAL = '#2ee6e0', TEAL_D = '#1fb8b3', INK = '#050505';
  function isAccent(x) { return x[1] > .3 && x[2] > .3 && x[2] < .82 }
  // светлый фон -> почти чёрный, нейтральный; тёплые тёмные фоны -> нейтральные
  function darkBg(c) {
    var x = hsl(c.r, c.g, c.b), l = x[2];
    if (l >= .62) return css(0, 0, .075 + (1 - l) * .35, c.a);   // белый -> ~7.5%, светлые оттенки -> ~9-10%
    if (l < .3 && x[1] > .06) return css(0, 0, Math.max(.04, l * .85), c.a);
    return null;
  }
  function accentBg(c) {
    var x = hsl(c.r, c.g, c.b);
    return isAccent(x) ? TEAL : null;
  }
  // тёмный текст -> светлый; цветной текст -> бирюза
  function lightText(c) {
    var x = hsl(c.r, c.g, c.b), l = x[2];
    if (isAccent(x)) return TEAL;
    if (l > .5) return null;
    return css(0, 0, .93 - l * .45, c.a);
  }
  function darkLine(c) {
    var x = hsl(c.r, c.g, c.b);
    if (isAccent(x)) return 'rgba(46,230,224,' + Math.min(1, c.a) + ')';
    if (x[2] < .7) return null;
    return css(0, 0, .2, c.a);
  }
  function gradientDark(bgi) {
    if (bgi.indexOf('gradient') < 0 || bgi.indexOf('url(') >= 0) return null;
    var changed = false, acc = false;
    var out = bgi.replace(/rgba?\([^)]+\)/g, function (m) {
      var c = parse(m); if (!c || c.a === 0) return m;
      var x = hsl(c.r, c.g, c.b);
      if (isAccent(x)) { changed = acc = true; var t = x[2] > .6 ? '46,230,224' : '31,184,179'; return 'rgba(' + t + ',' + c.a + ')' }
      var d = darkBg(c); if (d) { changed = true; return d } return m;
    });
    return changed ? { v: out, acc: acc } : null;
  }

  /* ---------- применение ---------- */
  var orig = new WeakMap(), touched = [];
  var SKIP = { IMG: 1, VIDEO: 1, CANVAS: 1, SVG: 1, PATH: 1, SCRIPT: 1, STYLE: 1, LINK: 1, META: 1, BR: 1, SOURCE: 1, IFRAME: 1, HEAD: 1, TITLE: 1, NOSCRIPT: 1 };
  function paint(el) {
    if (!el || el.nodeType !== 1 || SKIP[el.tagName.toUpperCase()] || el.closest && el.closest('svg')) return;
    if (el.classList && el.classList.contains('luma-theme-btn')) return;
    if (el.matches && el.matches('aside#dr .buy')) return;
    var cs = getComputedStyle(el), set = {};
    var onAcc = false;
    var bg = parse(cs.backgroundColor);
    if (bg && bg.a > .02) {
      var ab = bg.a > .5 && accentBg(bg);
      if (ab) { set['background-color'] = ab; onAcc = true }
      else { var nb = darkBg(bg); if (nb) set['background-color'] = nb }
    }
    if (cs.backgroundImage && cs.backgroundImage !== 'none') { var g = gradientDark(cs.backgroundImage); if (g) { set['background-image'] = g.v; if (g.acc && el.textContent.trim()) onAcc = true } }
    var fg = parse(cs.color);
    if (!onAcc && el.parentElement && el.parentElement.closest('[data-dk-acc]')) onAcc = 'in';
    if (onAcc) set['color'] = INK;
    else if (fg) { var nf = lightText(fg); if (nf) set['color'] = nf }
    ['Top', 'Right', 'Bottom', 'Left'].forEach(function (s) {
      if (parseFloat(cs['border' + s + 'Width']) > 0) { var bc = parse(cs['border' + s + 'Color']); if (bc && bc.a > .05) { var nl = darkLine(bc); if (nl) set['border-' + s.toLowerCase() + '-color'] = nl } }
    });
    if (cs.boxShadow && cs.boxShadow !== 'none' && /rgba?\(2[0-5]\d, ?2[0-5]\d, ?2[0-5]\d/.test(cs.boxShadow)) set['box-shadow'] = 'none';
    var keys = Object.keys(set); if (!keys.length) return;
    if (!orig.has(el)) { orig.set(el, el.getAttribute('style')); touched.push(el) }
    keys.forEach(function (k) { el.style.setProperty(k, set[k], 'important') });
    el.setAttribute('data-dk', '1');
    if (onAcc === true) el.setAttribute('data-dk-acc', '1');
  }
  function paintTree(root) {
    if (!root || root.nodeType !== 1) return;
    paint(root);
    var all = root.getElementsByTagName('*'); for (var i = 0; i < all.length; i++) paint(all[i]);
  }
  function unpaint() {
    touched.forEach(function (el) {
      var o = orig.get(el); if (o == null) el.removeAttribute('style'); else el.setAttribute('style', o);
      el.removeAttribute('data-dk'); el.removeAttribute('data-dk-acc');
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
