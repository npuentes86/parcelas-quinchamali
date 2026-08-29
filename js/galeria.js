/* ═══════════════════════════════════════════════════════════
   Galería aérea — desde-el-aire.html
   Superpone el plano del loteo sobre la toma del dron, en vivo
   contra el tiempo del video. Lee los lotes de datos.js, que
   sigue siendo la única fuente de verdad.
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

  /* ── 2. proyección de suelo ─────────────────────────────────
     Cámara estenopeica sobre plano: un punto a distancia z del
     dron y desplazamiento lateral X respecto del eje del camino
     cae en
         x = VPx + S·X/z          y = VPy + K/z
     Los parámetros se ajustaron contra fotogramas reales de la
     toma: el eje calza con el camino interior y, al final del
     vuelo, el Lote 2 queda sobre el deslinde norte.            */
  var P = {
    VPx: 0.529, VPy: 0.158,  // punto de fuga del camino
    K: 0.405,                // altura aparente de la cámara
    S: 0.62,                 // escala lateral
    medioCamino: 0.045,      // semiancho del camino interior
    z0: 0.85,                // deslinde sur, junto al camino público
    vel: 0.115               // avance del dron por segundo
  };

  /* Perfil de la franja, tomado de las cotas del plano de subdivisión
     inscrito. El loteo se angosta hacia el sur: el fondo pasa de ~94 m
     en el extremo norte a ~55 m junto al camino público, y los frentes
     sobre el camino crecen de 58,87 a 91,02 compensando. Por eso las
     parcelas mantienen superficie pareja siendo de dimensiones distintas. */
  var FONDO_N = 1.00, FONDO_S = 0.58, LARGO_TOTAL = 6.30;

  /* Reparto por área acumulada con cortes perpendiculares al eje del
     camino. Con fondo lineal el área acumulada es cuadrática y el corte
     sale exacto:   dS·s + k·s² = A,  con k = (dN−dS)/2L               */
  function cortes(n) {
    var Ltot = LARGO_TOTAL, dN = FONDO_N, dS = FONDO_S;
    var total = Ltot * (dN + dS) / 2, k = (dN - dS) / (2 * Ltot), s = [];
    for (var i = 0; i <= n; i++) {
      var A = total * i / n;
      s.push(k > 1e-9 ? (-dS + Math.sqrt(dS * dS + 4 * k * A)) / (2 * k) : A / dS);
    }
    return s;
  }
  function fondoEn(s) { return FONDO_S + (FONDO_N - FONDO_S) * s / LARGO_TOTAL; }

  /* El 18 está en el camino público y el 2 en el extremo norte: volando
     hacia el norte, la numeración decrece con la distancia. Los pares
     quedan al poniente (izquierda), los impares hacia el camino. */
  var nums = L.lotes.map(function (l) { return l.n; });
  var vendido = {};
  L.lotes.forEach(function (l) { vendido[l.n] = l.estado === 'vendido'; });
  var pares   = nums.filter(function (n) { return n % 2 === 0; }).reverse();
  var impares = nums.filter(function (n) { return n % 2 === 1; }).reverse();

  var NS = 'http://www.w3.org/2000/svg';
  var svg = $('#ov'), vid = $('#vid');
  if (!svg || !vid) return;

  function proy(X, z) {
    if (z < 0.12) z = 0.12;
    return [P.VPx + P.S * X / z, P.VPy + P.K / z];
  }
  function quad(X1, X2, z1, z2) {
    var a = proy(X1, z1), b = proy(X2, z1), c = proy(X2, z2), d = proy(X1, z2);
    return a[0] + ',' + a[1] + ' ' + b[0] + ',' + b[1] + ' ' +
           c[0] + ',' + c[1] + ' ' + d[0] + ',' + d[1];
  }

  function pintar(t) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var off = P.vel * t;
    [[pares, -1], [impares, 1]].forEach(function (par) {
      var s = cortes(par[0].length);
      par[0].forEach(function (n, i) {
        var z1 = P.z0 + s[i] - off, z2 = P.z0 + s[i + 1] - 0.05 - off;
        if (z2 < 0.16) return;
        z1 = Math.max(z1, 0.16); z2 = Math.max(z2, 0.17);
        var fondo = fondoEn((s[i] + s[i + 1]) / 2);
        var q = document.createElementNS(NS, 'polygon');
        q.setAttribute('points', quad(par[1] * P.medioCamino, par[1] * fondo, z1, z2));
        q.setAttribute('class', 'lote' + (vendido[n] ? ' vendido' : ''));
        svg.appendChild(q);
        var zc = (z1 + z2) / 2, pc = proy(par[1] * (P.medioCamino + fondo) / 2, zc);
        if (zc < 4.2 && pc[1] < 0.55) {
          var tx = document.createElementNS(NS, 'text');
          tx.setAttribute('x', pc[0]);
          tx.setAttribute('y', pc[1]);
          tx.setAttribute('class', 'num');
          tx.setAttribute('font-size', Math.max(0.013, 0.052 / zc));
          tx.textContent = n;
          svg.appendChild(tx);
        }
      });
    });
    var e = document.createElementNS(NS, 'polyline');
    var p1 = proy(0, 0.16), p2 = proy(0, 40);
    e.setAttribute('points', p1[0] + ',' + p1[1] + ' ' + p2[0] + ',' + p2[1]);
    e.setAttribute('class', 'eje');
    svg.appendChild(e);
  }

  var corriendo = false;
  function bucle() {
    if (!corriendo) return;
    pintar(vid.currentTime);
    requestAnimationFrame(bucle);
  }
  vid.addEventListener('play', function () {
    if (!corriendo) { corriendo = true; requestAnimationFrame(bucle); }
  });
  vid.addEventListener('pause', function () { corriendo = false; pintar(vid.currentTime); });
  vid.addEventListener('seeked', function () { pintar(vid.currentTime); });
  vid.addEventListener('loadeddata', function () { pintar(vid.currentTime); });
  pintar(0);

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var p = vid.play();
    if (p && p.catch) p.catch(function () {});
  }

  /* ── 3. mandos ──────────────────────────────────────────── */
  var ver = $('#ver');
  /* El calce de esta versión está siendo rehecho contra la homografía del
     render de referencia; hasta entonces el plano arranca apagado y el
     visitante lo enciende si quiere. */
  svg.style.display = ver.checked ? '' : 'none';
  ver.addEventListener('change', function () {
    svg.style.display = this.checked ? '' : 'none';
  });
  $('#op').addEventListener('input', function () {
    svg.style.opacity = this.value / 100;
  });

  /* La ficha de abajo comparte el archivo del visor: el navegador ya lo
     tiene en caché, así que no se descarga de nuevo. */
  var boton = $('#cargar'), otra = $('#toma-larga');
  if (boton && otra) {
    boton.addEventListener('click', function () {
      otra.src = vid.currentSrc || vid.getAttribute('src');
      otra.hidden = false;
      boton.hidden = true;
      var q = otra.play();
      if (q && q.catch) q.catch(function () {});
    });
  }

  /* ── 4. lupa de la hoja de contacto ─────────────────────── */
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
