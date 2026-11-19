/* Decorin theme scripts — no dependencies. */
(() => {
  'use strict';

  /* ---------- Header: solid background once the page scrolls ---------- */
  const onScroll = () => document.body.classList.toggle('header-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const menu = document.querySelector('[data-menu]');
  const openBtn = document.querySelector('[data-menu-open]');
  if (menu && openBtn) {
    const closeBtn = menu.querySelector('[data-menu-close]');
    const open = () => {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      document.body.classList.add('menu-open');
      openBtn.setAttribute('aria-expanded', 'true');
      closeBtn && closeBtn.focus();
    };
    const close = () => {
      menu.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      openBtn.setAttribute('aria-expanded', 'false');
      setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 450);
      openBtn.focus();
    };
    openBtn.addEventListener('click', open);
    closeBtn && closeBtn.addEventListener('click', close);
    menu.addEventListener('click', (e) => { if (e.target === menu) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) close(); });
  }

  /* ---------- Countdown ---------- */
  document.querySelectorAll('[data-countdown]').forEach((el) => {
    const target = new Date(el.dataset.countdown);
    if (isNaN(target)) { el.hidden = true; return; }
    const units = {};
    el.querySelectorAll('[data-unit]').forEach((u) => { units[u.dataset.unit] = u; });
    const label = el.querySelector('[data-countdown-label]');
    const pad = (n) => String(n).padStart(2, '0');
    let timer;
    const tick = () => {
      const diff = target - new Date();
      if (diff <= 0) {
        el.classList.add('is-done');
        if (label) label.textContent = el.dataset.done;
        clearInterval(timer);
        return;
      }
      const s = Math.floor(diff / 1000);
      units.days && (units.days.textContent = pad(Math.floor(s / 86400)));
      units.hours && (units.hours.textContent = pad(Math.floor((s % 86400) / 3600)));
      units.minutes && (units.minutes.textContent = pad(Math.floor((s % 3600) / 60)));
      units.seconds && (units.seconds.textContent = pad(s % 60));
    };
    tick();
    timer = setInterval(tick, 1000);
  });

  /* ---------- Carousel (native scroll-snap + arrows/dots) ---------- */
  const initCarousel = (section) => {
    const track = section.querySelector('[data-carousel-track]');
    if (!track || track.dataset.ready) return;
    track.dataset.ready = 'true';
    const slides = Array.from(track.children);
    const prev = section.querySelector('[data-carousel-prev]');
    const next = section.querySelector('[data-carousel-next]');
    const dots = Array.from(section.querySelectorAll('[data-carousel-dots] button'));

    const step = () => (slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth);
    const goTo = (i) => track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: 'smooth' });

    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      const index = Math.round(track.scrollLeft / step());
      const active = track.scrollLeft >= max ? slides.length - 1 : Math.min(index, slides.length - 1);
      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === active);
        d.setAttribute('aria-current', i === active ? 'true' : 'false');
      });
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
    };

    prev && prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next && next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step(), behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -step(), behavior: 'smooth' }); }
    });
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);
    update();
  };

  const initAll = () => document.querySelectorAll('.highlights').forEach(initCarousel);
  initAll();
  // Re-init when sections are edited in the Shopify theme editor
  document.addEventListener('shopify:section:load', initAll);
})();
