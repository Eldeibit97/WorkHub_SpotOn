# Frontend: crear reservas en lote (`POST /api/reservas/batch`)

Especificación aportada por el backend; el cliente en este repo envía el cuerpo documentado aquí (ver [`src/api/reserve.js`](../src/api/reserve.js) y [`ReservationWizard.jsx`](../src/pages/CrearReservacion/components/ReservationWizard.jsx)).

## Autenticación

- Ruta protegida: roles **admin** o **employee**.
- Enviar sesión: **`credentials: 'include'`** (cookie) y/o **`Authorization: Bearer`** según el cliente (`apiFetch` + `authHeaders` en reservas batch).

## Cuerpo JSON

El cuerpo **debe** ser un objeto con la clave **`reservas`**: un **array no vacío** de ítems.

```json
{
  "reservas": [
    {
      "idEspacio": 154,
      "fechaReserva": "2026-05-12",
      "horaInicio": "09:00",
      "horaSalida": "11:00",
      "tipoReserva": "INDIVIDUAL"
    }
  ]
}
```

- **`tipoReserva`** es opcional; por defecto el backend usa `INDIVIDUAL`.
- En base de datos, la tabla `Reserva` guarda `hora_inicio` / `hora_fin` (equivale a `horaInicio` / `horaSalida` en el API). Puedes usar también **`hora_fin`** como alias de `horaSalida`.

### Claves aceptadas (camelCase o snake_case y alias)

| Concepto   | Claves aceptadas |
|-----------|-------------------|
| Espacio   | `idEspacio`, `id_espacio`, `spaceId`, `espacioId` |
| Fecha     | `fechaReserva`, `fecha_reserva`, `fecha`, `date` — valor `YYYY-MM-DD`, o fecha ISO (se toman solo los primeros 10 caracteres si son `YYYY-MM-DD`), u objeto `Date` en JSON no aplica; en código JS puedes enviar el string ISO `2026-05-12T00:00:00.000Z` y el backend normaliza a `2026-05-12`. |
| Hora inicio | `horaInicio`, `hora_inicio`, `startTime` — texto **`HH:mm`** o **`HH:mm:ss`** (p. ej. `08:00:00`). |
| Hora fin/salida | `horaSalida`, `hora_salida`, `hora_fin`, `horaFin`, `endTime` |

Las horas pueden ir como **string** o **número** solo si al convertir a string sigue siendo un formato con `:` (p. ej. no envíes minutos totales como número sin más lógica).

## Errores frecuentes (400 con el mensaje genérico)

1. **`reservas` ausente o no es array** — debe ser `{ "reservas": [ ... ] }`, no el array suelto en la raíz.
2. **Fecha con formato incorrecto** — evitar `DD/MM/YYYY`; usar `YYYY-MM-DD` o ISO completa.
3. **Horas que no son string/number legible** — por ejemplo `undefined`, objeto, o campo mal nombrado (`horaFin` sin alias: usa `horaSalida`, `hora_fin` o `endTime`).
4. **`idEspacio` inválido** — debe ser un id numérico existente en `Espacio` y **`activo = true`**.

## Respuesta exitosa (201)

```json
{
  "creadas": 1,
  "ids": [ 123 ],
  "reservas": [ { "idReserva": 123 } ]
}
```

El frontend normaliza esta respuesta con `parseBatchCreateResponse` para mostrar IDs en el paso final del wizard.

## Referencia backend (otro repositorio)

- `src/controllers/reservation.controller.js` — `batchCreateReservas`
- `src/services/reservation.service.js` — `createReservationsBatch`
