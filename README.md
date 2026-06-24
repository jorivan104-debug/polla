# Polla Mundialista — Selección Colombia

Aplicación web para pollas de marcador exacto en partidos de la Selección Colombia. Marcador en vivo, probabilidad de mantener el resultado, pozo total, lista de apuestas y celebración de ganadores cuando finaliza el partido.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + Framer Motion + Lucide React
- Prisma + SQLite
- API-Football v3 (plan gratuito) para datos en vivo
- Server-Sent Events para refresco en tiempo real

## Inicio rápido

```bash
npm install
cp .env.example .env
# Edita .env y configura ADMIN_PASSWORD, API_FOOTBALL_KEY y ADMIN_SESSION_SECRET
npx prisma db push
npm run dev
```

Abre `http://localhost:3000`.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Cadena de conexión SQLite (`file:./dev.db` por defecto) |
| `API_FOOTBALL_KEY` | API key de [dashboard.api-football.com](https://dashboard.api-football.com/register) (plan free, 100 req/día) |
| `ADMIN_PASSWORD` | Contraseña del panel admin |
| `ADMIN_SESSION_SECRET` | Cadena aleatoria larga para firmar la cookie de sesión |
| `CRON_SECRET` | (Opcional) protege el endpoint cron en producción |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app, usada al compartir |

Genera un secreto de sesión seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Flujo de uso

1. **Admin** entra a `/admin/login` con la contraseña.
2. Crea una nueva polla seleccionando el próximo partido de Colombia desde la lista de fixtures de API-Football.
3. Registra apuestas con nombre del participante, marcador y monto.
4. Bloquea las apuestas (estado `LOCKED`) y comparte el link público `/p/{slug}`.
5. Durante el partido, el cron sincroniza marcador, posesión y probabilidades cada ~2 minutos.
6. La vista pública se actualiza vía SSE cada 5 segundos.
7. Al finalizar el partido, el sistema muestra una celebración con los ganadores y el premio dividido entre quienes acertaron el marcador exacto.

## Reglas de premio

- Solo gana quien acierta el **marcador exacto**.
- Pozo total = suma de los `amount` de todas las apuestas.
- Si dos o más personas aciertan, el pozo se divide en partes iguales.
- Si nadie acierta, se muestra "Sin ganadores" y el pozo queda visible.

## Estructura

```
src/
├── app/
│   ├── admin/             # panel admin (login, listado, gestión de polla)
│   ├── p/[slug]/          # vista pública con PollaComposer
│   └── api/               # rutas backend (auth, pollas, bets, sync, stream, cron)
├── components/
│   ├── PollaComposer.tsx  # ★ único compositor de la vista pública
│   ├── ui/                # primitivos (Button, Card, Badge, Modal, ProgressBar)
│   ├── brand/Logo.tsx     # logo de marca
│   └── admin/             # formularios y paneles del admin
├── hooks/
│   └── usePollaLive.ts    # cliente SSE para datos en vivo
└── lib/
    ├── api-football.ts    # cliente API-Football
    ├── sync.ts            # job de sincronización en vivo
    ├── probability.ts     # heurística "mantener resultado"
    ├── winners.ts         # cálculo de ganadores y división de premio
    ├── auth.ts            # sesión admin firmada (HMAC)
    └── db.ts              # cliente Prisma
```

## Deploy en Vercel

1. Crea el proyecto en Vercel apuntando al repo.
2. Agrega las variables de entorno (incluyendo `CRON_SECRET`).
3. Cambia `DATABASE_URL` a un servicio Postgres (Neon, Supabase, etc.) y ajusta `provider = "postgresql"` en `prisma/schema.prisma`. SQLite no es válido en Vercel por su filesystem efímero.
4. El archivo [`vercel.json`](vercel.json) ya configura un cron cada 2 minutos sobre `/api/cron/sync`.
5. Despliega. La vista pública vive en `/p/{slug}` y el admin en `/admin`.

## Optimización de cuota API-Football

- El plan free permite **100 requests/día**.
- El sync solo corre cuando hay pollas con estado `LOCKED`/`LIVE` y el partido está dentro de la ventana ±2 horas.
- Cada partido consume ~30-50 requests en total. Con 1-2 partidos al mes, el plan free es suficiente.
- Todos los clientes leen del cache local (BD + SSE), nunca llaman directamente a API-Football.

## Assets de marca

- `public/Fondo.jpeg` — fondo fijo de toda la app.
- `public/logo.png` — logo en header, login y favicon.

## Limitaciones conocidas

- API-Football no provee posesión en absolutamente todos los partidos; cuando falta se omite la barra de posesión.
- La heurística de "mantener resultado" es una aproximación basada en minuto, diferencia de goles y posesión, no un modelo predictivo entrenado.
- El sistema no maneja prórroga ni penales en la animación de ganador (usa el resultado final de los 90 minutos según `goals.home`/`goals.away`).
