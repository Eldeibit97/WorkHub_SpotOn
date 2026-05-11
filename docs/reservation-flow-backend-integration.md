# Reservation flow — backend integration

This document specifies the HTTP contract that the new reservation wizard
(`/reservar`) expects from the backend. The wizard is implemented in
`src/pages/CrearReservacion/components/ReservationWizard.jsx` and uses
`src/api/spaces.js` and `src/api/reserve.js` as its data layer.

While the backend is not implemented, every endpoint falls back to the
local JSONs under `src/data/floor-maps/` (everything appears as
`DISPONIBLE`) so the UI keeps working end-to-end against fixture data.

---

## 1. List zonas

**`GET /api/zonas`**

Returns every zona of the building.

Response `200 OK`:

```json
[
  { "id_zona": 1, "nombre_zona": "PB", "descripcion": "Planta Baja", "edificio": "ATC Monterrey" },
  { "id_zona": 2, "nombre_zona": "MZ", "descripcion": "Mezanine",    "edificio": "ATC Monterrey" },
  { "id_zona": 3, "nombre_zona": "P3", "descripcion": "Piso 3",      "edificio": "ATC Monterrey" },
  { "id_zona": 4, "nombre_zona": "P9", "descripcion": "Piso 9",      "edificio": "ATC Monterrey" }
]
```

SQL:

```sql
SELECT id_zona, nombre_zona, descripcion, edificio
FROM Zona
ORDER BY id_zona;
```

---

## 2. Floor map (zone definition)

**`GET /api/spaces?zonaId=:id`**

Returns the full floor-map definition for a single zona. The frontend
already has a local copy of each map (auto-generated, hand-tuned by the
admin), so the backend response is **optional**: if it returns the same
shape with non-empty `spaces`, the frontend will prefer it.

Response `200 OK`:

```json
{
  "zonaId": 2,
  "codigoZona": "MZ",
  "nombre": "Mezanine",
  "edificio": "ATC Monterrey",
  "viewBox": "0 0 1440 810",
  "background": "/src/assets/mapas/piso_MZ.svg",
  "tipoLabels": {
    "1": "Estacion de trabajo",
    "2": "Sala de juntas",
    "3": "Phone Booth",
    "4": "Media Scape",
    "5": "Area especial"
  },
  "spaces": [
    { "id_espacio": 154, "codigo": "MZ001", "nombre": "Estación MZ001",
      "tipo": 1, "shape": "circle", "x": 220, "y": 180, "r": 11 }
  ]
}
```

SQL (just the `spaces[]` portion):

```sql
SELECT id_espacio, codigo_espacio AS codigo, nombre_espacio AS nombre,
       id_tipo_espacio AS tipo
FROM Espacio
WHERE id_zona = :zonaId AND activo = TRUE
ORDER BY codigo_espacio;
```

The position fields (`shape`, `x`, `y`, `r`, `w`, `h`) are not in the DB
schema today. If you want to persist hand-tuned positions, add a
`floor_map_position` table:

```sql
CREATE TABLE floor_map_position (
  id_espacio   INT PRIMARY KEY REFERENCES Espacio(id_espacio),
  shape        VARCHAR(16) NOT NULL CHECK (shape IN ('circle','rect')),
  x            REAL NOT NULL,
  y            REAL NOT NULL,
  w            REAL,
  h            REAL,
  r            REAL,
  updated_at   TIMESTAMP DEFAULT NOW()
);
```

---

## 3. Availability for a date/time range

**`GET /api/spaces/availability?zonaId=:id&fecha=YYYY-MM-DD&horaInicio=HH:mm&horaFin=HH:mm`**

Returns the state of every space in the zona during the requested window.

Response `200 OK`:

```json
{
  "154": "DISPONIBLE",
  "155": "OCUPADO",
  "156": "DISPONIBLE",
  "468": "BLOQUEADO"
}
```

States:
- `DISPONIBLE` — selectable in the wizard.
- `OCUPADO` — already reserved (PENDIENTE / ACTIVO / CHECKED_IN) for an
  overlapping window. Cannot be selected.
- `BLOQUEADO` — admin-disabled space (`Espacio.activo = FALSE` or
  `estado_actual NOT IN ('DISPONIBLE','OCUPADO')`).

SQL:

