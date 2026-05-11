# Integración frontend: sesión por cookie (WorkHub API)

Referencia para consumir el backend con **sesión de servidor** (`express-session`, store en PostgreSQL).

## Resumen

- Tras un login correcto, el servidor envía **`Set-Cookie`** con el nombre **`workhub.sid`** (httpOnly).
- Las rutas protegidas aceptan **primero** esa cookie (sesión) y, en migración, **también** `Authorization: Bearer` con el JWT que devuelve el login.
- Sin cookie válida ni Bearer, las rutas con `authenticate` responden **401** (`Sesión o token requerido` / mensaje de token inválido).

## Variables de entorno (frontend)

| Variable | Uso |
|----------|-----|
| `VITE_API_URL` | Base del API (sin `/` final). |
| `VITE_API_WITH_CREDENTIALS` | Por defecto el cliente usa `credentials: 'include'`; pon **`false`** solo si necesitas el modo legacy sin cookies CORS. |

El origen del frontend debe estar permitido en **`FRONTEND_ORIGINS`** (o `FRONTEND_ORIGIN`) del backend para que CORS permita credenciales.

## Login

- **POST** `{VITE_API_URL}/api/auth/login`
- **Body JSON**: `{ "email": string, "password": string }` (también se aceptan alias de correo en backend: `correo_institucional`, `correo`, `mail`).
- **`credentials: 'include'`** en esta petición (comportamiento por defecto del `apiFetch` del repo).
- **Respuesta 200**: `{ "token": string, "user": { ... } }`. El JWT se guarda en `sessionStorage` para migración y headers Bearer; la fuente de verdad server-side es la **cookie** tras login.

## Cliente HTTP (`apiFetch`)

- Las peticiones usan **`credentials: 'include'`** por defecto (ver `src/api/client.js`).
- Sigue siendo válido enviar **`Authorization: Bearer`** durante la migración.

## Logout

- **POST** `{VITE_API_URL}/api/auth/logout`
- **`credentials: 'include'`**
- **Respuesta 204**: sesión invalidada y cookie eliminada vía `Set-Cookie`.
- El frontend llama a `logoutRequest()` desde `signOut()` en `AuthContext` y limpia `sessionStorage` (token y borrador del wizard de reserva).

## Producción: HTTPS, SameSite y Secure

En el backend, en **`NODE_ENV=production`**, la cookie suele usar **`SameSite=None`** y **`Secure=true`**: front y API deben servirse por **HTTPS** (o el navegador no guardará la cookie correctamente).

En **desarrollo local**, suele usarse **`SameSite=Lax`** y **`Secure=false`** para `http://localhost`.

## CSRF

Con cookie de sesión y SPA en **origen distinto** del API, si la cookie usa `SameSite=None`, puede aumentar el riesgo de **CSRF** en POST/PATCH/DELETE.

Mitigaciones habituales: mismo sitio vía reverse proxy, o token CSRF. Este backend **no** expone actualmente un endpoint CSRF; revisar política de seguridad del equipo.

## Errores y UX

- **401** en rutas protegidas: el `apiFetch` dispara un handler que redirige a `/login` si había token o usuario en contexto (ver `setUnauthorizedHandler` en `src/api/client.js`).

## Implementación en este repo (checklist)

- [x] `credentials: 'include'` por defecto en `apiFetch` (`VITE_API_WITH_CREDENTIALS !== 'false'`).
- [x] Login y logout con credenciales.
- [x] `POST /api/auth/logout` + limpieza de `workhub_auth_token` y claves del wizard en `sessionStorage`.
- [x] Manejo global de **401** → redirección a login cuando aplica.

Configurar en el servidor: **`FRONTEND_ORIGINS`** incluye el origen del dev server (p. ej. `http://localhost:5173`).

## Referencia backend (otro repositorio)

Rutas y middleware viven en el proyecto **WorkHub_Backend** (`session.js`, `authenticate.js`, `auth.routes.js`).
