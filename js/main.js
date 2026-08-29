/* ---------------------------------------------------------------------------
 * Formulario de contacto -> tabla `leads` en Supabase.
 * ------------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var form = document.getElementById('lead-form');
  if (!form) return;

  var success = document.getElementById('lead-success');
  var error = document.getElementById('lead-error');
  var submitBtn = form.querySelector('button[type="submit"]');
  var loteInput = form.elements.lote_interes;

  var validators = {
    name: function (v) { return v.trim().length > 1; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
    phone: function (v) { return v.replace(/[^0-9]/g, '').length >= 8; },
  };
  var CAMPOS = ['name', 'email', 'phone'];

  function fieldOf(input) { return input.closest('.field'); }

  function validateInput(input) {
    var ok = validators[input.name] ? validators[input.name](input.value) : true;
    fieldOf(input).classList.toggle('invalid', !ok);
    return ok;
  }

  CAMPOS.forEach(function (name) {
    var input = form.elements[name];
    input.addEventListener('blur', function () { validateInput(input); });
    input.addEventListener('input', function () {
      if (fieldOf(input).classList.contains('invalid')) validateInput(input);
    });
  });

  // "Consultar este lote" -> recuerda de qué lote venía la consulta.
  // Delegado en document: las tarjetas se re-renderizan desde Supabase.
  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-lote]');
    if (!link || !loteInput) return;
    loteInput.value = 'Lote ' + link.getAttribute('data-lote');
    var asunto = document.querySelector('[data-lote-asunto]');
    if (asunto) {
      asunto.textContent = 'Consulta por el Lote ' + link.getAttribute('data-lote');
      asunto.hidden = false;
    }
  });

  function origen() {
    try {
      var utm = new URLSearchParams(location.search).get('utm_source');
      if (utm) return utm.slice(0, 200);
      if (document.referrer && document.referrer.indexOf(location.origin) !== 0) {
        return document.referrer.slice(0, 200);
      }
    } catch (e) { /* URLSearchParams puede faltar en navegadores viejos */ }
    return 'sitio';
  }

  function mostrarError(msg) {
    if (!error) return;
    error.textContent = msg;
    error.hidden = false;
  }

  function bloquear(on) {
    form.querySelectorAll('input, button').forEach(function (el) { el.disabled = on; });
    if (submitBtn) submitBtn.textContent = on ? 'Enviando…' : 'Quiero la ficha del loteo';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (error) error.hidden = true;

    var results = CAMPOS.map(function (n) { return validateInput(form.elements[n]); });
    if (!results.every(Boolean)) {
      var primero = CAMPOS.find(function (n, i) { return !results[i]; });
      form.elements[primero].focus();
      return;
    }

    // Honeypot: un bot rellena todo, una persona no ve este campo.
    // Fingimos éxito para no darle señal al bot de que fue detectado.
    if (form.elements.website && form.elements.website.value) {
      bloquear(true);
      if (success) success.hidden = false;
      return;
    }

    if (!window.SB || !window.SB.isConfigured) {
      mostrarError('El formulario aún no está conectado. Escríbenos por WhatsApp al +1 908 400 8492 y te respondemos hoy mismo.');
      return;
    }

    bloquear(true);

    window.SB.insert('leads', {
      nombre: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      telefono: form.elements.phone.value.trim(),
      whatsapp: form.elements.whatsapp.value === 'si',
      lote_interes: loteInput && loteInput.value ? loteInput.value : null,
      origen: origen(),
      estado: 'nuevo',
    }).then(function () {
      if (success) success.hidden = false;
      form.querySelector('.lead-fineprint').hidden = true;
    }).catch(function (err) {
      bloquear(false);
      if (window.console) console.error('[lead]', err);
      mostrarError('No pudimos enviar tu consulta. Intenta de nuevo o escríbenos por WhatsApp al +1 908 400 8492.');
    });
  });
});
