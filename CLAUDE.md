# Mis Finanzas

App personal de finanzas de Valen: gastos, ingresos, deudas y metas. Publicada en https://vmmterminus-star.github.io/finanzas/

## Cómo está hecha
- Todo vive en un solo `index.html` (HTML + CSS + JS juntos). No hay que instalar ni compilar nada.
- Fuente: Montserrat (Google Fonts). Color de tema: `#FDF7F0`.
- Ícono, favicon y manifest van embebidos en base64 dentro del `<head>`.

## Datos (¡cuidado!)
- Se guardan en `localStorage` con la clave `finz_v1`. Otras claves: `finz_synccode`, `finz_remote_ts`.
- Se sincronizan con Supabase (`ipfioanmaxqgyoxdoyhe.supabase.co`, tabla `finanzas_sync`) usando un "código de sincronización".
- Hay exportar/importar respaldo en `.json`.
- Nunca cambies nombres de claves ni la forma de los datos sin migrar lo que ya existe: ahí están sus datos reales.

## Cómo trabajar con Valen
- Valen no programa. Explícale todo en español sencillo, sin tecnicismos.
- Antes de subir cualquier cambio: abre la app en el navegador integrado, prueba el cambio (también en tamaño celular) y revisa la consola.
- Enséñale el resultado. Haz commit y push a `main` solo cuando ella diga que sí. En ~1 minuto queda en línea.
- El repo es público: nada de contraseñas ni datos personales aquí.
