/* ═══════════════════════════════════════════════════════════
   Datos del loteo — única fuente de verdad.
   Los contadores, el plano y las fichas se generan desde aquí:
   editar este archivo actualiza todo el sitio.
   ═══════════════════════════════════════════════════════════ */

window.LOTEO = {
  nombre: 'Parcelas Santa Rita',
  hijuela: 'Hijuela Número Dos',
  comuna: 'Quinchamalí, Comuna de Chillán, Región de Ñuble',

  /* Valor de la UF — actualizar periódicamente.
     Fuente: Banco Central de Chile vía mindicador.cl */
  uf: 40863.23,
  ufFecha: '23 de agosto de 2026',

  /* Condiciones comunes a todas las parcelas */
  precioUF: 620,
  superficieM2: 5000,
  superficieAprox: true,   // true → se muestra "≈ 5.000 m²"

  /* Contacto */
  telefono: '+56 9 2939 8797',
  telefonoE164: '56929398797',
  vendedor: 'Horacio Puentes',
  vendedorRol: 'Propietario — Loteo Santa Rita',
  mapsUrl: 'https://maps.app.goo.gl/z5vMNq7yuHu4amJP6',


  /* Estado por lote. Fila según el plano de subdivisión:
     los lotes pares quedan al interior, los impares hacia el camino. */
  lotes: [
    { n: 2,  estado: 'disponible' },
    { n: 3,  estado: 'disponible' },
    { n: 4,  estado: 'disponible' },
    { n: 5,  estado: 'disponible' },
    { n: 6,  estado: 'vendido'    },
    { n: 7,  estado: 'disponible' },
    { n: 8,  estado: 'disponible' },
    { n: 9,  estado: 'disponible' },
    { n: 10, estado: 'disponible' },
    { n: 11, estado: 'disponible' },
    { n: 12, estado: 'disponible' },
    { n: 13, estado: 'vendido'    },
    { n: 14, estado: 'disponible' },
    { n: 15, estado: 'vendido'    },
    { n: 16, estado: 'disponible' },
    { n: 17, estado: 'vendido'    },
    { n: 18, estado: 'vendido'    }
  ]
};
