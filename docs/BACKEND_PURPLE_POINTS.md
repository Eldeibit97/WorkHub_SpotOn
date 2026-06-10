# Purple Points — Especificación para el agente de backend

Este documento define la lógica de negocio, modelo de datos y endpoints REST que el backend
debe implementar para la feature de **Purple Points (PP)** de workhub-spoton. El frontend
consume estos endpoints a través de `src/api/purplePoints.js`; mientras el backend no exista,
el frontend usa un store en localStorage para desarrollo de UI.

## Resumen funcional

- Los Purple Points son la **moneda interna** de la aplicación.
- Se obtienen al **crear** una reserva (workplace o estacionamiento) y hay un **bonus** al
  completar la visita (check-out exitoso → estado `COMPLETADO`).
- Se gastan en el **Mercado**: temas visuales de página, avatares de perfil y banners.
- El saldo y el equipamiento activo (tema, avatar, banner) se devuelven en un solo endpoint
  de balance para simplificar la inicialización del frontend.

## Autenticación

Igual que el resto del API:
- Cookie de sesión `workhub.sid` con `credentials: 'include'`.
- Cabecera opcional `Authorization: Bearer <JWT>`.
- El backend resuelve el `id_usuario` desde la sesión/JWT. El frontend nunca lo envía en el body.
- Responder `401` cuando no hay sesión válida.

## Modelo de datos (PostgreSQL)

