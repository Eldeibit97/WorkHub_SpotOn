# API para el agente de backend

Este documento resume **todas las rutas HTTP que el frontend espera** (`src/api/*.js` y llamadas directas con `apiFetch`). La base de la API es `VITE_API_URL` (sin barra final). Las rutas en la tabla son relativas a esa base.

Para el flujo de reservación (SQL, validaciones y payloads detallados) ver también [reservation-flow-backend-integration.md](./reservation-flow-backend-integration.md).

---

## Configuración en el frontend

| Variable | Uso |
|----------|-----|
| `VITE_API_URL` | Origen del backend (obligatorio para `apiFetch`). |
| `VITE_LOGIN_PATH` | Ruta de login; por defecto `/api/auth/login`. |
| `VITE_API_WITH_CREDENTIALS` | Si es **`false`**, las peticiones no envían cookies (`omit`). Por defecto se usa **`include`** (sesión `workhub.sid`). |

---

## Autenticación

- **Login:** el body es JSON `{ "email": string, "password": string }` (ver `SignInPage.jsx`). El servidor puede aceptar alias de correo según backend.
- **Cookies:** todas las peticiones `apiFetch` usan `credentials: 'include'` salvo `VITE_API_WITH_CREDENTIALS=false`.
- **Respuesta esperada:** el cliente acepta `token`, `accessToken` o `access_token`; lo guarda en `sessionStorage` y envía **`Authorization: Bearer <token>`** en rutas protegidas (migración; la sesión principal es la cookie).
- **Usuario tras login:** el frontend usa también el objeto `user` de la respuesta (nombre, rol, etc.) y decodifica el JWT para `sub` / claims (sin verificar firma en el cliente).

---

## Índice de endpoints (implementación esperada en backend)

| Método | Ruta | Auth | Capa en frontend | Notas |
|--------|------|------|------------------|--------|
| POST | `/api/auth/login` (o `VITE_LOGIN_PATH`) | No | [auth.js](../src/api/auth.js) | Credenciales JSON; `Set-Cookie` + `token` en body. |
| POST | `/api/auth/logout` | Cookie (y opcional Bearer) | [auth.js](../src/api/auth.js) | 204; invalida sesión. |
| GET | `/api/zonas` | Bearer (opcional en cliente; si falla, hay fallback local) | [spaces.js](../src/api/spaces.js) | Lista de zonas. |
| GET | `/api/spaces?zonaId=:id` | Bearer (opcional) | [spaces.js](../src/api/spaces.js) | Mapa del piso; si no hay datos, se usan JSON locales. |
| GET | `/api/spaces/availability?zonaId&fecha&horaInicio&horaFin` | Bearer (opcional) | [spaces.js](../src/api/spaces.js) | `fecha` = `YYYY-MM-DD`, horas `HH:mm`. Ver doc de integración. |
| GET | `/api/spaces/:id_espacio/schedule?fecha=YYYY-MM-DD` | Bearer si hay token | [Step2SeatMap.jsx](../src/pages/CrearReservacion/components/Step2SeatMap.jsx) | Modal “Detalles”; ver contrato abajo. |
| POST | `/api/reservas/batch` | Bearer | [reserve.js](../src/api/reserve.js) | Body `{ "reservas": [ ... ] }`. Ver doc de integración. |
| POST | `/api/reservando` | **No envía Bearer hoy** | [reserve.js](../src/api/reserve.js) | Reserva legacy/individual; conviene alinear con JWT o deprecar. |
| GET | `/api/admin/stats?from&to` | Bearer | [admin.js](../src/api/admin.js) | Query opcional. |
| GET | `/api/admin/users?page&pageSize&search&role` | Bearer | [users.js](../src/api/users.js) | |
| GET | `/api/admin/roles` | Bearer | [users.js](../src/api/users.js) | |
| POST | `/api/admin/users` | Bearer | [users.js](../src/api/users.js) | |
| PATCH | `/api/admin/users/:id` | Bearer | [users.js](../src/api/users.js) | |
| PATCH | `/api/admin/users/:id/password` | Bearer | [users.js](../src/api/users.js) | Body `{ "password": string }`. |
| PATCH | `/api/admin/users/:id/roles` | Bearer | [users.js](../src/api/users.js) | Body `{ "roles": ... }`. |
| DELETE | `/api/admin/users/:id` | Bearer | [users.js](../src/api/users.js) | |
| POST | `/api/admin/users/import-csv` | Bearer | [users.js](../src/api/users.js) | Body `{ "users": rows }`. |

