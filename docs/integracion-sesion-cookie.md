# Integración frontend: sesión por cookie (WorkHub API)

Referencia para consumir el backend con **sesión de servidor** (cookie `workhub.sid`, store en PostgreSQL, etc.).

## Pestañas y `sessionStorage`

La cookie **`workhub.sid`** (origen del API) la comparte el navegador entre **todas las pestañas**. En cambio, **`sessionStorage`** (p. ej. `workhub_auth_token`) es **por pestaña**: al abrir otra pestaña, puede no haber JWT aunque la sesión por cookie siga activa.

**Solución implementada:** al montar la app, **`AuthProvider`** llama **`GET /api/auth/me`** con **`credentials: 'include'`** (por defecto en `apiFetch`). Si esa pestaña tiene JWT, también se envía **`Authorization: Bearer`** (migración).

- **200** y body `{ "user": { ... } }` (mismo criterio que en login): usuario autenticado; se rellena el contexto sin depender solo de `sessionStorage`.
- **401**: no hay sesión/cookie válida (o token inválido si se envió); se limpia el JWT de esa pestaña y el usuario queda no autenticado.
- **Sin `VITE_API_URL`**: no se llama `/me`; solo se usa el JWT de esa pestaña si existe (desarrollo sin API).

Código: [`src/context/AuthContext.jsx`](../src/context/AuthContext.jsx), [`src/api/auth.js`](../src/api/auth.js) (`getAuthMe`).

## Rutas exentas del 401 global

`GET /api/auth/me` puede responder **401** cuando no hay sesión; eso **no** debe disparar el handler global que hace logout y redirección (evita ruido en el arranque). En [`src/api/client.js`](../src/api/client.js), `/api/auth/me` se trata como ruta “pública” para ese propósito (junto con login y logout).

## Variables de entorno (frontend)

| Variable | Uso |
|----------|-----|
| `VITE_API_URL` | Base del API (sin `/` final). Obligatorio para llamar `/me` y el resto de rutas. |
| `VITE_API_WITH_CREDENTIALS` | Si **`false`**, las peticiones no envían cookies. Por defecto se usa **`include`** (necesario para la cookie de sesión). |
| `VITE_LOGIN_PATH` | Login; por defecto `/api/auth/login`. |

El origen del frontend debe estar en **`FRONTEND_ORIGINS`** / **`FRONTEND_ORIGIN`** del backend para CORS con credenciales.

## Login

- **POST** `{VITE_API_URL}/api/auth/login` (o `VITE_LOGIN_PATH`)
- **Body JSON**: `{ "email": string, "password": string }` (el backend puede aceptar alias de correo).
- **Respuesta 200**: `{ "token": string, "user": { ... } }` y **`Set-Cookie`** con la sesión.
- El frontend guarda el JWT en `sessionStorage` para Bearer y claims locales; la fuente de verdad server-side es la **cookie**.

## Logout

- **POST** `{VITE_API_URL}/api/auth/logout`
- **`credentials: 'include'`**
- **204** esperado: sesión invalidada; el cliente llama esto desde `signOut()` y borra token + borrador del wizard en `sessionStorage`.

## GET `/api/auth/me`

- **GET** `{VITE_API_URL}/api/auth/me`
- Headers: ninguno obligatorio si la cookie se envía; opcional **`Authorization: Bearer`**.
- **200**: `{ "user": { "id_usuario", "nombre", "apellido", "correo_institucional", "rol", ... } }`
- **401**: sesión inválida o usuario borrado.

### Otros 401 (rutas protegidas)

Si una petición autenticada recibe **401**, el cliente puede ejecutar el handler registrado con `setUnauthorizedHandler`: limpiar estado y redirigir a login (y opcionalmente intentar `POST /api/auth/logout`).

## Producción: HTTPS, SameSite, Secure

En **producción** el backend suele usar **`SameSite=None`** y **`Secure=true`**: front y API deben servirse por **HTTPS** para que el navegador guarde la cookie.

En **desarrollo** suele usarse **`SameSite=Lax`** y **`Secure=false`** para `http://localhost`.

## CSRF

Con cookie de sesión y SPA en **origen distinto** del API, **`SameSite=None`** puede aumentar riesgo de **CSRF** en POST/PATCH/DELETE. Mitigaciones habituales: mismo sitio vía proxy, o token CSRF. El backend puede no exponer aún CSRF; revisar política del equipo.

## Referencia código backend (otro repositorio)

- Rutas y middleware: `auth.routes.js`, `auth.controller.js`, `authenticate.js`, `session.js`, etc.

## Referencia código frontend

- Cliente HTTP: [`src/api/client.js`](../src/api/client.js)
- Login, `/me`, logout: [`src/api/auth.js`](../src/api/auth.js)
- Estado de usuario y arranque: [`src/context/AuthContext.jsx`](../src/context/AuthContext.jsx)