```sql
-- Saldo actual del usuario
CREATE TABLE usuario_purple_points (
  id_usuario      INT PRIMARY KEY REFERENCES usuario(id_usuario),
  saldo           INT NOT NULL DEFAULT 0 CHECK (saldo >= 0),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ledger de transacciones (fuente de verdad, permite auditoría e idempotencia)
CREATE TABLE purple_points_transaccion (
  id_transaccion  SERIAL PRIMARY KEY,
  id_usuario      INT NOT NULL REFERENCES usuario(id_usuario),
  tipo            VARCHAR(20) NOT NULL,   -- ver ENUM abajo
  monto           INT NOT NULL,           -- positivo = ganancia, negativo = gasto
  id_reserva      INT REFERENCES reserva(id_reserva),  -- nullable
  item_id         VARCHAR(64),            -- nullable, id del ítem del catálogo
  descripcion     TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_tipo CHECK (tipo IN (
    'EARN_CREATE',    -- puntos por crear reserva
    'EARN_CHECKOUT',  -- bonus por completar (check-out)
    'PURCHASE',       -- gasto en mercado
    'ADMIN_ADJUST'    -- ajuste manual por admin
  ))
);

CREATE INDEX idx_pp_transaccion_usuario ON purple_points_transaccion(id_usuario, creado_en DESC);
CREATE INDEX idx_pp_transaccion_reserva ON purple_points_transaccion(id_reserva, tipo);

-- Inventario: ítems adquiridos por el usuario
CREATE TABLE usuario_inventario (
  id_usuario    INT NOT NULL REFERENCES usuario(id_usuario),
  item_id       VARCHAR(64) NOT NULL,  -- coincide con mercadoCatalog.js en frontend
  categoria     VARCHAR(20) NOT NULL,  -- 'theme' | 'avatar' | 'banner'
  comprado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_usuario, item_id)
);

-- Equipamiento activo del usuario
CREATE TABLE usuario_equipamiento (
  id_usuario   INT PRIMARY KEY REFERENCES usuario(id_usuario),
  tema_id      VARCHAR(64),  -- null = tema por defecto
  avatar_id    VARCHAR(64),  -- null = iniciales
  banner_id    VARCHAR(64),  -- null = sin banner
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Reglas de negocio

### Ganar puntos

| Evento | `tipo_reserva` | PP otorgados |
|--------|----------------|-------------|
| Reserva creada (`POST /api/reservas/batch` 201) | `INDIVIDUAL` (workplace) | **+50 PP** |
| Reserva creada (`POST /api/reservas/batch` 201) | `ESTACIONAMIENTO` | **+30 PP** |
| Check-out exitoso (`PUT /api/reservas/check-out`) | `INDIVIDUAL` | **+25 PP** |
| Check-out exitoso | `ESTACIONAMIENTO` | **+15 PP** |

- **Idempotencia**: antes de insertar, verificar que no exista una fila en
  `purple_points_transaccion` con el mismo `id_reserva` y `tipo`. Si ya existe, no insertar
  ni devolver error — responder 200 con saldo actual.
- Los puntos se otorgan **por reserva individual** dentro de un batch, no por batch completo.
  Un batch de 3 reservas workplace → 3 × 50 = 150 PP.
- **Cancelaciones**: no se restan puntos (sin clawback en v1). Opcional en v2.
- **No-shows**: sin penalización automática en v1. El admin puede usar `ADMIN_ADJUST`.

### Gastar puntos

- Validar que `saldo >= precio_item` antes de descontar.
- Transacción atómica: descontar saldo + insertar en inventario + registrar transacción
  `PURCHASE` (monto negativo).
- No permitir comprar un ítem ya en el inventario; devolver `409 Conflict`.
- El catálogo de ítems y precios vive en el frontend (`src/data/mercadoCatalog.js`) en v1.
  En v2, mover el catálogo al backend para permitir actualizaciones sin deploy.

### Equipar

- Solo se puede equipar un ítem que esté en el inventario del usuario, o que sea gratuito
  (`precio: 0`).
- Upsert en `usuario_equipamiento`.

## Endpoints REST

Todos bajo `/api/purple-points`. Auth: igual que el resto del API.

### `GET /api/purple-points/balance`

Devuelve saldo actual + equipamiento activo en una sola llamada (para inicialización rápida).

Respuesta `200`:
```json
{
  "balance": 350,
  "equipped": {
    "temaId": "dracula",
    "avatarId": "avatar-03",
    "bannerId": null
  },
  "inventory": ["dracula", "avatar-03", "neon"]
}
```

`inventory` es la lista de `item_id` adquiridos (categorías mezcladas; el frontend los separa
con el catálogo local).

### `GET /api/purple-points/transactions?limit=20&offset=0`

Historial de transacciones del usuario autenticado, ordenado por `creado_en DESC`.

Respuesta `200`:
```json
{
  "transactions": [
    {
      "idTransaccion": 42,
      "tipo": "EARN_CREATE",
      "monto": 50,
      "descripcion": "Reserva #128 - Planta Baja",
      "creadoEn": "2026-06-07T03:00:00Z"
    }
  ],
  "total": 12
}
```

### `POST /api/purple-points/purchase`

Compra un ítem del catálogo y lo agrega al inventario.

Cuerpo:
```json
{ "itemId": "dracula" }
```

Respuesta `201`:
```json
{
  "ok": true,
  "newBalance": 150,
  "itemId": "dracula"
}
```

Errores:
- `400` — `itemId` inválido o faltante.
- `402` — saldo insuficiente (`{ "error": "insufficient_balance", "required": 200, "current": 150 }`).
- `409` — ítem ya en inventario.

### `POST /api/purple-points/equip`

Equipa un ítem (debe estar en inventario o ser gratuito).

Cuerpo:
```json
{ "itemId": "dracula", "category": "theme" }
```

Respuesta `200`:
```json
{
  "ok": true,
  "equipped": { "temaId": "dracula", "avatarId": "avatar-03", "bannerId": null }
}
```

Error `403` si el ítem no está en el inventario del usuario.

### Ganancia de puntos (disparo en backend)

El backend debe disparar la lógica de PP en dos puntos ya existentes:

1. **`POST /api/reservas/batch` (201 OK)**: por cada `id_reserva` creada, otorgar puntos
   según `tipo_reserva`. Hacerlo de forma asíncrona o en la misma transacción.
2. **`PUT /api/reservas/check-out` (200 OK)**: otorgar bonus al usuario de la reserva.

Ambas operaciones deben ser idempotentes (clave única `id_reserva + tipo` en transacciones).

## Endpoint opcional de admin

`POST /api/purple-points/admin/adjust` — permite ajustar manualmente el saldo de un usuario.
Solo accesible con rol `admin`.

```json
{ "idUsuario": 7, "monto": 100, "descripcion": "Compensación por error técnico" }
```

## ⚠️ Por qué los temas no cambian en el frontend sin backend

### Diagnóstico

El frontend (`src/api/purplePoints.js`) sigue este flujo de dos pasos:

1. **Comprar** (`POST /api/purple-points/purchase`) → el backend lo acepta y responde 201.
2. **Equipar** (`POST /api/purple-points/equip`) → si el endpoint no está implementado,
   el backend devuelve 404 (o similar) y el frontend cae al fallback de `localStorage`.
   El fallback de equip busca el ítem en `localStorage` para validar que fue comprado ahí.
   Si la compra fue manejada por el backend real, el ítem **no está en `localStorage`** y
   el fallback falla silenciosamente sin aplicar el tema.

### Comportamiento actual (frontend v2, corregido)

Con los cambios aplicados en `src/api/purplePoints.js` (commit actual):
- Al comprar vía backend real, el frontend **también escribe** el ítem en `localStorage`
  como caché de sincronización.
- El fallback de equip ya **no bloquea** si el ítem no está en localStorage; lo agrega y
  continúa para que el tema siempre se aplique visualmente.

Esto permite demostrar los temas en UI incluso cuando `/api/purple-points/equip` no existe
aún. **En producción**, implementar el endpoint a continuación para persistencia real.

### Qué debe implementar el backend para que los temas persistan entre sesiones

1. **`POST /api/purple-points/equip`** (descrito arriba en Endpoints REST) — obligatorio para
   que el equipamiento sobreviva a un cierre de sesión o cambio de dispositivo.

2. **`GET /api/purple-points/balance`** debe devolver el campo `equipped` con `temaId`,
   `avatarId`, `bannerId` correctos. El frontend llama a este endpoint al montar
   `PurplePointsContext` (login) para restaurar el equipamiento activo.

3. **`POST /api/purple-points/purchase`** debe devolver al menos `{ ok: true, newBalance, itemId }`.
   El campo `newBalance` es necesario para actualizar el saldo en la UI sin un segundo fetch.

### Secuencia completa esperada (backend implementado)

```
Usuario compra "dracula" (POST /purchase)
  → Backend: descuenta saldo, inserta en usuario_inventario, responde 201 con newBalance
  → Frontend: muestra botón "Equipar" (isOwned = true)

Usuario equipa "dracula" (POST /equip)
  → Backend: upsert en usuario_equipamiento.tema_id = 'dracula', responde 200 con equipped
  → Frontend: ThemeContext.setTheme('dracula') → data-theme='dracula' en <html>
  → Todos los CSS variables se sobreescriben → UI cambia de tema instantáneamente

Siguiente login (GET /balance)
  → Backend responde equipped.temaId = 'dracula'
  → Frontend aplica el tema sin intervención del usuario
```

## Variables de entorno necesarias

Ninguna adicional en v1 (usa la misma DB que el resto del backend).

## Consideraciones futuras (fuera de v1)

- Mover el catálogo al backend para actualizarlo sin redeploy.
- Expiración de puntos (ej. puntos vencen a los 12 meses).
- Puntos por referir a un compañero.
- Sistema de niveles / badges basado en total histórico de PP.
- Notificaciones push al ganar puntos.
