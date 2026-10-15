/* ============================================================
   Portafolio de datos
   Interacciones sin dependencias. Todo degrada bien si el JS no
   carga: el contenido es visible y los enlaces siguen siendo HTML.
   ============================================================ */

(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (id) => document.getElementById(id);

  /* ---------------------------------------------------------
     1. Tema claro / oscuro (con persistencia)
     --------------------------------------------------------- */
  const themeButton = $('theme-toggle');
  const metaTheme = $('meta-theme');
  const THEME_COLORS = { dark: '#121514', light: '#f0f1eb' };

  function syncTheme() {
    const theme = root.dataset.theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = theme;

    if (metaTheme) metaTheme.setAttribute('content', THEME_COLORS[theme]);
    if (!themeButton) return;

    const isLight = theme === 'light';
    themeButton.setAttribute('aria-pressed', String(isLight));
    themeButton.setAttribute('aria-label', isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
    themeButton.innerHTML = isLight
      ? '<span aria-hidden="true">☼</span>'
      : '<span aria-hidden="true">◐</span>';
  }

  syncTheme();

  if (themeButton) {
    themeButton.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('portfolio-theme', root.dataset.theme); } catch (e) {}
      syncTheme();
    });
  }

  /* ---------------------------------------------------------
     2. Navegación móvil
     --------------------------------------------------------- */
  const menuButton = $('menu-toggle');
  const nav = $('main-nav');

  function setMenu(open) {
    if (!menuButton || !nav) return;
    nav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Cerrar navegación' : 'Abrir navegación');
  }

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => setMenu(!nav.classList.contains('open')));

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenu(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenu(false);
    });

    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('open')) return;
      if (nav.contains(event.target) || menuButton.contains(event.target)) return;
      setMenu(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) setMenu(false);
    });
  }

  /* ---------------------------------------------------------
     3. Barra de progreso de lectura
     --------------------------------------------------------- */
  const progress = $('progress');

  function updateProgress() {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  /* ---------------------------------------------------------
     4. Resaltar la sección visible en la navegación
     --------------------------------------------------------- */
  if (nav && 'IntersectionObserver' in window) {
    const navLinks = [...nav.querySelectorAll('a')];
    const sections = [...document.querySelectorAll('main section[id]')];

    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const activo = link.hash === `#${entry.target.id}`;
          link.classList.toggle('active', activo);
          if (activo) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-25% 0px -60% 0px' });

    sections.forEach((section) => spy.observe(section));
  }

  /* ---------------------------------------------------------
     5. Entrada suave de bloques (solo si hay IntersectionObserver)
     --------------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    '.folio-archive-heading, .folio-case, .folio-stack-grid > article, .folio-profile-grid > *, .folio-contact-card'
  );

  if ('IntersectionObserver' in window && revealTargets.length) {
    const revealer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const order = Number(entry.target.dataset.revealOrder || 0);
        entry.target.style.transitionDelay = `${Math.min(order, 3) * 70}ms`;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealTargets.forEach((element, index) => {
      element.classList.add('reveal');
      element.dataset.revealOrder = String(index % 4);
      revealer.observe(element);
    });
  }

  /* ---------------------------------------------------------
     6. Copiar el correo
     --------------------------------------------------------- */
  const copyButton = $('copy-mail');

  if (copyButton) {
    const original = copyButton.textContent;

    copyButton.addEventListener('click', async () => {
      const value = copyButton.dataset.copy || '';
      let done = false;

      try {
        await navigator.clipboard.writeText(value);
        done = true;
      } catch (e) {
        // Reserva para contextos sin permiso de portapapeles (file://, por ejemplo).
        const field = document.createElement('textarea');
        field.value = value;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        try { done = document.execCommand('copy'); } catch (err) { done = false; }
        document.body.removeChild(field);
      }

      copyButton.textContent = done ? 'Correo copiado ✓' : 'Copia manual: ' + value;
      copyButton.classList.toggle('is-copied', done);
      window.setTimeout(() => {
        copyButton.textContent = original;
        copyButton.classList.remove('is-copied');
      }, 2200);
    });
  }

})();
