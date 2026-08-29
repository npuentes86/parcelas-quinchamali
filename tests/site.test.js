const { chromium } = require('playwright');

const SB = 'https://qlcdgfgcxhmvchpqnmwg.supabase.co';
const BASE = 'http://127.0.0.1:8777';
let fails = 0;
const ok  = (n) => console.log('  ✓', n);
const bad = (n, d) => { fails++; console.log('  ✗', n, '\n      ->', d); };
function eq(name, got, want) { String(got) === String(want) ? ok(name) : bad(name, `esperaba ${want}, obtuve ${got}`); }

// 17 lotes, pero con el Lote 3 vendido -> 11 disponibles / 6 vendidos
const lotesMock = [];
const vendidos = [3, 6, 13, 15, 17, 18];
const meta = { 3:[5200,950,'Camino público',true], 7:[8400,1480,'Camino público + vista cordillera',true],
               9:[12000,2100,'Esquina, dos accesos',true], 12:[20000,3400,'Camino público + orilla de estero',true] };
for (let n = 2; n <= 18; n++) {
  const m = meta[n] || [null, null, null, false];
  lotesMock.push({ numero:n, estado: vendidos.includes(n) ? 'vendido':'disponible',
    columna: n % 2 === 0 ? 'izquierda':'derecha', altura_px:64,
    superficie_m2:m[0], precio_uf:m[1], frente:m[2], destacado:m[3],
    actualizado_at:'2026-08-29T12:00:00Z' });
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  async function open({ lotes, leadStatus }) {
    const page = await browser.newPage();
    const errors = [], posts = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route(SB + '/rest/v1/**', async (route) => {
      const req = route.request();
      if (req.method() === 'GET') {
        if (lotes === 'fail') return route.abort('failed');
        return route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(lotes) });
      }
      posts.push(JSON.parse(req.postData()));
      if (leadStatus === 201) return route.fulfill({ status:201, body:'' });
      return route.fulfill({ status:400, contentType:'application/json',
        body: JSON.stringify({ message:'violates check constraint' }) });
    });
    await page.goto(BASE + '/index.html', { waitUntil:'networkidle' });
    return { page, errors, posts };
  }

  // ---- A. Supabase caído -> el HTML estático se mantiene -------------------
  console.log('\nA. Supabase inalcanzable (fallback estático)');
  {
    const { page, errors } = await open({ lotes:'fail' });
    eq('contador disponibles sigue en 12', await page.textContent('[data-count="disponibles"]'), '12');
    eq('contador vendidos sigue en 5',     await page.textContent('[data-count="vendidos"]'), '5');
    eq('los 17 chips siguen presentes',    await page.locator('.lot-chip').count(), 17);
    eq('sin errores de JS', errors.length, 0);
    await page.close();
  }

  // ---- B. Supabase responde -> re-render ----------------------------------
  console.log('\nB. Supabase responde (Lote 3 marcado vendido)');
  {
    const { page, errors } = await open({ lotes: lotesMock });
    eq('disponibles recalculado a 11', await page.textContent('[data-count="disponibles"]'), '11');
    eq('vendidos recalculado a 6',     await page.textContent('[data-count="vendidos"]'), '6');
    eq('total 17',                     await page.textContent('[data-count="total"]'), '17');
    eq('texto de la descripción',      await page.textContent('[data-count="disponibles-texto"]'), '11');
    eq('adicionales = 11 - 3 destacados disponibles', await page.textContent('[data-count="adicionales"]'), '8');
    eq('nota de vendidos', (await page.textContent('[data-nota-vendidos]')).trim(),
       'Lotes 3, 6, 13, 15, 17 y 18 ya se encuentran vendidos. El resto continúa disponible para reserva.');
    eq('chips = 17', await page.locator('.lot-chip').count(), 17);
    eq('chip 3 ahora vendido',
       await page.locator('.lot-chip', { hasText:/^3/ }).first().getAttribute('data-estado'), 'vendido');
    eq('barras del plano = 17', await page.locator('.lot-bar').count(), 17);
    eq('Lote 3 fuera de las tarjetas (vendido)', await page.locator('.parcel-card').count(), 3);
    eq('precio formateado es-CL', await page.locator('.parcel-card').first().textContent()
       .then(t => /UF 1\.480/.test(t)), 'true');
    eq('superficie formateada',  await page.locator('.parcel-card').first().textContent()
       .then(t => /8\.400 m²/.test(t)), 'true');
    eq('fecha actualizada', await page.textContent('[data-actualizado]'), '29 de agosto de 2026');
    eq('sin errores de JS', errors.length, 0);
    await page.close();
  }

  // ---- C. Envío correcto del formulario -----------------------------------
  console.log('\nC. Formulario — envío correcto');
  {
    const { page, errors, posts } = await open({ lotes: lotesMock, leadStatus:201 });
    await page.locator('.parcel-card a[data-lote]').first().click();  // Lote 7
    await page.fill('#f-name', 'Horacio Puentes');
    await page.fill('#f-email', 'horacio@ejemplo.cl');
    await page.fill('#f-phone', '+56 9 1234 5678');
    await page.click('#lead-form button[type=submit]');
    await page.waitForSelector('#lead-success:not([hidden])', { timeout:5000 }).then(
      () => ok('mensaje de éxito visible'), () => bad('mensaje de éxito visible','timeout'));
    eq('se envió 1 lead', posts.length, 1);
    const p = posts[0] || {};
    eq('nombre', p.nombre, 'Horacio Puentes');
    eq('email', p.email, 'horacio@ejemplo.cl');
    eq('telefono', p.telefono, '+56 9 1234 5678');
    eq('whatsapp=true', p.whatsapp, 'true');
    eq('lote_interes capturado', p.lote_interes, 'Lote 7');
    eq('estado=nuevo', p.estado, 'nuevo');
    eq('sin errores de JS', errors.length, 0);
    await page.close();
  }

  // ---- D. Error del backend -> no mentir al visitante ---------------------
  console.log('\nD. Formulario — el backend rechaza');
  {
    const { page } = await open({ lotes: lotesMock, leadStatus:400 });
    await page.fill('#f-name', 'Ana Vergara');
    await page.fill('#f-email', 'ana@ejemplo.cl');
    await page.fill('#f-phone', '+56 9 8765 4321');
    await page.click('#lead-form button[type=submit]');
    await page.waitForSelector('#lead-error:not([hidden])', { timeout:5000 }).then(
      () => ok('mensaje de error visible'), () => bad('mensaje de error visible','timeout'));
    eq('NO se muestra éxito falso', await page.locator('#lead-success').isHidden(), 'true');
    eq('el botón vuelve a habilitarse', await page.isEnabled('#lead-form button[type=submit]'), 'true');
    await page.close();
  }

  // ---- E. Validación y honeypot -------------------------------------------
  console.log('\nE. Validación y honeypot');
  {
    const { page, posts } = await open({ lotes: lotesMock, leadStatus:201 });
    await page.fill('#f-name', 'A');
    await page.fill('#f-email', 'no-es-un-correo');
    await page.fill('#f-phone', '123');
    await page.click('#lead-form button[type=submit]');
    await page.waitForTimeout(300);
    eq('no se envía nada con datos inválidos', posts.length, 0);
    eq('3 campos marcados en rojo', await page.locator('.field.invalid').count(), 3);
    // isVisible() de Playwright cuenta como visible un elemento fuera de
    // pantalla, así que verificamos la posición real.
    const hpBox = await page.locator('#f-website').boundingBox();
    eq('honeypot fuera de pantalla', hpBox && hpBox.x < -1000, 'true');
    eq('honeypot no es alcanzable con Tab', await page.getAttribute('#f-website', 'tabindex'), '-1');

    await page.fill('#f-name', 'Bot Spam');
    await page.fill('#f-email', 'bot@spam.cl');
    await page.fill('#f-phone', '+56 9 0000 0000');
    await page.locator('#f-website').fill('http://spam.example');
    await page.click('#lead-form button[type=submit]');
    await page.waitForTimeout(300);
    eq('honeypot bloquea el envío', posts.length, 0);
    await page.close();
  }

  await browser.close();
  console.log(fails ? `\n${fails} FALLO(S)\n` : '\nTodo verde ✓\n');
  process.exit(fails ? 1 : 0);
})();
