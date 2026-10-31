document.documentElement.classList.add('js');

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Reloj de bolsillo: el minutero da una vuelta y el horario pasa de las 11 a las 12 mientras se lee
function dial(className, full) {
  let marks = '';
  for (let i = 0; i < 60; i++) {
    const hour = i % 5 === 0;
    if (!hour && !full) continue;
    const a = (i * 6 * Math.PI) / 180;
    const r1 = 86;
    const r2 = hour ? (full ? 76 : 70) : 81;
    const x1 = (100 + r1 * Math.sin(a)).toFixed(2);
    const y1 = (100 - r1 * Math.cos(a)).toFixed(2);
    const x2 = (100 + r2 * Math.sin(a)).toFixed(2);
    const y2 = (100 - r2 * Math.cos(a)).toFixed(2);
    marks += `<line class="dial__tick${hour ? ' dial__tick--h' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  const numerals = full
    ? '<text class="dial__num" x="100" y="44">XII</text><text class="dial__num" x="160" y="106">III</text>' +
      '<text class="dial__num" x="100" y="168">VI</text><text class="dial__num" x="40" y="106">IX</text>'
    : '';
  return `<svg class="${className}" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <circle class="dial__case" cx="100" cy="100" r="96"/>
    ${full ? '<circle class="dial__face" cx="100" cy="100" r="88"/><circle class="dial__ring" cx="100" cy="100" r="62"/>' : ''}
    ${marks}${numerals}
    <g class="dial__hands">
      ${full
        ? `<g class="dial__hand dial__hand--hour"><path d="M100 108V82"/><circle cx="100" cy="75" r="6.5"/><path d="M100 68.5V60"/></g>
      <g class="dial__hand dial__hand--min"><path d="M100 114V68"/><circle cx="100" cy="61" r="6"/><path d="M100 55V52"/></g>`
        : `<g class="dial__hand dial__hand--hour"><path d="M100 110V72"/><circle cx="100" cy="65" r="7"/><path d="M100 58V46"/></g>
      <g class="dial__hand dial__hand--min"><path d="M100 114V56"/><circle cx="100" cy="49" r="6"/><path d="M100 43V24"/></g>`}
    </g>
    <circle class="dial__pin" cx="100" cy="100" r="${full ? 5 : 14}"/>
  </svg>`;
}
document.querySelector('.brand').insertAdjacentHTML('afterbegin', dial('dial dial--mini', false));
document.getElementById('titulo').insertAdjacentHTML('afterend', dial('dial dial--hero', true));

// Modo claro u oscuro, recordado en este navegador
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const themeBtn = document.createElement('button');
themeBtn.type = 'button';
themeBtn.className = 'theme-btn';
const icons = {
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></svg>'
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

// Filtro de antecedentes por ámbito, con transición entre fichas
const buttons = document.querySelectorAll('.filters button');
const cards = document.querySelectorAll('.card');
const status = document.getElementById('filtro-estado');
cards.forEach((c, i) => { c.style.viewTransitionName = `ficha-${i + 1}`; });
buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    const apply = () => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      let shown = 0;
      cards.forEach((c) => {
        c.hidden = f !== 'todos' && c.dataset.ambito !== f;
        if (!c.hidden) shown++;
      });
      status.textContent = `Se muestran ${shown} antecedentes.`;
    };
    if (document.startViewTransition && !reduceMotion.matches) document.startViewTransition(apply);
    else apply();
  });
});

// Botón para volver al inicio
const toTop = document.createElement('button');
toTop.type = 'button';
toTop.className = 'to-top';
toTop.setAttribute('aria-label', 'Volver al inicio');
toTop.title = 'Volver al inicio';
toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>';
toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0 });
  document.querySelector('.brand').focus({ preventScroll: true });
});
document.body.append(toTop);

// Progreso de lectura: mueve el reloj y muestra el botón de inicio
let ticking = false;
function update() {
  ticking = false;
  const max = root.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  root.style.setProperty('--p', p.toFixed(4));
  toTop.classList.toggle('is-shown', window.scrollY > window.innerHeight);
}
function requestUpdate() {
  if (!ticking) { ticking = true; requestAnimationFrame(update); }
}
window.addEventListener('scroll', requestUpdate, { passive: true });
window.addEventListener('resize', requestUpdate);
update();

// Resalta en el menú la sección visible
const links = document.querySelectorAll('.nav a');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    links.forEach((a) => {
      if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main > section[id]').forEach((s) => observer.observe(s));
