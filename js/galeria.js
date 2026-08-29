/* ═══════════════════════════════════════════════════════════
   Galería aérea — desde-el-aire.html
   Cifras, enlaces de contacto y lupa de la hoja de contacto.
   Las cifras salen de datos.js, que sigue siendo la única fuente
   de verdad. El plano sobre el vuelo va grabado en el video, no
   se dibuja acá.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var L = window.LOTEO;
  if (!L) return;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ── 1. cifras y enlaces ────────────────────────────────── */
  var nf = new Intl.NumberFormat('es-CL');
  function cuenta(estado) {
    return L.lotes.filter(function (l) { return l.estado === estado; }).length;
  }
  $$('[data-cifra="total"]').forEach(function (n) { n.textContent = nf.format(L.lotes.length); });
  $$('[data-cifra="disponibles"]').forEach(function (n) { n.textContent = nf.format(cuenta('disponible')); });
  $$('[data-cifra="vendidos"]').forEach(function (n) { n.textContent = nf.format(cuenta('vendido')); });
  $$('[data-cifra="superficie"]').forEach(function (n) {
    n.textContent = (L.superficieAprox ? '≈ ' : '') + nf.format(L.superficieM2) + ' m²';
  });
  $$('[data-wa]').forEach(function (a) {
    a.href = 'https://wa.me/' + L.telefonoE164 + '?text=' + encodeURIComponent(
      'Hola ' + L.vendedor.split(' ')[0] + ', vi el video aéreo del loteo y me interesa saber más.'
    );
  });

  /* ── 2. lupa de la hoja de contacto ─────────────────────── */
  var lupa = $('#lupa'), grande = $('#lupa-img'), ultimo = null;
  function abrir(btn) {
    var im = $('img', btn);
    grande.src = im.src;
    grande.alt = im.alt;
    lupa.setAttribute('open', '');
    ultimo = btn;
    $('#lupa-cerrar').focus();
  }
  function cerrar() {
    lupa.removeAttribute('open');
    if (ultimo) { ultimo.focus(); ultimo = null; }
  }
  $('#hoja').addEventListener('click', function (ev) {
    var b = ev.target.closest('.frame');
    if (b) abrir(b);
  });
  $('#lupa-cerrar').addEventListener('click', cerrar);
  lupa.addEventListener('click', function (ev) { if (ev.target === lupa) cerrar(); });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && lupa.hasAttribute('open')) cerrar();
  });
})();