```sql
WITH overlapping AS (
  SELECT id_espacio
  FROM Reserva
  WHERE fecha_reserva = :fecha
    AND estado_reserva IN ('PENDIENTE','ACTIVO','CHECKED_IN')
    AND hora_inicio < :horaFin
    AND hora_fin    > :horaInicio
)
SELECT e.id_espacio,
       CASE
         WHEN e.activo = FALSE THEN 'BLOQUEADO'
         WHEN e.estado_actual NOT IN ('DISPONIBLE','OCUPADO') THEN 'BLOQUEADO'
         WHEN o.id_espacio IS NOT NULL THEN 'OCUPADO'
         ELSE 'DISPONIBLE'
       END AS estado
FROM Espacio e
LEFT JOIN overlapping o ON o.id_espacio = e.id_espacio
WHERE e.id_zona = :zonaId;
```

Validation:
- `fecha` must be today or a future date.
- `horaInicio < horaFin` (both `HH:mm` 24h).
- `zonaId` must exist.

Errors:
- `400 Bad Request` — invalid params.
- `401 Unauthorized` — missing/expired JWT.

---

## 4. Create reservations (batch)

**`POST /api/reservas/batch`**

Creates one row per item — the wizard sends one reservation per
selected space (potentially assigning each space to a different
co-worker email).

Request:

```json
{
  "reservas": [
    {
      "id_espacio": 154,
      "mail": "ana.perez@accenture.com",
      "fecha": "2026-04-30",
      "horaInicio": "08:00",
      "horaFin": "13:00",
      "tipoReserva": "OFICINA",
      "observaciones": "Reserva creada por wizard"
    },
    {
      "id_espacio": 155,
      "mail": "luis.romero@accenture.com",
      "fecha": "2026-04-30",
      "horaInicio": "08:00",
      "horaFin": "13:00",
      "tipoReserva": "OFICINA"
    }
  ]
}
```

The user that owns the JWT is the **booker** for every reservation.
`mail` (or `id_usuario`) on each item is the **assignee**: when present,
the reservation is created on behalf of that coworker (lookup by
`Usuario.correo_institucional`). When absent, the reservation belongs to
the booker.

Response `201 Created`:

```json
{
  "creadas": [
    { "id_reserva": 145, "id_espacio": 154, "id_usuario": 12, "estado": "PENDIENTE" },
    { "id_reserva": 146, "id_espacio": 155, "id_usuario": 18, "estado": "PENDIENTE" }
  ]
}
```

Atomicity: if any item fails (overlap, missing user, blocked space),
the whole batch MUST roll back and return `409 Conflict` with the
offending items:

```json
{
  "message": "Conflicto al crear reservas",
  "conflictos": [
    { "id_espacio": 155, "razon": "OCUPADO" },
    { "id_espacio": 999, "razon": "ESPACIO_NO_EXISTE" }
  ]
}
```

SQL (per item, inside transaction):

```sql
-- 1. Resolve assignee
SELECT id_usuario INTO :uid
FROM Usuario
WHERE correo_institucional = :mail
   OR id_usuario = :id_usuario;
-- if NULL -> rollback with USUARIO_NO_EXISTE

-- 2. Verify no overlap
SELECT 1 FROM Reserva
WHERE id_espacio = :id_espacio
  AND fecha_reserva = :fecha
  AND estado_reserva IN ('PENDIENTE','ACTIVO','CHECKED_IN')
  AND hora_inicio < :horaFin
  AND hora_fin    > :horaInicio;
-- if any row -> rollback with OCUPADO

-- 3. Insert
INSERT INTO Reserva (id_usuario, id_espacio, fecha_reserva, hora_inicio,
                     hora_fin, estado_reserva, fecha_creacion, tipo_reserva,
                     observaciones)
VALUES (:uid, :id_espacio, :fecha, :horaInicio, :horaFin,
        'PENDIENTE', NOW(), :tipoReserva, :observaciones)
RETURNING id_reserva, id_usuario, estado_reserva;
```

Validation:
- Same `(zonaId, fecha, horaInicio, horaFin)` constraints as §3.
- Each `mail` must exist in `Usuario`.
- The booker (JWT) cannot create more than one reservation for itself
  in the same window (return `409 / OWNER_DUPLICATE`).

Errors:
- `400 Bad Request` — malformed payload.
- `401 Unauthorized` — missing JWT.
- `403 Forbidden` — booker is not allowed to assign reservations to
  others (configurable, default allow employees).
- `409 Conflict` — overlap or missing user (see above).
