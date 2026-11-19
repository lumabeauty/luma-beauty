/* Luma Beauty: кнопка «Написать в Telegram» и уведомление о cookie */
(function (W, D) {
  'use strict';
  var TG = 'Hak1mjon';
  var css = [
    '.lw-tg{position:fixed;right:18px;bottom:calc(18px + var(--lp-nav,0px) + env(safe-area-inset-bottom,0px));z-index:71;display:flex;align-items:center;gap:9px;height:50px;padding:0 18px 0 6px;border-radius:99px;background:#229ED9;color:#fff;text-decoration:none;font:600 14px/1 Jost,Arial,sans-serif;box-shadow:0 12px 28px -10px rgba(34,158,217,.65);transition:transform .2s,box-shadow .2s}',
    '.lw-tg:hover{transform:translateY(-2px);box-shadow:0 16px 32px -10px rgba(34,158,217,.75)}',
    '.lw-tg i{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.18);display:grid;place-items:center}',
    '.lw-tg svg{width:20px;height:20px;fill:#fff}',
    'body:has(#skinFab:not([hidden])) .lw-tg{bottom:calc(168px + var(--lp-nav,0px))}',
    'body:has(#md.on) .lw-tg,body:has(#dr.open) .lw-tg,body:has(.lp-story.on) .lw-tg,body:has(.lw-ck) .lw-tg{display:none}',
    '@media(max-width:760px){.lw-tg{right:12px;bottom:calc(12px + var(--lp-nav,0px));height:48px;width:48px;padding:0;justify-content:center}.lw-tg span{display:none}.lw-tg i{background:none}body:has(#skinFab:not([hidden])) .lw-tg{bottom:calc(132px + var(--lp-nav,0px))}}',
    '.lw-ck{position:fixed;left:50%;bottom:calc(16px + var(--lp-nav,0px) + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:9000;width:min(560px,calc(100% - 24px));display:flex;align-items:center;gap:14px;padding:14px 14px 14px 18px;border-radius:18px;background:#fff;color:#2b1d22;border:1px solid #f0d9e0;box-shadow:0 18px 40px -16px rgba(80,20,40,.35);font:14px/1.45 Jost,Arial,sans-serif;animation:lwUp .35s ease}',
    '.lw-ck p{margin:0;flex:1}',
    '.lw-ck a{color:#c9364b}',
    '.lw-ck button{flex:none;border:0;border-radius:99px;background:#2b1d22;color:#fff;font:600 14px Jost,Arial,sans-serif;padding:11px 20px;cursor:pointer}',
    '.lw-ck button:hover{background:#c9364b}',
    'html.dark .lw-ck{background:#241c20;color:#f3e8ec;border-color:#3a2d33}html.dark .lw-ck button{background:#f3e8ec;color:#241c20}',
    '@media(max-width:560px){.lw-ck{flex-direction:column;align-items:stretch;text-align:center;gap:10px}}',
    '@keyframes lwUp{from{opacity:0;transform:translate(-50%,16px)}}'
  ].join('\n');

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  function init() {
    var st = D.createElement('style'); st.id = 'lw-css'; st.textContent = css; D.head.appendChild(st);

    if (false) { // кнопка «Написать нам» отключена по просьбе владельца
      var a = D.createElement('a');
      a.className = 'lw-tg'; a.href = 'https://t.me/' + TG; a.target = '_blank'; a.rel = 'noopener';
      a.setAttribute('aria-label', 'Написать в Telegram');
      a.innerHTML = '<i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.6 4.3 3.4 10.9c-1.2.5-1.1 1.2-.2 1.5l4.4 1.4 1.7 5.2c.2.6.4.8.8.8.4 0 .6-.2.9-.5l2.2-2.1 4.5 3.3c.8.5 1.4.2 1.6-.8l2.9-13.7c.3-1.2-.4-1.8-1.6-1.4Zm-3 3.4-7.9 7.1-.3 3.3-1.5-4.6 9.3-5.9c.4-.3.8-.1.4.1Z"/></svg></i><span>Написать нам</span>';
      D.body.appendChild(a);
    }

    if (!ls('luma_cookie_ok')) {
      var c = D.createElement('div');
      c.className = 'lw-ck'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', 'Cookie');
      var pol = D.querySelector('link[rel="privacy-policy"]');
      c.innerHTML = '<p>Мы используем cookie, чтобы сайт работал удобно, и Яндекс Метрику для статистики посещений.' +
        (pol ? ' <a href="' + pol.getAttribute('href') + '">Подробнее</a>' : '') + '</p><button type="button">Понятно</button>';
      c.querySelector('button').onclick = function () { ls('luma_cookie_ok', '1'); c.remove(); };
      setTimeout(function () { D.body.appendChild(c); }, 1200);
    }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})(window, document);
