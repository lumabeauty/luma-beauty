/* Luma Beauty — ежедневный барабан удачи (сертификаты 1 000–15 000 сум и набор духов) */
(function () {
  const D = document, W = window;
  const COLORS = ['#f6d7df', '#fff6ee', '#e9c9a0', '#fbe9ee', '#f2c6d1', '#fff6ee', '#ead2b0', '#fbe9ee'];
  const money = (n) => Number(n || 0).toLocaleString('ru-RU').replace(/ | /g, ' ') + ' сум';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dm = (d) => { try { return new Date(d).toLocaleDateString('ru-RU', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit' }) } catch (e) { return '' } };
  const client = () => { try { if (W.LP && LP.sb) return LP.sb() } catch (e) { } try { if (typeof sb !== 'undefined' && sb && sb.rpc) return sb } catch (e) { } return null };
  let cfg = null, rot = 0, busy = false;

  const css = `
.lw-wh{position:fixed;right:18px;bottom:calc(80px + var(--lp-nav,0px) + env(safe-area-inset-bottom,0px));z-index:71;width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;background:conic-gradient(#f2c6d1 0 45deg,#fff6ee 0 90deg,#e9c9a0 0 135deg,#fbe9ee 0 180deg,#f2c6d1 0 225deg,#fff6ee 0 270deg,#e9c9a0 0 315deg,#fbe9ee 0);box-shadow:0 0 0 4px #9b7846,0 12px 26px -10px rgba(80,20,40,.55);display:grid;place-items:center;animation:lwWob 4s ease-in-out infinite;padding:0}
.lw-wh b{width:22px;height:22px;border-radius:50%;background:#9b7846;color:#fff;display:grid;place-items:center;font:700 13px/1 Arial;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.lw-wh i{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:99px;background:#e0245e;color:#fff;font:700 11px/20px Arial;font-style:normal;box-shadow:0 0 0 2px #fff}
.lw-wh i[hidden]{display:none}
.lw-wh-lbl{position:fixed;right:80px;bottom:calc(94px + var(--lp-nav,0px) + env(safe-area-inset-bottom,0px));z-index:71;background:#fff;color:#7a5a30;border:1px solid #ecd9bf;border-radius:99px;padding:6px 12px;font:600 12px/1 Jost,Arial,sans-serif;box-shadow:0 8px 20px -10px rgba(80,20,40,.35);pointer-events:none;white-space:nowrap}
@keyframes lwWob{0%,86%,100%{transform:rotate(0)}90%{transform:rotate(-14deg)}94%{transform:rotate(10deg)}}
.lw-wm{position:fixed;inset:0;z-index:9500;background:rgba(40,20,28,.55);display:flex;align-items:center;justify-content:center;padding:14px;animation:lwFade .2s}
@keyframes lwFade{from{opacity:0}}
.lw-wc{position:relative;width:min(420px,100%);max-height:calc(100vh - 28px);overflow:auto;background:linear-gradient(#fff,#fff8f3);border-radius:24px;padding:22px 20px 18px;text-align:center;font:14px/1.45 Jost,Arial,sans-serif;color:#30271e;box-shadow:0 30px 60px -20px rgba(0,0,0,.45)}
.lw-wc h3{margin:0 0 4px;font:600 24px/1.2 'Cormorant Garamond',Georgia,serif;color:#9b7846}
.lw-wc p{margin:0 0 12px;color:#6b5d52}
.lw-x{position:absolute;top:10px;right:12px;border:0;background:none;font-size:26px;line-height:1;color:#a08b7a;cursor:pointer}
.lw-stage{position:relative;width:min(320px,78vw);aspect-ratio:1;margin:6px auto 14px}
.lw-stage svg{width:100%;height:100%;display:block;border-radius:50%;box-shadow:0 0 0 8px #9b7846,0 0 0 11px #e9c9a0,0 18px 36px -12px rgba(80,40,10,.5);transition:transform 5.2s cubic-bezier(.12,.72,.12,1)}
.lw-pin{position:absolute;left:50%;top:-14px;transform:translateX(-50%);width:0;height:0;border-left:15px solid transparent;border-right:15px solid transparent;border-top:30px solid #e0245e;filter:drop-shadow(0 3px 3px rgba(0,0,0,.3));z-index:2}
.lw-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:74px;height:74px;border-radius:50%;border:4px solid #fff;background:#9b7846;color:#fff;font:700 11px/1.1 Jost,Arial,sans-serif;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.3);z-index:2}
.lw-hub:disabled{opacity:.85;cursor:default}
.lw-btn{display:inline-block;border:0;border-radius:99px;background:#9b7846;color:#fff;font:600 15px/1 Jost,Arial,sans-serif;padding:14px 26px;cursor:pointer;text-decoration:none}
.lw-btn.alt{background:#fff;color:#9b7846;border:1.5px solid #e2cba8}
.lw-res{background:#fff;border:1.5px dashed #d8b98d;border-radius:16px;padding:14px;margin:4px 0 12px}
.lw-res big{display:block;font:700 22px/1.25 Jost,Arial,sans-serif;color:#30271e;margin-bottom:4px}
.lw-code{display:inline-block;margin:8px 0 6px;padding:8px 14px;border-radius:10px;background:#fbf3ea;font:700 18px/1 monospace;letter-spacing:.06em;color:#7a5a30}
.lw-rules{font-size:12px;color:#8b7c70;margin-top:10px}
.lw-acts{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
@media(max-width:860px){.lw-wh{right:12px;width:50px;height:50px;bottom:calc(74px + var(--lp-nav,0px) + env(safe-area-inset-bottom,0px))}.lw-wh-lbl{display:none}}
`;

  function wheelSVG(prizes) {
    const n = prizes.length, a = 360 / n, R = 150;
    const pt = (deg, r) => { const t = (deg - 90) * Math.PI / 180; return [150 + r * Math.cos(t), 150 + r * Math.sin(t)] };
    let s = `<svg viewBox="0 0 300 300" id="lwSvg" style="transform:rotate(${rot}deg)">`;
    prizes.forEach((p, i) => {
      const [x1, y1] = pt(i * a, R), [x2, y2] = pt((i + 1) * a, R);
      s += `<path d="M150 150L${x1} ${y1}A${R} ${R} 0 0 1 ${x2} ${y2}Z" fill="${p.amount ? COLORS[i % COLORS.length] : '#9b7846'}" stroke="#fff" stroke-width="2"/>`;
      const mid = i * a + a / 2;
      const big = p.amount ? String(p.amount / 1000) + ' 000' : 'НАБОР';
      const small = p.amount ? 'сум' : 'ДУХОВ';
      const col = p.amount ? '#5a3e22' : '#fff';
      s += `<g transform="rotate(${mid} 150 150)"><text x="150" y="44" text-anchor="middle" font-family="Jost,Arial,sans-serif" font-weight="700" font-size="${p.amount ? 17 : 13}" fill="${col}">${big}</text><text x="150" y="61" text-anchor="middle" font-family="Jost,Arial,sans-serif" font-size="11" fill="${col}">${small}</text>${p.amount ? '' : '<text x="150" y="84" text-anchor="middle" font-size="18">🎁</text>'}</g>`;
    });
    for (let i = 0; i < n * 2; i++) { const [x, y] = pt(i * a / 2, 141); s += `<circle cx="${x}" cy="${y}" r="3" fill="${i % 2 ? '#fff' : '#f7d48a'}"/>` }
    return s + '</svg>';
  }

  async function loadCfg() {
    if (cfg) return cfg;
    const c = client(); if (!c) return null;
    try { const { data } = await c.from('site_settings').select('value').eq('key', 'wheel').maybeSingle(); cfg = data && data.value } catch (e) { }
    return cfg;
  }
  async function status() {
    const c = client(); if (!c) return { login: false };
    try { const { data: { session } } = await c.auth.getSession(); if (!session) return { login: false } } catch (e) { return { login: false } }
    const { data, error } = await c.rpc('wheel_status');
    return error ? { login: true, can_spin: true } : data;
  }

  function rules() {
    return `<div class="lw-rules">1 вращение в день · сертификат действует ${cfg.days || 7} дней · для заказа от ${money(cfg.min_order || 0)} · код вводится при оформлении заказа</div>`;
  }
  function resultHTML(r) {
    if (!r.amount) return `<div class="lw-res"><big>🎉 Вы выиграли ${esc(r.label)}!</big>Поздравляем! Менеджер свяжется с вами по номеру телефона из профиля, чтобы передать приз.</div>`;
    return `<div class="lw-res"><big>🎉 Сертификат на ${money(r.amount)}</big><span class="lw-code" id="lwCode">${esc(r.code)}</span><br><small>Действует до ${dm(new Date(new Date(r.expires_at).getTime() - 1000))} включительно${r.min_order ? ` · для заказа от ${money(r.min_order)}` : ''}${r.balance === 0 ? ' · уже использован' : ''}</small></div>
      <div class="lw-acts"><button type="button" class="lw-btn" onclick="LumaWheel.copy()">Скопировать код</button><a class="lw-btn alt" href="index.html#catalog" onclick="LumaWheel.close()">За покупками</a></div>`;
  }
  function render(body) { const b = D.getElementById('lwBody'); if (b) b.innerHTML = body }

  async function open() {
    if (D.getElementById('lwModal')) return;
    const m = D.createElement('div'); m.id = 'lwModal'; m.className = 'lw-wm';
    m.innerHTML = `<div class="lw-wc" role="dialog" aria-label="Барабан удачи"><button class="lw-x" aria-label="Закрыть" onclick="LumaWheel.close()">×</button><h3>🎡 Барабан удачи</h3><p>Крутите каждый день и выигрывайте сертификаты до 15 000 сум или набор духов!</p><div id="lwBody"><p>Загрузка…</p></div></div>`;
    m.addEventListener('click', (e) => { if (e.target === m && !busy) close() });
    D.body.appendChild(m);
    try { W.ym && ym(114302709, 'reachGoal', 'wheel_open') } catch (e) { }
    await loadCfg();
    if (!cfg || !cfg.active) return render('<p>Барабан скоро вернётся 🙂</p>');
    const st = await status();
    const stage = `<div class="lw-stage"><div class="lw-pin"></div>${wheelSVG(cfg.prizes)}<button class="lw-hub" id="lwHub" ${st.login && st.can_spin ? 'onclick="LumaWheel.spin()"' : 'disabled'}>${st.login && st.can_spin ? 'КРУТИТЬ' : '🎁'}</button></div>`;
    if (!st.login) {
      render(stage + `<div class="lw-acts"><button class="lw-btn" onclick="LumaWheel.login()">Войти и крутить</button></div><p style="margin-top:8px;font-size:12px">Вход по номеру телефона — 30 секунд</p>` + rules());
    } else if (st.can_spin) {
      render(stage + `<div class="lw-acts"><button class="lw-btn" id="lwGo" onclick="LumaWheel.spin()">Крутить барабан</button></div>` + rules());
    } else {
      render(stage + `<p><b>Сегодня вы уже крутили.</b> Следующая попытка — завтра 🙂</p>` + resultHTML({ ...st, expires_at: st.expires_at, min_order: st.min_order }) + rules());
    }
  }
  function close() { if (busy) return; const m = D.getElementById('lwModal'); if (m) m.remove(); paintBadge() }

  async function spin() {
    if (busy) return; busy = true;
    const go = D.getElementById('lwGo'), hub = D.getElementById('lwHub');
    if (go) go.disabled = true; if (hub) hub.disabled = true;
    const c = client();
    const { data, error } = await c.rpc('spin_wheel');
    if (error) {
      busy = false;
      const msg = /already/.test(error.message) ? 'Сегодня вы уже крутили — возвращайтесь завтра!' : /login/.test(error.message) ? 'Войдите, чтобы крутить барабан.' : 'Не получилось, попробуйте ещё раз.';
      if (go) { go.disabled = false; go.textContent = 'Крутить барабан' }
      const b = D.getElementById('lwBody'); if (b) b.insertAdjacentHTML('beforeend', `<p style="color:#c0392b;margin-top:8px">${msg}</p>`);
      return;
    }
    try { W.ym && ym(114302709, 'reachGoal', 'wheel_spin') } catch (e) { }
    const n = cfg.prizes.length, a = 360 / n;
    const jitter = (Math.random() - .5) * a * .6;
    const target = 360 - (data.index * a + a / 2) + jitter;
    rot = rot - (rot % 360) + 360 * 7 + target;
    const svg = D.getElementById('lwSvg'); if (svg) svg.style.transform = `rotate(${rot}deg)`;
    if (data.code) try { localStorage.setItem('luma_wheel_code', data.code) } catch (e) { }
    setTimeout(() => {
      busy = false;
      const b = D.getElementById('lwBody'); if (!b) return;
      if (go) go.parentNode.remove(); if (hub) hub.textContent = '🎉';
      b.insertAdjacentHTML('beforeend', resultHTML(data));
      b.querySelector('.lw-res').scrollIntoView({ behavior: 'smooth', block: 'center' });
      paintBadge(false);
    }, 5400);
  }
  function copy() {
    const e = D.getElementById('lwCode'); if (!e) return;
    try { navigator.clipboard.writeText(e.textContent) } catch (x) { }
    const b = D.querySelector('.lw-acts .lw-btn'); if (b) b.textContent = 'Скопировано ✓';
  }
  function login() {
    busy = false; const m = D.getElementById('lwModal'); if (m) m.remove();
    try { sessionStorage.setItem('luma_wheel_after_login', '1') } catch (e) { }
    if (typeof W.laLogin === 'function') W.laLogin(); else location.href = 'account.html';
  }

  async function paintBadge(force) {
    const i = D.querySelector('#lwFab i'); if (!i) return;
    let can = force;
    if (can === undefined) { const st = await status(); can = !st.login || st.can_spin }
    i.hidden = !can; i.textContent = '1';
    const l = D.getElementById('lwLbl'); if (l) l.hidden = !can;
  }

  async function init() {
    if (D.getElementById('lwFab') || /admin/.test(location.pathname)) return;
    await loadCfg(); if (!cfg || !cfg.active) return;
    const st = D.createElement('style'); st.textContent = css; D.head.appendChild(st);
    const b = D.createElement('button'); b.id = 'lwFab'; b.className = 'lw-wh'; b.type = 'button'; b.setAttribute('aria-label', 'Барабан удачи');
    b.innerHTML = '<b>★</b><i hidden></i>'; b.onclick = open; D.body.appendChild(b);
    const l = D.createElement('div'); l.id = 'lwLbl'; l.className = 'lw-wh-lbl'; l.textContent = '🎁 Крутите барабан!'; l.hidden = true; D.body.appendChild(l);
    paintBadge();
    // после входа — сразу открыть барабан
    const c = client();
    if (c) c.auth.onAuthStateChange((ev) => {
      if (ev === 'SIGNED_IN') { let want = false; try { want = sessionStorage.getItem('luma_wheel_after_login') === '1'; sessionStorage.removeItem('luma_wheel_after_login') } catch (e) { } paintBadge(); if (want) setTimeout(open, 900) }
    });
    try { if (location.hash === '#wheel') setTimeout(open, 600) } catch (e) { }
  }

  W.LumaWheel = { open, close, spin, copy, login };
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', () => setTimeout(init, 700)); else setTimeout(init, 700);
})();
