document.documentElement.classList.add('js');

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Tablero de pendientes: las paletas giran una sola vez al cargar hasta mostrar cada estado
(function board() {
  const ALPHA = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZÁÉÍÓÚ';
  const groups = [...document.querySelectorAll('.flaps')];
  const width = Math.max(...groups.map((g) => g.dataset.text.length));
  groups.forEach((g, row) => {
    const target = g.dataset.text.padEnd(width, ' ');
    g.textContent = '';
    [...target].forEach((ch, col) => {
      const cell = document.createElement('span');
      cell.className = 'flap';
      g.append(cell);
      if (reduceMotion.matches) { cell.textContent = ch; return; }
      let steps = 6 + col + row * 3;
      cell.textContent = ' ';
      const spin = () => {
        cell.classList.remove('tick');
        void cell.offsetWidth;
        cell.classList.add('tick');
        if (steps-- > 0) {
          cell.textContent = ALPHA[Math.floor(Math.random() * ALPHA.length)];
          setTimeout(spin, 70);
        } else {
          cell.textContent = ch;
        }
      };
      setTimeout(spin, 350 + row * 120);
    });
  });
  // Reloj del tablero con la hora local del visitante
  const clock = document.querySelector('.board__time');
  if (clock) {
    const paint = () => {
      const d = new Date();
      clock.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    };
    paint();
    setInterval(paint, 15000);
  }
})();

// Modo claro u oscuro, recordado en este navegador
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const themeBtn = document.createElement('button');
themeBtn.type = 'button';
themeBtn.className = 'theme-btn';
const icons = {
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></svg>'
};
function isDark() {
  const t = root.dataset.theme;
  return t ? t === 'dark' : darkQuery.matches;
}
function paintThemeBtn() {
  const dark = isDark();
  themeBtn.innerHTML = dark ? icons.sun : icons.moon;
  themeBtn.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  themeBtn.title = themeBtn.getAttribute('aria-label');
}
themeBtn.addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  const apply = () => { root.dataset.theme = next; paintThemeBtn(); };
  if (document.startViewTransition && !reduceMotion.matches) document.startViewTransition(apply);
  else apply();
  try { localStorage.setItem('tema', next); } catch (e) { /* sin almacenamiento: solo dura esta visita */ }
});
darkQuery.addEventListener('change', paintThemeBtn);
paintThemeBtn();

// Menú en pantallas pequeñas
const menuBtn = document.querySelector('.menu-btn');
const nav = document.getElementById('menu');
menuBtn.before(themeBtn);
function closeMenu() {
  nav.classList.remove('is-open');
  menuBtn.setAttribute('aria-expanded', 'false');
}
menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menuBtn.focus(); }
});

