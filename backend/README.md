# usagepanel-api

Backend propio de UsagePanel. Expone autenticación, sesiones seguras y administración de miembros; en el futuro será el único componente que se conecte con n8n y las APIs de telefonía.

## Stack

- Node.js y TypeScript
- Fastify
- PostgreSQL 16 con Docker Compose
- Prisma ORM
- Argon2id para contraseñas

## Seguridad

- Contraseñas con Argon2id y parámetros de memoria resistentes a ataques offline.
- Sesiones opacas, aleatorias y almacenadas únicamente como hashes SHA-256 en PostgreSQL.
- Cookie de sesión firmada, `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
- Token CSRF independiente validado en cada operación autenticada que modifica datos.
- Validación de `Origin`, CORS restringido al frontend configurado, Helmet y límites de tasa.
- Bloqueo temporal después de cinco intentos fallidos.
- Roles aplicados en el backend, nunca confiados al cliente: `ADMIN` y `AGENT`.
- Nunca se entrega un hash de contraseña, token de sesión o secreto en respuestas de la API.

Una SPA no debe guardar tokens de acceso en `localStorage`. Esta API usa cookies `HttpOnly`; el frontend debe enviar solicitudes con `credentials: 'include'` y el token CSRF en el header `X-CSRF-Token`.

## Requisitos

- Node.js 22 o superior
- Docker Desktop

## Inicio local

1. Crea `.env` a partir de `.env.example` y reemplaza `COOKIE_SECRET` por un valor aleatorio de 32 o más caracteres. Por ejemplo: `openssl rand -base64 48`.
2. Inicia PostgreSQL:

```bash
docker compose up -d
```

3. Instala dependencias y genera Prisma:

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
```

4. Inicia la API:

```bash
npm run dev
```

La API queda disponible en `http://localhost:3000`; `GET /health` responde el estado del servicio.

## Primer administrador

No hay registro público. Crea el primer administrador mediante el script administrativo, pasando las credenciales solo como variables de entorno:

```bash
ADMIN_EMAIL=admin@tu-empresa.com ADMIN_PASSWORD='una-contraseña-larga-y-única' ADMIN_FULL_NAME='Nombre Administrador' npm run admin:create
```

El script crea o restablece exclusivamente la cuenta indicada como `ADMIN`; no existe un endpoint público para esta operación. En producción usa un gestor de secretos o un entorno de despliegue restringido para ejecutar el comando.

Para desarrollo, una vez exista un administrador, `POST /api/members/invitations` devuelve temporalmente `invitationUrl`. Visita esa URL desde el frontend cuando se implemente `/register`. En producción el enlace no se devuelve: debe ser enviado por un proveedor de correo configurado en el backend.

## Endpoints

| Método  | Ruta                        | Rol               | Descripción                           |
| ------- | --------------------------- | ----------------- | ------------------------------------- |
| `GET`   | `/health`                   | Público           | Estado del servicio.                  |
| `POST`  | `/api/auth/login`           | Público           | Inicia sesión y establece cookies.    |
| `POST`  | `/api/auth/register`        | Invitación válida | Crea una cuenta desde una invitación. |
| `GET`   | `/api/auth/me`              | Sesión            | Usuario actual.                       |
| `POST`  | `/api/auth/logout`          | Sesión + CSRF     | Cierra la sesión.                     |
| `GET`   | `/api/members`              | `ADMIN`           | Lista usuarios.                       |
| `POST`  | `/api/members/invitations`  | `ADMIN` + CSRF    | Crea invitación.                      |
| `PATCH` | `/api/members/:userId/role` | `ADMIN` + CSRF    | Modifica un rol.                      |

Los endpoints que modifican datos requieren `Origin` igual a `APP_ORIGIN`. Las acciones autenticadas requieren adicionalmente `X-CSRF-Token`, cuyo valor coincide con la cookie `usagepanel_csrf`.

## Uso desde el frontend

El frontend se comunica exclusivamente con esta API. Ejemplo de login:

```ts
await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
```

Para `logout`, invitaciones y cambios de rol, leer la cookie `usagepanel_csrf` y enviarla como `X-CSRF-Token`. El backend valida la sesión en la cookie `usagepanel_session` sin que JavaScript pueda leerla.

## Integraciones futuras

Las integraciones con n8n y telefonía deben agregarse bajo `src/integrations/` y ser invocadas solo desde rutas o servicios del backend. Sus credenciales se almacenarán como secretos del entorno del backend, nunca en React ni en n8n expuesto al navegador.

## Comandos

```bash
npm run dev              # Desarrollo con recarga
npm run build            # Compila TypeScript en dist/
npm run start            # Ejecuta el build
npm run lint             # Ejecuta ESLint
npm run prisma:generate  # Regenera cliente Prisma
npm run prisma:deploy    # Aplica migraciones existentes
```
