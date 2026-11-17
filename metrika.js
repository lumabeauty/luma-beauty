/* Luma Beauty — электронная коммерция и цели Яндекс Метрики (счётчик 114302709) */
(function (W) {
  'use strict';
  var YM_ID = 114302709, CUR = 'UZS';
  W.dataLayer = W.dataLayer || [];

  function goal(name, params) {
    try { if (typeof W.ym === 'function') W.ym(YM_ID, 'reachGoal', name, params || undefined); } catch (e) {}
  }
  function push(action, data) {
    try { var ec = { currencyCode: CUR }; ec[action] = data; W.dataLayer.push({ ecommerce: ec }); } catch (e) {}
  }
  function readCart() {
    try { return JSON.parse(localStorage.getItem('luma_cart_v2')) || {}; } catch (e) { return {}; }
  }
  /* Товар из каталога главной (массив P) в формате Метрики */
  function fromP(p, qty) {
    var price = p.p || 0;
    try { if (typeof W.finalPrice === 'function') price = W.finalPrice(p); } catch (e) {}
    var o = { id: String(p.id), name: p.t, price: Number(price) || 0, brand: p.k || undefined, category: p.c || undefined };
    if (qty) o.quantity = qty;
    return o;
  }
  /* Товар из базы (страница товара) */
  function fromRow(r) {
    var price = Number(r.price) || 0, d = Number(r.discount_percent) || 0;
    if (d) price = Math.round(price * (100 - d) / 100);
    return { id: String(r.id), name: r.title, price: price, brand: r.kind || undefined, category: r.category || undefined };
  }
  function findP(id) {
    try { var L = (typeof P !== 'undefined' && P) || []; for (var i = 0; i < L.length; i++) if (String(L[i].id) === String(id)) return L[i]; } catch (e) {}
    return null;
  }

  var prev = readCart();

  var LY = {
    goal: goal,
    /* Вызывается при каждом сохранении корзины: сравнивает с прошлым состоянием */
    cartDiff: function (now) {
      now = now || {};
      var added = [], removed = [], ids = {}, k;
      for (k in prev) ids[k] = 1;
      for (k in now) ids[k] = 1;
      for (k in ids) {
        var a = Number(prev[k]) || 0, b = Number(now[k]) || 0, p;
        if (a === b || !(p = findP(k))) continue;
        if (b > a) added.push(fromP(p, b - a)); else removed.push(fromP(p, a - b));
      }
      prev = JSON.parse(JSON.stringify(now));
      if (added.length) { push('add', { products: added }); goal('cart_add'); }
      if (removed.length) push('remove', { products: removed });
    },
    detail: function (row) { if (row) push('detail', { products: [fromRow(row)] }); },
    checkout: function () { goal('checkout_start'); },
    purchase: function (order, qty, extra) {
      var products = [];
      for (var k in qty) { var p = (typeof P !== 'undefined' && P[k]) || null; if (p && qty[k] > 0) products.push(fromP(p, qty[k])); }
      var af = { id: String(order.id), revenue: Number(order.total) || 0 };
      if (order.promo || (extra && extra.promo)) af.coupon = order.promo || extra.promo;
      push('purchase', { actionField: af, products: products });
      goal('order', { order_price: af.revenue, currency: CUR });
      prev = {};
    }
  };
  W.LumaYM = LY;

  /* Переходы в мессенджеры и звонки */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (/^tel:/i.test(h)) goal('phone_click');
    else if (/t\.me\/|telegram\.(me|org)/i.test(h)) goal('telegram_click');
    else if (/instagram\.com/i.test(h)) goal('instagram_click');
  }, true);
})(window);