// Resalta en el menú la sección visible
const links = document.querySelectorAll('.nav a');
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    links.forEach((a) => {
      if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main > section[id]').forEach((s) => spy.observe(s));

// Pictogramas y gráfico de barras: se completan al llegar a ellos
if (!reduceMotion.matches && 'IntersectionObserver' in window) {
  root.classList.add('anim');

  // Aparición escalonada de títulos y tarjetas
  const rvSel = 'main > section:not(.cover) h2, .dict, .define, .ticket, .aside, .eng__big, .eng__item, .factor, .map, .sim__intro, .sim__panel, .reco-lead, .env-ui, .quiz__card, .insights li, .chart, .pass';
  const rv = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      // también se muestra si ya quedó arriba (por ejemplo, al saltar con el menú)
      if (!e.isIntersecting && e.boundingClientRect.top > 0) return;
      const el = e.target;
      el.classList.add('is-in');
      rv.unobserve(el);
      // al terminar, se quitan las clases para que el efecto de inclinación funcione libre
      setTimeout(() => el.classList.remove('rv', 'is-in'), 1400);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll(rvSel).forEach((el) => {
    const sib = [...el.parentElement.children].filter((c) => c.matches(rvSel));
    el.style.setProperty('--d', Math.min(sib.indexOf(el), 5));
    el.classList.add('rv');
    rv.observe(el);
  });

  // Cifras que cuentan desde cero (el valor final queda para lectores de pantalla)
  const counter = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      counter.unobserve(e.target);
      const el = e.target;
      const final = el.textContent.trim();
      const m = final.match(/^(\d+(?:,\d+)?)\s*%$/);
      if (!m) return;
      const target = parseFloat(m[1].replace(',', '.'));
      const dec = m[1].includes(',') ? m[1].split(',')[1].length : 0;
      el.innerHTML = '<span class="sr-only"></span><span aria-hidden="true"></span>';
      el.firstChild.textContent = final;
      const live = el.lastChild;
      const t0 = performance.now();
      (function tick(now) {
        const k = Math.min(1, (now - t0) / 1400);
        live.textContent = (target * (1 - Math.pow(1 - k, 3))).toFixed(dec).replace('.', ',') + ' %';
        if (k < 1) requestAnimationFrame(tick); else live.textContent = final;
      })(t0);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.ticket__num, .eng__num').forEach((el) => counter.observe(el));

  // Inclinación 3D al pasar el mouse por boletos, fichas y pases
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.ticket, .eng__item, .eng__big, .pass, .quiz__card, .card').forEach((el) => {
      el.classList.add('tilt');
      el.addEventListener('pointermove', (ev) => {
        const r = el.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width - 0.5;
        const y = (ev.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (x * 6).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', () => { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); });
    });
  }

  // El tablero sigue cambiando estados mientras está a la vista
  const ALPHA = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZÁÉÍÓÚ';
  const STATES = ['RETRASADO', 'MAÑANA', 'ÚLTIMA HORA', 'POSTERGADO', 'EN ESPERA', 'LUEGO', 'PENDIENTE'];
  const groups = [...document.querySelectorAll('.flaps')];
  let boardVisible = true;
  new IntersectionObserver((en) => { boardVisible = en[0].isIntersecting; }).observe(document.querySelector('.board'));
  let turn = 0;
  setInterval(() => {
    if (!boardVisible || document.hidden) return;
    const g = groups[turn++ % groups.length];
    const shown = groups.map((x) => x.dataset.text);
    const opts = STATES.filter((s) => !shown.includes(s));
    const next = opts[Math.floor(Math.random() * opts.length)];
    g.dataset.text = next;
    const cells = [...g.children];
    const target = next.padEnd(cells.length, ' ');
    cells.forEach((cell, col) => {
      let steps = 4 + col;
      const spin = () => {
        cell.classList.remove('tick'); void cell.offsetWidth; cell.classList.add('tick');
        if (steps-- > 0) { cell.textContent = ALPHA[Math.floor(Math.random() * ALPHA.length)]; setTimeout(spin, 65); }
        else cell.textContent = target[col];
      };
      spin();
    });
  }, 4200);
  const lights = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      lights.unobserve(e.target);
    });
  }, { threshold: 0.35 });
  document.querySelectorAll('.pict, .chart').forEach((el) => lights.observe(el));
}

// Simulador de la teoría de la motivación temporal (ilustrativo)
(function simulator() {
  const form = document.querySelector('.sim__panel');
  if (!form) return;
  const ticks = form.querySelector('.gauge__ticks');
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI - (i / 10) * Math.PI;
    const r1 = i % 5 === 0 ? 80 : 86;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', (120 + r1 * Math.cos(a)).toFixed(1));
    line.setAttribute('y1', (120 - r1 * Math.sin(a)).toFixed(1));
    line.setAttribute('x2', (120 + 92 * Math.cos(a)).toFixed(1));
    line.setAttribute('y2', (120 - 92 * Math.sin(a)).toFixed(1));
    ticks.append(line);
  }
  const $ = (id) => form.querySelector('#' + id);
  const needle = form.querySelector('.gauge__needle');
  const out = form.querySelector('.sim__out');
  let last = '';
  function update() {
    const m = (+$('s-e').value * +$('s-v').value) / (+$('s-i').value * +$('s-d').value);
    const k = Math.max(-1, Math.min(1, Math.log10(m) / 1.5)); // de -1 (después) a 1 (hoy)
    needle.style.setProperty('--a', (k * 90).toFixed(1) + 'deg');
    const text = k < -0.25 ? 'Lo dejas para después.' : k > 0.3 ? 'Empiezas hoy.' : 'Empiezas, pero sin apuro.';
    if (text !== last) { out.textContent = text; last = text; out.classList.remove('bump'); void out.offsetWidth; out.classList.add('bump'); }
  }
  form.addEventListener('input', update);
  update();
})();

