# Admin Dashboard (Overview) Backend Integration

This document defines the backend contract expected by the admin Dashboard overview page (route `/admin`).
The Users management page (`/admin/usuarios`) is documented separately in
[`admin-users-backend-integration.md`](./admin-users-backend-integration.md).

## 1) Endpoint

### `GET /api/admin/stats?from=YYYY-MM-DD&to=YYYY-MM-DD`

- Auth: required (admin role only).
- Query params (optional): `from` and `to` as ISO dates to bound the time-aware metrics
  (reservations charts). When omitted, backend should return values for the full default
  window (e.g. last 30 days) and a 7-day series for the bar chart.
- Response shape (all fields required, arrays may be empty but must exist):

```json
{
  "totals": {
    "users": 7,
    "activeReservations": 12,
    "availableSpaces": 332,
    "cancelledReservations": 4
  },
  "reservationsByStatus": [
    { "status": "PENDIENTE", "count": 15 },
    { "status": "ACTIVO", "count": 8 },
    { "status": "CHECKED_IN", "count": 4 },
    { "status": "CHECKED_OUT", "count": 6 },
    { "status": "CANCELADO", "count": 3 },
    { "status": "EXPIRADO", "count": 2 }
  ],
  "usersByRole": [
    { "role": "admin", "count": 1 },
    { "role": "employee", "count": 6 }
  ],
  "reservationsLast7Days": [
    { "date": "2026-04-23", "count": 5 },
    { "date": "2026-04-24", "count": 12 },
    { "date": "2026-04-25", "count": 8 },
    { "date": "2026-04-26", "count": 3 },
    { "date": "2026-04-27", "count": 9 },
    { "date": "2026-04-28", "count": 11 },
    { "date": "2026-04-29", "count": 6 }
  ],
  "occupancyByZone": [
    { "zone": "PB", "occupied": 45, "total": 75 },
    { "zone": "MZ", "occupied": 60, "total": 114 },
    { "zone": "P3", "occupied": 8, "total": 39 },
    { "zone": "P9", "occupied": 30, "total": 90 }
  ]
}
```

## 2) SQL guidance per metric

Tables referenced: `Usuario`, `Reserva`, `Espacio`, `Zona`.

### `totals.users`
```sql
SELECT COUNT(*) AS users FROM Usuario;
```

### `totals.activeReservations`
```sql
SELECT COUNT(*) AS active
FROM Reserva
WHERE estado_reserva IN ('ACTIVO', 'CHECKED_IN');
```

### `totals.availableSpaces`
```sql
SELECT COUNT(*) AS available
FROM Espacio
WHERE activo = TRUE AND estado_actual = 'DISPONIBLE';
```

### `totals.cancelledReservations`
```sql
SELECT COUNT(*) AS cancelled
FROM Reserva
WHERE estado_reserva = 'CANCELADO';
```

### `reservationsByStatus`
```sql
SELECT estado_reserva AS status, COUNT(*) AS count
FROM Reserva
GROUP BY estado_reserva
ORDER BY count DESC;
```

### `usersByRole`
```sql
SELECT rol AS role, COUNT(*) AS count
FROM Usuario
GROUP BY rol
ORDER BY count DESC;
```

### `reservationsLast7Days`
```sql
SELECT TO_CHAR(DATE(fecha_reserva), 'YYYY-MM-DD') AS date,
       COUNT(*) AS count
FROM Reserva
WHERE fecha_reserva >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(fecha_reserva)
ORDER BY DATE(fecha_reserva);
```
Backend must return the full 7-day window (zero-fill missing days).

### `occupancyByZone`
Use the current-day reservations (`ACTIVO` or `CHECKED_IN`) per zone joined against total
spaces in that zone.

```sql
WITH spaces_per_zone AS (
  SELECT z.nombre_zona AS zone, COUNT(*) AS total
  FROM Espacio e
  JOIN Zona z ON z.id_zona = e.id_zona
  WHERE e.activo = TRUE
  GROUP BY z.nombre_zona
),
occupied_per_zone AS (
  SELECT z.nombre_zona AS zone, COUNT(*) AS occupied
  FROM Reserva r
  JOIN Espacio e ON e.id_espacio = r.id_espacio
  JOIN Zona z ON z.id_zona = e.id_zona
  WHERE r.estado_reserva IN ('ACTIVO', 'CHECKED_IN')
    AND DATE(r.fecha_reserva) = CURRENT_DATE
  GROUP BY z.nombre_zona
)
SELECT s.zone, COALESCE(o.occupied, 0) AS occupied, s.total
FROM spaces_per_zone s
LEFT JOIN occupied_per_zone o ON o.zone = s.zone
ORDER BY s.zone;
```

## 3) Validation and rules

- Endpoint must require authentication (JWT) and admin role.
- Counts must never be negative; clamp to 0 if needed.
- For `reservationsLast7Days`, always return 7 entries (zero-fill missing days) so the chart
  draws a continuous series.
- Values for `occupied` must never exceed `total` for the same zone.

## 4) Error responses

| Status | When                                  |
| ------ | ------------------------------------- |
| 401    | Missing or invalid auth token         |
| 403    | Authenticated but role is not admin   |
| 422    | `from` or `to` provided but malformed |
| 500    | Unexpected backend failure            |

Error body shape:
```json
{ "message": "Texto legible explicando el error" }
```

## 5) Frontend behavior

- The frontend uses the helper [`src/api/admin.js`](../src/api/admin.js) which calls
  `GET /api/admin/stats` with the user JWT.
- If the backend returns a non-2xx response or the request fails, the Dashboard renders an
  inline error banner without breaking the page; loading skeletons are shown while data is
  fetched.
- Empty arrays (e.g. no reservations yet) render a friendly empty state for that chart.
