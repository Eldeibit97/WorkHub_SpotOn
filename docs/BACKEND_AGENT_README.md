# API para el agente de backend

Resumen de **rutas HTTP que el frontend usa** (`src/api/*.js` y llamadas con `apiFetch`). La base es **`VITE_API_URL`** (sin barra final).

Contratos detallados del wizard de reservas: [reservation-flow-backend-integration.md](./reservation-flow-backend-integration.md).  
Autenticación por cookie + JWT: [integracion-sesion-cookie.md](./integracion-sesion-cookie.md).

---

## Configuración en el frontend

| Variable | Uso |
|----------|-----|
| `VITE_API_URL` | Origen del backend (obligatorio para `apiFetch`). |
| `VITE_LOGIN_PATH` | Login; por defecto `/api/auth/login`. |
| `VITE_API_WITH_CREDENTIALS` | Si **`false`**, sin cookies en `fetch`. Por defecto **`include`** (sesión `workhub.sid`). |

---

## Autenticación

- **Login:** body JSON `{ "email", "password" }` (ver backend para alias de correo).
- **Cookie:** sesión server-side (`workhub.sid`, httpOnly).
- **JWT:** el cliente guarda token en `sessionStorage` y envía **`Authorization: Bearer`** cuando existe (migración); muchas rutas funcionan solo con cookie.
- **Arranque:** `GET /api/auth/me` para sincronizar usuario entre pestañas sin depender solo de `sessionStorage`.

---

## Índice de endpoints

| Método | Ruta | Auth | Frontend |
|--------|------|------|----------|
| POST | `/api/auth/login` (o `VITE_LOGIN_PATH`) | No | `auth.js` |
| GET | `/api/auth/me` | Cookie y/o Bearer | `auth.js` → `getAuthMe` |
| POST | `/api/auth/logout` | Cookie y/o Bearer | `auth.js` |
| GET | `/api/zonas` | Bearer opcional | `spaces.js` |
| GET | `/api/spaces?zonaId=:id` | Bearer opcional | `spaces.js` |
| GET | `/api/spaces/availability?zonaId&fecha&horaInicio&horaFin` | Bearer opcional | `spaces.js` |
| GET | `/api/spaces/:id_espacio/schedule?fecha=YYYY-MM-DD` | Bearer si hay token | `Step2SeatMap.jsx` |
| POST | `/api/reservas/batch` | Bearer recomendado | `reserve.js` |
| POST | `/api/reservando` | Hoy sin Bearer en código | `reserve.js` (legacy) |
| GET | `/api/admin/stats?from&to` | Bearer | `admin.js` |
| GET | `/api/admin/users?...` | Bearer | `users.js` |
| GET | `/api/admin/roles` | Bearer | `users.js` |
| POST | `/api/admin/users` | Bearer | `users.js` |
| PATCH | `/api/admin/users/:id` | Bearer | `users.js` |
| PATCH | `/api/admin/users/:id/password` | Bearer | `users.js` |
| PATCH | `/api/admin/users/:id/roles` | Bearer | `users.js` |
| DELETE | `/api/admin/users/:id` | Bearer | `users.js` |
| POST | `/api/admin/users/import-csv` | Bearer | `users.js` |

Admin adicional: ver [admin-dashboard-backend-integration.md](./admin-dashboard-backend-integration.md), [admin-users-backend-integration.md](./admin-users-backend-integration.md).

---

## GET `/api/spaces/:id_espacio/schedule`

Modal de detalle en el paso 2 del mapa.

**Query:** `fecha` = `YYYY-MM-DD`

**200** (ejemplo):

```json
{
  "bloques": [
    { "inicio": "08:00", "fin": "10:00", "estado": "LIBRE" },
    { "inicio": "10:00", "fin": "12:00", "estado": "OCUPADO" }
  ]
}
```

Si no hay datos o error, el UI muestra mensaje genérico.

---

## Sesiones: resumen frontend

| Concepto | Implementación |
|----------|----------------|
| Cookie | `workhub.sid` enviada con `credentials: 'include'` por defecto. |
| JWT | `workhub_auth_token` en `sessionStorage` (por pestaña). |
| Entre pestañas | `GET /api/auth/me` al cargar la app. |
| Logout | `POST /api/auth/logout` + limpieza local en `AuthContext`. |
| 401 en API | Handler global (excepto login, logout, `/me`). |
| Wizard | Claves `workhub_reservation_*` en `sessionStorage`; se limpian al cerrar sesión. |

**Backend:** este repo es solo la app React; la implementación del API está en el servicio WorkHub.

---

## Archivos útiles en el repo

- [`src/api/client.js`](../src/api/client.js) — `apiFetch`, `setUnauthorizedHandler`
- [`src/api/auth.js`](../src/api/auth.js) — login, `getAuthMe`, logout, token
- [`src/api/spaces.js`](../src/api/spaces.js)
- [`src/api/reserve.js`](../src/api/reserve.js)
- [`src/api/admin.js`](../src/api/admin.js)
- [`src/api/users.js`](../src/api/users.js)
- [`src/context/AuthContext.jsx`](../src/context/AuthContext.jsx)