---

## GET `/api/spaces/:id_espacio/schedule`

Usado al abrir el modal de detalle de un espacio en el mapa (paso 2 del wizard).

**Query:** `fecha` = `YYYY-MM-DD`

**Respuesta esperada (200):** JSON con arreglo `bloques` para pintar el día.

```json
{
  "bloques": [
    { "inicio": "08:00", "fin": "10:00", "estado": "LIBRE" },
    { "inicio": "10:00", "fin": "12:00", "estado": "OCUPADO" }
  ]
}
```

- El UI trata como ocupado si `estado` (en minúsculas) es `ocupado`; cualquier otro valor se muestra como bloque “libre”.
- Si la respuesta no es OK o no hay JSON válido, el modal muestra “Sin datos de horario detallado disponibles”.

---

## Sesiones: cookies + JWT (implementado en este frontend)

Ver **[integracion-sesion-cookie.md](./integracion-sesion-cookie.md)** para el contrato con `workhub.sid` (httpOnly), `credentials: 'include'`, logout y 401.

Resumen:
- `apiFetch` envía cookies por defecto; desactivar solo con `VITE_API_WITH_CREDENTIALS=false`.
- Tras login, el JWT sigue guardándose para header `Authorization: Bearer` (migración); la sesión server-side es la cookie.
- `signOut` llama a `POST /api/auth/logout` y borra token y borrador del wizard en `sessionStorage`.

### Backend en este repositorio

**No hay código de servidor en este repositorio** (solo la app Vite/React). Para saber si el backend real implementa “sesiones” (tablas de sesión, refresh tokens, invalidación server-side, etc.) hay que revisar el servicio backend o Swagger allí.

### Frontend (lo que sí existe)

| Concepto | Implementación |
|----------|----------------|
| **Sesión HTTP (cookie)** | Tras login, cookie **`workhub.sid`** (httpOnly) enviada en cada `apiFetch` con `credentials: 'include'`. |
| **Sesión de usuario (auth)** | Tras login, el **JWT** se guarda en **`sessionStorage`** (`workhub_auth_token`). Al recargar, [AuthContext.jsx](../src/context/AuthContext.jsx) lee el token y reconstruye el usuario decodificando el payload del JWT. |
| **Llamadas autenticadas** | La mayoría de rutas usan `Authorization: Bearer` desde [auth.js](../src/api/auth.js) `getStoredToken()`. |
| **Cierre de sesión** | **`POST /api/auth/logout`** con credenciales; luego `clearStoredToken`, borrador del wizard y `navigate('/login')` ([AuthContext.jsx](../src/context/AuthContext.jsx)). |
| **Refresh token / rotación** | **No** hay uso en el cliente de refresh token ni re-login silencioso. |
| **Reserva legacy** | `POST /api/reservando` en [reserve.js](../src/api/reserve.js) **no adjunta Bearer**; el comentario en código menciona que el `mail` se manda “mientras no se manejan sesiones”. El wizard actual usa **`/api/reservas/batch` con Bearer**. Conviene unificar en backend. |
| **“Sesión” del wizard / borrador** | Claves en `sessionStorage` (`workhub_reservation_edit_mode`, borrador, paso) en [ReservationWizard.jsx](../src/pages/CrearReservacion/components/ReservationWizard.jsx) — es **estado local del navegador**, no sesión de API. |
| **Contador “tiempo para reservar”** | temporizador **solo en UI** en Step2; expiración **no** está ligada a una sesión de servidor. |
| **Modal “sesión expirada” (copy)** | Texto de UX cuando vence el contador local; no implica endpoint de sesión en backend. |
| **401 en rutas protegidas** | Handler global en [client.js](../src/api/client.js): si había token o usuario en contexto, limpia y redirige a login. |

### Recomendación para el backend (histórico)

1. Validación JWT coherente además de cookie en rutas protegidas.
2. Unificar autenticación de `POST /api/reservando` con el resto si sigue en uso.
3. Opcional: refresh token y documentar rutas si el JWT es de vida corta.

---

## Referencia rápida de archivos

- Cliente HTTP: [client.js](../src/api/client.js)
- Login / token: [auth.js](../src/api/auth.js)
- Zonas, mapas, disponibilidad: [spaces.js](../src/api/spaces.js)
- Reservas: [reserve.js](../src/api/reserve.js)
- Admin dashboard stats: [admin.js](../src/api/admin.js)
- Admin usuarios: [users.js](../src/api/users.js)
