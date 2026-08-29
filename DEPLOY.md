# Puesta en marcha — parcelasquinchamali.cl

Tres bloques independientes: **Supabase** (backend), **dominio** (NIC Chile + DNS)
y **GitHub Pages** (publicación). Se pueden hacer en paralelo.

---

## 1. Supabase

Proyecto: `qlcdgfgcxhmvchpqnmwg` · https://qlcdgfgcxhmvchpqnmwg.supabase.co

### 1.1 Crear las tablas

Dashboard → **SQL Editor** → *New query* → pegar todo `supabase/schema.sql` → **Run**.

Crea `leads` y `lotes`, activa Row Level Security y carga los 17 lotes con el
estado actual (12 disponibles / 5 vendidos).
Es idempotente: se puede volver a ejecutar sin duplicar ni borrar nada.

### 1.2 Conectar el sitio

Ya está hecho — `js/config.js` tiene la **publishable key** del proyecto:

```js
anonKey: 'sb_publishable_n80lFnGQTYcdBFI5CasFqQ_BdV55Db_',
```

Se obtiene en Dashboard → **Project Settings → API Keys**. Si alguna vez hay que
rotarla, se reemplaza ahí esa línea.

> **Esa llave es pública y va en el repositorio — es correcto.** Viaja al
> navegador de cada visitante; lo que protege los datos son las policies de RLS.
> La que **nunca** debe salir del dashboard es la **secret key** (`sb_secret_…`,
> antes `service_role`), que sí salta RLS y da acceso total.

### 1.3 Qué puede hacer el público

Lo definen las policies del schema:

| Tabla   | anon puede            | anon **no** puede                       |
|---------|-----------------------|-----------------------------------------|
| `leads` | `INSERT` (crear)      | leer, editar ni borrar consultas        |
| `lotes` | `SELECT` (leer)       | crear, editar ni borrar lotes           |

Nadie puede leer los leads desde el sitio, ni cambiar el estado de un lote.

---

## 2. Dominio `.cl`

### 2.1 Registrar

1. https://www.nic.cl → verificar que **parcelasquinchamali.cl** siga libre.
2. Crear cuenta y registrar. No se necesita RUT chileno ni residencia:
   sirve pasaporte. ~$9.990 CLP/año.
3. Pagar. La delegación queda activa poco después del pago.

### 2.2 DNS

NIC Chile pide **servidores de nombre**. Lo más simple y confiable es usar
Cloudflare (gratis) y administrar ahí los registros:

1. Cloudflare → *Add site* → `parcelasquinchamali.cl`.
2. Cloudflare entrega dos nameservers (`x.ns.cloudflare.com`).
3. Cargarlos en NIC Chile como servidores de nombre del dominio.
4. En Cloudflare crear estos registros:

| Tipo  | Nombre | Valor                  |
|-------|--------|------------------------|
| A     | `@`    | `185.199.108.153`      |
| A     | `@`    | `185.199.109.153`      |
| A     | `@`    | `185.199.110.153`      |
| A     | `@`    | `185.199.111.153`      |
| AAAA  | `@`    | `2606:50c0:8000::153`  |
| AAAA  | `@`    | `2606:50c0:8001::153`  |
| AAAA  | `@`    | `2606:50c0:8002::153`  |
| AAAA  | `@`    | `2606:50c0:8003::153`  |
| CNAME | `www`  | `npuentes86.github.io` |

> **Importante:** dejar todos los registros en **DNS only** (nube gris), no
> proxied. Con el proxy de Cloudflare activo, GitHub no logra emitir el
> certificado. Una vez que el candado funcione, se puede activar si se quiere.

---

## 3. GitHub Pages

1. Repo → **Settings → Pages**.
2. *Source*: **Deploy from a branch** → `main` / `(root)`.
3. *Custom domain*: `parcelasquinchamali.cl` → **Save**.
   (El archivo `CNAME` del repo ya lo declara.)
4. Esperar a que verifique el DNS y marcar **Enforce HTTPS**.
   El certificado tarda entre 15 minutos y ~1 hora desde que el DNS resuelve.

El contenido debe estar en `main`: esta rama es `claude/open-session-uax2tk`.

---

## 4. Verificación

Con el sitio arriba, abrir https://parcelasquinchamali.cl y comprobar:

- [ ] Carga con candado (HTTPS válido).
- [ ] En la consola del navegador **no** aparece `[lotes] usando estado estático`.
      Si aparece, el `anonKey` está mal o el SQL no se ejecutó.
- [ ] Marcar un lote como `vendido` en Supabase → *Table Editor* → `lotes`,
      recargar el sitio: los contadores, las barras y los chips deben moverse solos.
- [ ] Enviar el formulario con datos reales → debe aparecer una fila nueva en
      *Table Editor* → `leads`.
- [ ] Enviar el formulario con un correo inválido → debe marcarse en rojo sin enviar.

---

## 5. Uso diario

**Vender un lote:** Supabase → *Table Editor* → `lotes` → cambiar `estado` a
`vendido`. El sitio se actualiza solo — contadores, plano, chips y la frase
"Lotes 6, 13… ya se encuentran vendidos" se recalculan desde la base.

**Ver consultas:** Supabase → *Table Editor* → `leads`, ordenado por
`created_at`. La columna `lote_interes` dice desde qué lote consultaron y
`estado` sirve para el seguimiento (`nuevo` → `contactado` → `visita` → `cerrado`).

**Aviso por correo de cada lead:** no está incluido. Se resuelve con
*Database Webhooks* en Supabase apuntando a un servicio de correo.

---

## 6. Tests

`tests/site.test.js` levanta Chromium, simula las respuestas de Supabase y
verifica el render de lotes, el envío del formulario, el manejo de errores,
la validación y el honeypot.

```sh
npm i --no-save playwright
python3 -m http.server 8777 --bind 127.0.0.1 &
NODE_PATH=$PWD/node_modules node tests/site.test.js
```
