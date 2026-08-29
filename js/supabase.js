/* ---------------------------------------------------------------------------
 * Cliente mínimo de Supabase sobre PostgREST.
 *
 * El sitio solo necesita leer `lotes` e insertar en `leads`, así que usamos
 * fetch directo en vez de supabase-js: son ~40 KB menos y una dependencia
 * externa menos que puede caerse. Si más adelante se agrega Auth o Realtime,
 * conviene cambiar a supabase-js.
 * ------------------------------------------------------------------------ */
window.SB = (function () {
  'use strict';

  var cfg = window.SUPABASE_CONFIG || {};
  var base = String(cfg.url || '').replace(/\/+$/, '');
  var key = String(cfg.anonKey || '');

  // Detecta los placeholders del repo para no disparar requests condenadas.
  var configured = Boolean(base && key) &&
    base.indexOf('TU-PROYECTO') === -1 &&
    key.indexOf('TU_ANON_KEY') === -1 &&
    key.indexOf('TU_PUBLISHABLE_KEY') === -1;

  function headers(extra) {
    var h = {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
    };
    for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) h[k] = extra[k];
    return h;
  }

  // AbortSignal.timeout no existe en Safari < 16, que todavía pesa en Chile.
  function timeoutSignal(ms) {
    if (typeof AbortController !== 'function') return undefined;
    var ac = new AbortController();
    setTimeout(function () { ac.abort(); }, ms);
    return ac.signal;
  }

  function request(method, path, body, extraHeaders, timeoutMs) {
    if (!configured) return Promise.reject(new Error('Supabase sin configurar'));
    return fetch(base + '/rest/v1/' + path, {
      method: method,
      headers: headers(extraHeaders),
      body: body ? JSON.stringify(body) : undefined,
      signal: timeoutSignal(timeoutMs || 8000),
    }).then(function (res) {
      // Un INSERT con Prefer: return=minimal responde 201 con cuerpo vacío,
      // y res.json() sobre un cuerpo vacío lanza excepción. Leemos texto
      // primero y solo parseamos si hay algo que parsear.
      if (res.ok) {
        if (res.status === 204) return null;
        return res.text().then(function (text) {
          if (!text) return null;
          try { return JSON.parse(text); } catch (e) { return null; }
        });
      }
      return res.text().then(function (text) {
        var msg = text;
        try { msg = (JSON.parse(text).message) || text; } catch (e) { /* texto plano */ }
        var err = new Error(msg || ('HTTP ' + res.status));
        err.status = res.status;
        throw err;
      });
    });
  }

  return {
    isConfigured: configured,
    select: function (table, query, timeoutMs) {
      return request('GET', table + (query ? '?' + query : ''), null, null, timeoutMs);
    },
    insert: function (table, row) {
      return request('POST', table, row, { Prefer: 'return=minimal' });
    },
  };
})();
