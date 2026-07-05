# The Coffee News ☕📰

Micro-SaaS multi-tenant: el periódico efímero de tu oficina. Cada equipo tiene su
"room" donde los miembros publican noticias de forma anónima (nombre + emoji, sin
cuentas reales). La edición **caduca a los 7 días**: se archiva en la Hemeroteca y
empieza una nueva en blanco.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Turso (libSQL)** vía **Drizzle ORM** — en dev, sin credenciales, usa `file:local.db`
- **Vercel Blob** para imágenes de portada — en dev cae a `public/uploads/`
- **Vercel Cron** para la caducidad semanal (`vercel.json`)
- **Tailwind CSS v4**
- **View Transitions API nativa** (shared element en imagen y titular; sin librerías de animación)
- Auth propia: cookie httpOnly firmada (HMAC) + código secreto legible (`lince-cobre-482`, scrypt)

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # rellena al menos SESSION_SECRET (openssl rand -hex 32)
npm run db:migrate           # crea las tablas (en dev, sobre local.db)
npm run dev
```

Abre http://localhost:3000, funda un periódico y comparte el link de invitación.
Para resetear los datos de desarrollo, borra `local.db` y repite `npm run db:migrate`.

## Variables de entorno

| Variable | Uso | Dev |
| --- | --- | --- |
| `SESSION_SECRET` | Firma HMAC de la cookie de sesión | **obligatoria** |
| `CRON_SECRET` | Protege `/api/cron/rollover` | obligatoria para probar el cron |
| `TURSO_DATABASE_URL` | URL `libsql://…` de Turso | opcional (fallback `file:local.db`) |
| `TURSO_AUTH_TOKEN` | Token de Turso | opcional en dev |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob | opcional (fallback `public/uploads/`) |

## Modelo de datos

`rooms` (slug, invite_code, edition_number, edition_started_at, plan, member_soft_limit)
→ `room_members` (display_name, emoji, role admin/member, secret_code_hash)
→ `articles` (edition_number, section, title, dek, body markdown, cover_image_url, size_hint, archived)
→ `stamps` (breaking/rumor/gracioso/importante, único por miembro+tipo+artículo).

**Todas las queries de contenido filtran por `room_id`**: aislamiento estricto entre
tenants. El campo `plan` y el límite blando de miembros dejan la puerta abierta a
tiers de pago sin migrar el esquema.

## Ciclo de vida de una edición

1. La room nace con la edición Nº1.
2. Vercel Cron llama a diario a `GET /api/cron/rollover` (Bearer `CRON_SECRET`).
3. Toda room cuya edición tenga ≥7 días archiva sus artículos (no se borra nada),
   incrementa `edition_number` y resetea la fecha.
4. Las ediciones cerradas se leen en `/{slug}/archivo` (Hemeroteca, solo lectura).

Prueba manual del cron:

```bash
sqlite3 local.db "UPDATE rooms SET edition_started_at = strftime('%s','now') - 8*24*3600;"
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/rollover
```

## Identidad y sesiones

- Al crear/unirse: nombre visible + emoji → el servidor genera un código secreto
  (se muestra **una sola vez**) y setea cookie httpOnly firmada (~400 días, renovación
  rolling en `src/proxy.ts`).
- Reingreso desde otro dispositivo: `/entrar` con slug + código (normaliza mayúsculas,
  espacios y tildes; rate-limit de 5 intentos/15 min por IP).
- El creador es `admin`: puede borrar cualquier artículo y expulsar miembros desde el
  panel al pie de la portada.

## Despliegue en Vercel

1. Crea la base en Turso (`turso db create coffee-news`) y aplica migraciones:
   `TURSO_DATABASE_URL=libsql://… TURSO_AUTH_TOKEN=… npm run db:migrate`.
2. Crea un store de Vercel Blob y copia el token.
3. Configura las 5 variables de entorno en el proyecto de Vercel.
4. `vercel.json` ya define el cron diario (06:00 UTC); Vercel envía el header
   `Authorization: Bearer $CRON_SECRET` automáticamente.

## Fuera del MVP (a propósito)

Planes de pago (solo existe el campo `plan`), moderación avanzada, notificaciones y
edición colaborativa en tiempo real. El rate-limit es en memoria (por instancia):
si el producto crece, sustituir por Upstash/KV.
