/* ---------------------------------------------------------------------------
 * Renderiza los lotes desde Supabase.
 *
 * Estrategia: mejora progresiva. El HTML estático de index.html ya trae un
 * estado válido y es lo que ve el visitante mientras carga (y lo que sigue
 * viendo si Supabase está caído o sin configurar). Solo si la consulta
 * responde bien reemplazamos el contenido. Nunca dejamos la sección vacía.
 * ------------------------------------------------------------------------ */
(function () {
  'use strict';

  var ETIQUETA = { disponible: 'Disponible', reservado: 'Reservado', vendido: 'Vendido' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function num(n) {
    return Number(n).toLocaleString('es-CL', { maximumFractionDigits: 0 });
  }

  function uf(n) {
    var v = Number(n);
    return 'UF ' + v.toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: v % 1 === 0 ? 0 : 2,
    });
  }

  function fecha(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return null;
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // "6, 13, 15, 17 y 18"
  function listaEs(nums) {
    if (!nums.length) return '';
    if (nums.length === 1) return String(nums[0]);
    return nums.slice(0, -1).join(', ') + ' y ' + nums[nums.length - 1];
  }

  function set(sel, text) {
    var el = document.querySelector(sel);
    if (el && text != null) el.textContent = text;
  }

  // --- barras del plano esquemático ------------------------------------
  function renderColumnas(lotes) {
    ['izquierda', 'derecha'].forEach(function (col) {
      var host = document.querySelector('[data-col="' + col + '"]');
      if (!host) return;
      host.innerHTML = lotes
        .filter(function (l) { return l.columna === col; })
        .map(function (l) {
          return '<div class="lot-bar" data-estado="' + esc(l.estado) + '" style="height:' + Number(l.altura_px) + 'px">' +
                 '<span class="lot-bar-n">Lote ' + Number(l.numero) + '</span>' +
                 '<span class="lot-bar-tag">' + esc(ETIQUETA[l.estado] || l.estado) + '</span>' +
                 '</div>';
        }).join('');
    });
  }

  // --- chips "Estado por lote" -------------------------------------------
  function renderChips(lotes) {
    var host = document.querySelector('[data-chips]');
    if (!host) return;
    host.innerHTML = lotes.map(function (l) {
      return '<div class="lot-chip" data-estado="' + esc(l.estado) + '">' +
             '<span class="lot-chip-n">' + Number(l.numero) + '</span>' +
             '<span class="lot-chip-tag">' + esc(ETIQUETA[l.estado] || l.estado) + '</span>' +
             '</div>';
    }).join('');
  }

  // --- tarjetas de lotes destacados --------------------------------------
  function renderTarjetas(lotes) {
    var host = document.querySelector('[data-parcel-grid]');
    if (!host) return;

    var destacados = lotes.filter(function (l) { return l.destacado && l.estado !== 'vendido'; });
    if (!destacados.length) return; // conserva el HTML estático

    host.innerHTML = destacados.map(function (l) {
      var esperando = l.estado === 'reservado';
      var filas = [];
      if (l.superficie_m2) filas.push(['Superficie', num(l.superficie_m2) + ' m²']);
      if (l.precio_uf) filas.push(['Precio', uf(l.precio_uf)]);
      if (l.frente) filas.push(['Frente', l.frente]);

      return '<article class="parcel-card">' +
        '<div class="parcel-status status-' + (esperando ? 'reserved' : 'available') + '">' +
          esc(ETIQUETA[l.estado] || l.estado) + '</div>' +
        '<h3>Lote ' + Number(l.numero) + '</h3>' +
        '<dl>' + filas.map(function (f) {
          return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>';
        }).join('') + '</dl>' +
        '<a href="#contacto" class="btn btn-outline" data-lote="' + Number(l.numero) + '">' +
          (esperando ? 'Lista de espera' : 'Consultar este lote') + '</a>' +
        '</article>';
    }).join('');
  }

  // --- contadores y textos derivados -------------------------------------
  function renderResumen(lotes) {
    var disponibles = lotes.filter(function (l) { return l.estado === 'disponible'; });
    var vendidos = lotes.filter(function (l) { return l.estado === 'vendido'; });
    var destacadosDisp = disponibles.filter(function (l) { return l.destacado; });

    set('[data-count="disponibles"]', disponibles.length);
    set('[data-count="vendidos"]', vendidos.length);
    set('[data-count="total"]', lotes.length);
    set('[data-count="disponibles-texto"]', disponibles.length);
    set('[data-count="adicionales"]', Math.max(disponibles.length - destacadosDisp.length, 0));

    var notaVendidos = document.querySelector('[data-nota-vendidos]');
    if (notaVendidos) {
      var nums = vendidos.map(function (l) { return l.numero; });
      notaVendidos.textContent = nums.length
        ? 'Lotes ' + listaEs(nums) + ' ya se encuentran vendidos. El resto continúa disponible para reserva.'
        : 'Todos los lotes continúan disponibles para reserva.';
    }

    var ultima = lotes.reduce(function (max, l) {
      return (!max || l.actualizado_at > max) ? l.actualizado_at : max;
    }, null);
    var f = ultima && fecha(ultima);
    if (f) set('[data-actualizado]', f);
  }

  function init(lotes) {
    if (!Array.isArray(lotes) || !lotes.length) return;
    lotes.sort(function (a, b) { return a.numero - b.numero; });
    renderColumnas(lotes);
    renderChips(lotes);
    renderTarjetas(lotes);
    renderResumen(lotes);
    document.documentElement.setAttribute('data-lotes-source', 'supabase');
  }

  if (!window.SB || !window.SB.isConfigured) return;

  window.SB.select('lotes', 'select=*&order=numero.asc')
    .then(init)
    .catch(function (err) {
      // Silencio deliberado: el HTML estático ya muestra un estado válido.
      if (window.console) console.warn('[lotes] usando estado estático:', err.message);
    });
})();
