# Admin Users Backend Integration

This document defines the backend contract expected by the admin dashboard UI.

## 1) Endpoints

### `GET /api/admin/roles`
- Purpose: return dynamic roles catalog.
- Response example:
```json
{
  "roles": ["admin", "employee"]
}
```

### `GET /api/admin/users?page=1&pageSize=12&search=&role=`
- Purpose: list users with pagination and filters.
- Response example:
```json
{
  "usuarios": [
    {
      "id_usuario": 1,
      "nombre": "Jaime",
      "apellido": "Gamez",
      "correo_institucional": "jaime.gamez@accenture.com",
      "rol": "employee"
    }
  ],
  "total": 120,
  "totalPages": 10
}
```

### `POST /api/admin/users`
- Purpose: create one user.
- Request:
```json
{
  "nombre": "Nuevo",
  "apellido": "Usuario",
  "correo_institucional": "nuevo.usuario@accenture.com",
  "rol": "employee",
  "password": "Secret123!"
}
```

### `PATCH /api/admin/users/:id`
- Purpose: update profile fields (name/email only).
- Request:
```json
{
  "nombre": "NuevoNombre",
  "apellido": "NuevoApellido",
  "correo_institucional": "nuevo.correo@accenture.com"
}
```

### `PATCH /api/admin/users/:id/password`
- Purpose: update password without exposing it in responses.
- Request:
```json
{
  "password": "NewStrongPass123!"
}
```

### `PATCH /api/admin/users/:id/roles`
- Purpose: update or assign user roles.
- Request:
```json
{
  "roles": ["admin"]
}
```

### `DELETE /api/admin/users/:id`
- Purpose: delete user (soft or hard delete).
- Backend must block dangerous deletions (e.g. deleting last admin).

### `POST /api/admin/users/import-csv`
- Purpose: import users after frontend CSV preview.
- Request:
```json
{
  "users": [
    {
      "nombre": "Jaime",
      "apellido": "Gamez",
      "correo_institucional": "jaime.gamez@accenture.com",
      "rol": "employee",
      "password": "",
      "password_hash": "$2b$10$..."
    }
  ]
}
```
- Response should include row-by-row status:
```json
{
  "summary": {
    "created": 10,
    "updated": 2,
    "rejected": 1
  },
  "rows": [
    { "index": 1, "status": "created" },
    { "index": 2, "status": "rejected", "reason": "Correo duplicado" }
  ]
}
```

## 2) SQL / Query Guidance

Assuming table `Usuario(id_usuario, nombre, apellido, correo_institucional, password_hash, rol)`.

### List users
```sql
SELECT id_usuario, nombre, apellido, correo_institucional, rol
FROM Usuario
WHERE
  (:search = '' OR
   LOWER(nombre) LIKE LOWER('%' || :search || '%') OR
   LOWER(apellido) LIKE LOWER('%' || :search || '%') OR
   LOWER(correo_institucional) LIKE LOWER('%' || :search || '%'))
  AND (:role = '' OR rol = :role)
ORDER BY id_usuario DESC
LIMIT :pageSize OFFSET :offset;
```

### Create user
```sql
INSERT INTO Usuario (nombre, apellido, correo_institucional, password_hash, rol)
VALUES (:nombre, :apellido, :correo, :password_hash, :rol)
RETURNING id_usuario, nombre, apellido, correo_institucional, rol;
```

### Update user profile
```sql
UPDATE Usuario
SET nombre = :nombre,
    apellido = :apellido,
    correo_institucional = :correo
WHERE id_usuario = :id
RETURNING id_usuario, nombre, apellido, correo_institucional, rol;
```

### Update password
```sql
UPDATE Usuario
SET password_hash = :password_hash
WHERE id_usuario = :id;
```

### Update role(s)
```sql
UPDATE Usuario
SET rol = :rol
WHERE id_usuario = :id
RETURNING id_usuario, rol;
```

### Delete user
```sql
DELETE FROM Usuario
WHERE id_usuario = :id;
```

If you choose soft delete, add `activo` column and replace with `UPDATE Usuario SET activo = false`.

## 3) Validations

- `correo_institucional` must be unique and lowercase-normalized.
- `rol` must exist in dynamic roles catalog.
- Password must never be returned by any users-list endpoint.
- Hash plain passwords with bcrypt/argon2 in backend.
- If CSV row includes `password_hash`, accept only in controlled migration mode.
- Prevent self-removal / last-admin removal.

## 4) CSV Mapping

Expected input based on `Usuario.csv`:
- `id_usuario` (optional for import, should be ignored or validated)
- `nombre` (required)
- `apellido` (required)
- `correo_institucional` (required)
- `password_hash` (optional; controlled usage)
- `rol` (required)

Recommended import strategy:
1. Validate required columns and format.
2. Normalize email and role values.
3. Upsert by `correo_institucional`.
4. Return per-row result status (`created`, `updated`, `rejected`) and reason.
