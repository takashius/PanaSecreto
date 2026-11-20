/* EntrePanas · comportamiento mínimo: sobre de muestra, formulario de código y entrada suave. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  /* Sobre: revela un alias real del catálogo */
  var openBtn = document.querySelector('[data-sobre-open]');
  var panel = document.querySelector('[data-sobre-reveal]');
  var aliasEl = document.querySelector('[data-sobre-alias]');
  var again = document.querySelector('[data-sobre-again]');
  var list = window.ENTREPANAS_ALIASES || [];
  var last = -1;

  function pick() {
    var i;
    do { i = Math.floor(Math.random() * list.length); } while (list.length > 1 && i === last);
    last = i;
    return list[i];
  }

  if (openBtn && panel && aliasEl && list.length) {
    openBtn.hidden = false;
    openBtn.addEventListener('click', function () {
      aliasEl.textContent = pick();
      openBtn.hidden = true;
      panel.hidden = false;
      again.focus({ preventScroll: true });
    });
    again.addEventListener('click', function () {
      aliasEl.textContent = pick();
      panel.style.animation = 'none';
      void panel.offsetWidth;
      panel.style.animation = '';
    });
  }

  /* Código de grupo: valida y manda a la app vía /join/CODE del backend */
  var form = document.getElementById('join-form');
  if (form) {
    var input = document.getElementById('code');
    var err = document.getElementById('code-error');
    var meta = document.querySelector('meta[name="entrepanas:api"]');
    var api = meta ? meta.content.replace(/\/+$/, '') : '';

    input.addEventListener('input', function () {
      input.removeAttribute('aria-invalid');
      err.hidden = true;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var code = input.value.replace(/\s+/g, '').toUpperCase();
      if (!/^PANA-[A-Z0-9]{4}-[A-Z0-9]{2}$/.test(code)) {
        input.setAttribute('aria-invalid', 'true');
        err.textContent = 'Ese código no cuadra. Debe verse así: PANA-XXXX-XX.';
        err.hidden = false;
        input.focus();
        return;
      }
      window.location.href = api + '/join/' + encodeURIComponent(code);
    });
  }

  /* Entrada suave de secciones */
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var targets = document.querySelectorAll('.step, .facts li, .tile, .chat, .wish');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    targets.forEach(function (t) { t.classList.add('reveal-in'); io.observe(t); });
  }
})();
