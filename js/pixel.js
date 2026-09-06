/* ═══════════════════════════════════════════════════════════
   Eventos de conversión para el pixel de Meta.

   El PageView lo dispara el snippet del <head>. Acá va lo que
   de verdad sirve para optimizar campañas: el contacto, que en
   este sitio es un clic a WhatsApp o al teléfono — no hay
   servidor ni carrito, así que esa es la conversión.

   Si el pixel está bloqueado (adblock, sin JS de Meta), estas
   llamadas no hacen nada y el sitio sigue igual.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function track(evento, datos) {
    if (typeof window.fbq !== 'function') return;
    try { window.fbq('track', evento, datos || {}); } catch (e) {}
  }

  function masCercano(nodo, sel) {
    for (; nodo && nodo !== document; nodo = nodo.parentNode) {
      if (nodo.nodeType === 1 && nodo.matches && nodo.matches(sel)) return nodo;
    }
    return null;
  }

  /* Contacto directo. En captura, para que alcance a dispararse
     aunque el enlace navegue de inmediato. El SVG dentro del botón
     hace que el target sea un <path>, de ahí el ascenso manual. */
  document.addEventListener('click', function (e) {
    var a = masCercano(e.target, '[data-wa], [data-tel]');
    if (!a) return;
    track('Lead', {
      content_name: a.hasAttribute('data-wa') ? 'WhatsApp' : 'Teléfono',
      content_category: 'Contacto directo'
    });
  }, true);

  /* Lo llama main.js cuando el formulario pasó la validación
     y abrió WhatsApp con la consulta escrita. */
  window.srLead = function (d) {
    track('Lead', {
      content_name: 'Formulario',
      content_category: (d && d.lote) ? d.lote : 'Sin lote definido'
    });
  };
}());
