/* ═══════════════════════════════════════════════════════════
   Parcelas Santa Rita — interacción del catálogo
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var L = window.LOTEO;
  if (!L) return;

  var nfMiles = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
  var nfUF    = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

  var ETIQUETA = { disponible: 'Disponible', reservado: 'Reservado', vendido: 'Vendido' };

  var precioCLP = Math.round(L.precioUF * L.uf);
  var moneda    = 'UF';           // 'UF' | 'CLP'
  var filtro    = 'disponible';   // estado o 'todos'
  var seleccion = null;

  /* ── helpers ──────────────────────────────────────────── */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function svgEl(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  function cuenta(estado) {
    return L.lotes.filter(function (l) { return l.estado === estado; }).length;
  }
  function superficieTxt() {
    return (L.superficieAprox ? '≈ ' : '') + nfMiles.format(L.superficieM2) + ' m²';
  }
  function precioTxt() {
    return moneda === 'UF' ? 'UF ' + nfUF.format(L.precioUF) : '$' + nfMiles.format(precioCLP);
  }
  function precioSecundario() {
    return moneda === 'UF'
      ? '≈ $' + nfMiles.format(precioCLP) + ' al ' + L.ufFecha
      : 'UF ' + nfUF.format(L.precioUF) + ' — UF al ' + L.ufFecha;
  }
  function waLink(texto) {
    return 'https://wa.me/' + L.telefonoE164 + '?text=' + encodeURIComponent(texto);
  }

  /* ── 1. cifras del hero ───────────────────────────────── */
  function pintarCifras() {
    var d = cuenta('disponible');
    $$('[data-cifra="disponibles"]').forEach(function (n) { n.textContent = nfMiles.format(d); });
    $$('[data-cifra="total"]').forEach(function (n) { n.textContent = nfMiles.format(L.lotes.length); });
    $$('[data-cifra="precio"]').forEach(function (n) { n.textContent = 'UF ' + nfUF.format(L.precioUF); });
    $$('[data-cifra="precio-clp"]').forEach(function (n) {
      n.textContent = '≈ $' + nfMiles.format(precioCLP) + ' hoy';
    });
    $$('[data-cifra="precio-clp-plano"]').forEach(function (n) {
      n.textContent = nfMiles.format(precioCLP);
    });
    $$('[data-cifra="superficie"]').forEach(function (n) { n.textContent = superficieTxt(); });
    $$('[data-uf-valor]').forEach(function (n) { n.textContent = '$' + new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(L.uf); });
    $$('[data-uf-fecha]').forEach(function (n) { n.textContent = L.ufFecha; });
  }

  /* ── 2. plano interactivo ─────────────────────────────── */
  function pintarPlano() {
    var svg = $('#plano-svg');
    if (!svg) return;

    var pares   = L.lotes.filter(function (l) { return l.n % 2 === 0; });
    var impares = L.lotes.filter(function (l) { return l.n % 2 === 1; });

    var g = svgEl('g', { transform: 'rotate(-5 200 320)' });

    function columna(lista, x, ancho, yIni, alto) {
      lista.forEach(function (lote, i) {
        var y = yIni + i * (alto + 3);
        var fig = svgEl('g', {
          'class': 'lote-fig',
          'data-estado': lote.estado,
          'data-lote': lote.n,
          tabindex: '0',
          role: 'button',
          'aria-label': 'Lote ' + lote.n + ' — ' + ETIQUETA[lote.estado] + '. Ver ficha.'
        });
        fig.appendChild(svgEl('rect', {
          'class': 'cuerpo', x: x, y: y, width: ancho, height: alto, rx: 2.5
        }));
        var t = svgEl('text', {
          'class': 'n', x: x + ancho / 2, y: y + alto / 2 + 4,
          'text-anchor': 'middle'
        });
        t.textContent = lote.n;
        fig.appendChild(t);
        g.appendChild(fig);
      });
    }

    /* Las 17 parcelas son equivalentes (≈5.000 m²), así que las dos columnas
       deben acusar la misma superficie en pantalla. Como la fila par tiene 9
       lotes y la impar 8, la impar va más alta y se compensa con menos ancho:
       132×60 = 7.920 · 116×68 = 7.888 (0,4% de diferencia). */
    columna(pares,   46,  132, 34, 60);
    columna(impares, 184, 116, 38, 68);

    /* camino público */
    g.appendChild(svgEl('rect', { 'class': 'camino-banda', x: 308, y: 24, width: 30, height: 590, rx: 3 }));
    var ct = svgEl('text', { 'class': 'camino-txt', x: 323, y: 320, 'text-anchor': 'middle',
      transform: 'rotate(90 323 320)' });
    ct.textContent = 'Camino público';
    g.appendChild(ct);

    svg.appendChild(g);

    /* rosa de los vientos */
    var norte = svgEl('g', { 'class': 'norte', transform: 'translate(22 604)' });
    norte.appendChild(svgEl('line', { x1: 0, y1: 26, x2: 0, y2: 4 }));
    norte.appendChild(svgEl('path', { d: 'M0 0 L5 11 L0 8 L-5 11 Z' }));
    var nt = svgEl('text', { x: 0, y: 38, 'text-anchor': 'middle' });
    nt.textContent = 'N';
    norte.appendChild(nt);
    svg.appendChild(norte);

    /* interacción */
    $$('.lote-fig', svg).forEach(function (fig) {
      function abrir() { seleccionar(parseInt(fig.dataset.lote, 10), true); }
      fig.addEventListener('click', abrir);
      fig.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
      });
    });
  }

  /* ── 3. fichas del catálogo ───────────────────────────── */
  function pintarFichas() {
    var cont = $('#rejilla');
    if (!cont) return;
    cont.innerHTML = '';

    L.lotes.forEach(function (lote) {
      var vendido = lote.estado === 'vendido';
      var art = document.createElement('article');
      art.className = 'ficha';
      art.id = 'lote-' + lote.n;
      art.dataset.estado = lote.estado;
      art.dataset.lote = lote.n;

      var fila = lote.n % 2 === 0 ? 'Fila interior' : 'Fila hacia el camino';
      var cta = vendido
        ? '<button class="btn btn-linea" type="button" data-espera="' + lote.n + '">Avisarme si se libera</button>'
        : '<a class="btn btn-wa" target="_blank" rel="noopener" href="' + waLink(
            'Hola ' + L.vendedor.split(' ')[0] + ', me interesa el Lote ' + lote.n +
            ' de Parcelas Santa Rita en Quinchamalí. ¿Sigue disponible?'
          ) + '">Consultar el Lote ' + lote.n + '</a>';

      art.innerHTML =
        '<div class="ficha-cab">' +
          '<div class="ficha-n"><span class="rotulo">Lote</span><b class="num">' + lote.n + '</b></div>' +
          '<span class="pastilla" data-estado="' + lote.estado + '">' + ETIQUETA[lote.estado] + '</span>' +
        '</div>' +
        '<dl class="ficha-datos">' +
          '<div><dt>Superficie</dt><dd class="num">' + superficieTxt() + '</dd></div>' +
          '<div><dt>Precio</dt><dd class="num' + (vendido ? ' pendiente' : '') + '">' +
            (vendido ? 'Vendido' : precioTxt() + '<span class="pesos">' + precioSecundario() + '</span>') +
          '</dd></div>' +
          '<div><dt>Ubicación</dt><dd>' + fila + '</dd></div>' +
        '</dl>' +
        '<div class="ficha-pie">' + cta + '</div>';

      cont.appendChild(art);
    });

    $$('[data-espera]').forEach(function (b) {
      b.addEventListener('click', function () {
        var n = b.dataset.espera;
        var sel = $('#f-lote');
        if (sel) {
          var valor = 'Lista de espera — Lote ' + n;
          if (!sel.querySelector('option[value="' + valor + '"]')) {
            var o = document.createElement('option');
            o.value = valor;
            o.textContent = 'Lote ' + n + ' — lista de espera';
            sel.appendChild(o);
          }
          sel.value = valor;
        }
        location.hash = '#contacto';
        var nom = $('#f-nombre');
        if (nom) setTimeout(function () { nom.focus(); }, 400);
      });
    });
  }

  /* ── 4. filtros y moneda ──────────────────────────────── */
  function aplicarFiltro() {
    var visibles = 0;
    $$('.ficha').forEach(function (f) {
      var ok = filtro === 'todos' || f.dataset.estado === filtro;
      f.classList.toggle('oculta', !ok);
      if (ok) visibles++;
    });
    $$('.filtro').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.filtro === filtro));
    });
    var vacio = $('#vacio');
    if (vacio) vacio.hidden = visibles > 0;
  }

  function pintarFiltros() {
    $$('.filtro').forEach(function (b) {
      var est = b.dataset.filtro;
      var c = b.querySelector('.cuenta');
      if (c) c.textContent = est === 'todos' ? L.lotes.length : cuenta(est);
      b.addEventListener('click', function () { filtro = est; seleccion = null; aplicarFiltro(); });
    });
    $$('.conmutador button').forEach(function (b) {
      b.addEventListener('click', function () {
        moneda = b.dataset.moneda;
        $$('.conmutador button').forEach(function (o) {
          o.setAttribute('aria-pressed', String(o.dataset.moneda === moneda));
        });
        pintarFichas();
        aplicarFiltro();
        if (seleccion) marcarSeleccion(seleccion);
      });
    });
  }

  /* ── 5. selección desde el plano ──────────────────────── */
  function marcarSeleccion(n) {
    $$('.ficha').forEach(function (f) { f.classList.toggle('destacada', +f.dataset.lote === n); });
    $$('.lote-fig').forEach(function (f) { f.classList.toggle('activo', +f.dataset.lote === n); });
  }

  function seleccionar(n, desplazar) {
    seleccion = n;
    var lote = L.lotes.filter(function (l) { return l.n === n; })[0];
    if (lote && filtro !== 'todos' && lote.estado !== filtro) { filtro = 'todos'; }
    aplicarFiltro();
    marcarSeleccion(n);
    if (desplazar) {
      var ficha = $('#lote-' + n);
      if (ficha) ficha.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /* ── 6. lupa del plano original ───────────────────────── */
  function pintarLupa() {
    var img = $('#plano-original');
    var lupa = $('#lupa');
    if (!img || !lupa) return;
    var grande = $('#lupa-img');
    function abrir() { grande.src = img.src; lupa.setAttribute('open', ''); $('#lupa-cerrar').focus(); }
    function cerrar() { lupa.removeAttribute('open'); img.focus(); }
    img.addEventListener('click', abrir);
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
    });
    $('#lupa-cerrar').addEventListener('click', cerrar);
    lupa.addEventListener('click', function (e) { if (e.target === lupa) cerrar(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lupa.hasAttribute('open')) cerrar();
    });
  }

  /* ── 7. formulario → WhatsApp / correo ────────────────── */
  function pintarFormulario() {
    var form = $('#form-contacto');
    if (!form) return;
    var exito = $('#form-exito');
    var sel = $('#f-lote');

    /* poblar el selector de lotes disponibles */
    if (sel) {
      L.lotes.filter(function (l) { return l.estado !== 'vendido'; }).forEach(function (l) {
        var o = document.createElement('option');
        o.value = 'Lote ' + l.n;
        o.textContent = 'Lote ' + l.n + ' — ' + ETIQUETA[l.estado];
        sel.appendChild(o);
      });
    }

    var reglas = {
      nombre: function (v) { return v.trim().length > 1; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
      telefono: function (v) { return v.replace(/[^0-9]/g, '').length >= 8; }
    };

    function campoDe(input) { return input.closest('.campo'); }
    function validar(input) {
      var ok = reglas[input.name] ? reglas[input.name](input.value) : true;
      campoDe(input).classList.toggle('malo', !ok);
      return ok;
    }

    Object.keys(reglas).forEach(function (name) {
      var input = form.elements[name];
      if (!input) return;
      input.addEventListener('blur', function () { validar(input); });
      input.addEventListener('input', function () {
        if (campoDe(input).classList.contains('malo')) validar(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombres = Object.keys(reglas);
      var res = nombres.map(function (n) { return validar(form.elements[n]); });
      if (!res.every(Boolean)) {
        form.elements[nombres[res.indexOf(false)]].focus();
        return;
      }

      var d = {
        nombre: form.elements.nombre.value.trim(),
        email: form.elements.email.value.trim(),
        telefono: form.elements.telefono.value.trim(),
        lote: form.elements.lote ? form.elements.lote.value : '',
        mensaje: form.elements.mensaje ? form.elements.mensaje.value.trim() : ''
      };

      var texto =
        'Hola ' + L.vendedor.split(' ')[0] + ', soy ' + d.nombre + '.\n' +
        (d.lote ? 'Me interesa: ' + d.lote + '.\n' : 'Me interesan las parcelas de Quinchamalí.\n') +
        'Correo: ' + d.email + '\n' +
        'Teléfono: ' + d.telefono +
        (d.mensaje ? '\n\n' + d.mensaje : '');

      var wa = waLink(texto);
      var mail = 'mailto:?subject=' + encodeURIComponent('Consulta — ' + L.nombre) +
                 '&body=' + encodeURIComponent(texto);

      $('#exito-wa').href = wa;
      $('#exito-mail').href = mail;
      exito.hidden = false;
      exito.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.open(wa, '_blank', 'noopener');
    });
  }

  /* ── arranque ─────────────────────────────────────────── */
  function iniciar() {
    pintarCifras();
    pintarPlano();
    pintarFichas();
    pintarFiltros();
    aplicarFiltro();
    pintarLupa();
    pintarFormulario();

    /* enlaces de WhatsApp genéricos */
    $$('[data-wa]').forEach(function (a) {
      a.href = waLink('Hola ' + L.vendedor.split(' ')[0] +
        ', vi el sitio de Parcelas Santa Rita y quiero la ficha del loteo en Quinchamalí.');
    });
    $$('[data-tel]').forEach(function (a) {
      a.href = 'tel:+' + L.telefonoE164;
      if (!a.textContent.trim()) a.textContent = L.telefono;
    });
    $$('[data-maps]').forEach(function (a) { a.href = L.mapsUrl; });
    $$('[data-anio]').forEach(function (n) { n.textContent = '2026'; });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