// Recomendaciones: selector de los nueve factores del entorno
(function envTabs() {
  const list = document.querySelector('.env');
  if (!list) return;
  // Las fichas pasan de lista a paneles de pestañas
  const panels = document.createElement('div');
  panels.className = 'env';
  const items = [...list.querySelectorAll('.env__item')].map((li) => {
    const d = document.createElement('div');
    d.className = li.className;
    d.id = li.id;
    d.append(...li.childNodes);
    panels.append(d);
    return d;
  });
  list.replaceWith(panels);
  const ui = document.createElement('div');
  ui.className = 'env-ui';
  const tabs = document.createElement('div');
  tabs.className = 'env-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Factores del entorno de estudio');
  tabs.setAttribute('aria-orientation', 'vertical');
  panels.before(ui);
  ui.append(tabs, panels);
  const btns = items.map((item, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'env-tab';
    b.id = 'env-tab-' + (i + 1);
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', item.id);
    b.textContent = item.querySelector('.env__factor').textContent;
    item.setAttribute('role', 'tabpanel');
    item.setAttribute('aria-labelledby', b.id);
    item.tabIndex = 0;
    b.addEventListener('click', () => select(i));
    b.addEventListener('keydown', (e) => {
      const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      if (e.key in keys) { e.preventDefault(); select((i + keys[e.key] + items.length) % items.length, true); }
      if (e.key === 'Home') { e.preventDefault(); select(0, true); }
      if (e.key === 'End') { e.preventDefault(); select(items.length - 1, true); }
    });
    tabs.append(b);
    return b;
  });
  function select(n, focus) {
    btns.forEach((b, i) => {
      b.setAttribute('aria-selected', String(i === n));
      b.tabIndex = i === n ? 0 : -1;
      items[i].hidden = i !== n;
    });
    if (focus) btns[n].focus();
  }
  select(0);
})();

// ¿Mito o realidad?: el resultado se anuncia con aria-live y se marca con un sello
(function quiz() {
  const quizEl = document.querySelector('.quiz');
  if (!quizEl) return;
  const cards = [...quizEl.querySelectorAll('.quiz__card')];
  const score = document.querySelector('.quiz__score');
  const icon = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9.5"/><path d="m7.8 12.4 3 3 5.6-6.4"/></svg>',
    bad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9.5"/><path d="m8.8 8.8 6.4 6.4M15.2 8.8l-6.4 6.4"/></svg>'
  };
  let hits = 0, done = 0;
  cards.forEach((card) => {
    // Sin JavaScript la explicación se ve de entrada; con JavaScript aparece al responder
    const exp = card.querySelector('.quiz__exp');
    const ans = exp.querySelector('.quiz__ans').textContent;
    const text = exp.querySelector('p:not(.quiz__ans)').innerHTML;
    exp.remove();
    const fb = card.querySelector('.quiz__fb');
    card.querySelectorAll('.quiz__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (card.dataset.done) return;
        card.dataset.done = '1';
        const right = card.dataset.answer;
        const ok = btn.dataset.choice === right;
        btn.classList.add('is-chosen', ok ? 'ok' : 'bad');
        card.querySelector(`.quiz__btn[data-choice="${right}"]`).classList.add('is-right');
        const stamp = document.createElement('span');
        stamp.className = 'stamp stamp--' + right;
        stamp.setAttribute('aria-hidden', 'true');
        stamp.textContent = right === 'mito' ? 'MITO' : 'REALIDAD';
        card.append(stamp);
        fb.innerHTML = `<p class="quiz__res ${ok ? 'ok' : 'bad'}">${ok ? icon.ok : icon.bad}<span>${ok ? '¡Acertaste!' : 'No acertaste.'} ${ans}</span></p><p>${text}</p>`;
        if (ok) hits++;
        done++;
        score.innerHTML = `Aciertos: <strong>${hits} de ${cards.length}</strong>` + (done === cards.length ? '. Respondiste todas.' : '');
        score.classList.remove('bump'); void score.offsetWidth; score.classList.add('bump');
      });
    });
  });
})();

// Fichero de estudios: filtro por ámbito
const buttons = document.querySelectorAll('.filters button');
const studyCards = document.querySelectorAll('.card');
const status = document.getElementById('filtro-estado');
buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    let shown = 0;
    studyCards.forEach((c) => {
      c.hidden = f !== 'todos' && c.dataset.ambito !== f;
      if (!c.hidden) shown++;
    });
    status.textContent = `Se muestran ${shown} estudios.`;
  });
});

// Botón para volver al inicio
const toTop = document.createElement('button');
toTop.type = 'button';
toTop.className = 'to-top';
toTop.setAttribute('aria-label', 'Volver al inicio');
toTop.title = 'Volver al inicio';
toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>';
toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0 });
  document.querySelector('.brand').focus({ preventScroll: true });
});
document.body.append(toTop);
const progress = document.createElement('div');
progress.className = 'progress';
progress.setAttribute('aria-hidden', 'true');
document.body.append(progress);
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    toTop.classList.toggle('is-shown', window.scrollY > window.innerHeight);
    const max = root.scrollHeight - window.innerHeight;
    progress.style.setProperty('--p', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
  });
}, { passive: true });
