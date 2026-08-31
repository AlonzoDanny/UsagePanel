# UsagePanel

Monorepo de UsagePanel, un panel para monitorear el consumo de minutos telefónicos de clientes.

```text
UsagePanel/
├── frontend/             React, TypeScript, Vite y Tailwind
├── backend/              Fastify, Prisma, PostgreSQL y autenticación
├── docker-compose.yml    PostgreSQL local
└── package.json          Workspaces y comandos del monorepo
```

## Arquitectura

```text
frontend (http://localhost:5173)
        |
        | cookies HttpOnly + solicitudes a /api
        v
backend (http://localhost:3000/api)
        |
        v
PostgreSQL (Docker)
```

El frontend contiene únicamente la interfaz y el consumo HTTP. Las contraseñas, roles, sesiones, autorización, Prisma y futuras integraciones n8n/telefonía pertenecen exclusivamente al backend.

## Inicio local

1. Instala las dependencias de todos los workspaces:

```bash
npm install
```

2. Crea los archivos de entorno:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

3. En `backend/.env`, reemplaza `COOKIE_SECRET` por un valor aleatorio de al menos 32 caracteres:

```bash
openssl rand -base64 48
```

4. Levanta PostgreSQL y aplica las migraciones:

```bash
npm run docker:up
npm run prisma:generate
npm run prisma:deploy
```

5. Crea el primer administrador de manera local y controlada:

```bash
ADMIN_EMAIL=admin@tu-empresa.com ADMIN_PASSWORD='una-contraseña-larga-y-única' ADMIN_FULL_NAME='Administrador' npm run admin:create
```

6. Inicia ambas aplicaciones:

```bash
npm run dev
```

El frontend estará en `http://localhost:5173` y el backend en `http://localhost:3000`.

## Scripts

```bash
npm run dev           # Frontend y backend
npm run dev:frontend  # Solo Vite
npm run dev:backend   # Solo Fastify
npm run lint          # ESLint en ambos workspaces
npm run build         # Build de frontend y backend
npm run docker:up     # PostgreSQL local
npm run docker:down   # Detiene PostgreSQL
```

## Seguridad

- Sesiones opacas en cookies firmadas `HttpOnly`.
- Contraseñas Argon2id.
- CSRF, CORS con origen explícito, Helmet, rate limiting y bloqueo temporal por intentos fallidos.
- Roles `admin` y `agent` aplicados en el backend.
- No hay secretos en el frontend. `VITE_API_BASE_URL` es una URL pública de la API.

Consulta `backend/README.md` para los endpoints y detalles de seguridad.
