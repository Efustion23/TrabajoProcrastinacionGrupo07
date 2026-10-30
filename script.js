document.documentElement.classList.add('js');

// Menú en pantallas pequeñas
const menuBtn = document.querySelector('.menu-btn');
const nav = document.getElementById('menu');
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

// Filtro de antecedentes por ámbito
const buttons = document.querySelectorAll('.filters button');
const cards = document.querySelectorAll('.card');
const status = document.getElementById('filtro-estado');
buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    let shown = 0;
    cards.forEach((c) => {
      c.hidden = f !== 'todos' && c.dataset.ambito !== f;
      if (!c.hidden) shown++;
    });
    status.textContent = `Se muestran ${shown} antecedentes.`;
  });
});

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
