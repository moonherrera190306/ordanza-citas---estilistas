# Ordanza · Citas para estilistas y uñas

Sistema para 1–2 profesionales: liga pública de reservas sin traslapes, agenda, caja simple y ticket de 80 mm.

## Rutas
- `/reservar` — liga pública para clientas (sin contraseña).
- `/` — agenda del día (cobrar, WhatsApp, cancelar).
- `/caja` — venta con o sin cita.
- `/ticket/[id]` — ticket imprimible de 80 mm.

El panel pide contraseña con `PANEL_PIN`.

## Regla de no duplicar
`prisma/sin_traslape.sql` crea un `EXCLUDE` con `btree_gist`. Postgres rechaza dos citas encimadas de la misma profesional aunque lleguen al mismo tiempo.

## Instalación
```bash
cp .env.example .env    # pon DATABASE_URL y PANEL_PIN
npm install
npm run db:setup        # tablas + regla + datos de ejemplo
npm run dev
```

Horario, margen entre citas, anticipación y datos del salón están en `lib/config.ts`.
