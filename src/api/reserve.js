import { apiFetch } from './client';
import { getStoredToken } from './auth';

/** Límite superior típico de `INTEGER` en PostgreSQL (id_espacio en la app). */
export const PG_INTEGER_MAX = 2_147_483_647;
/** Por encima suele ser timestamp en ms (FloorEditor `Date.now()`), no un id de tabla `Espacio`. */
export const TIMESTAMP_STYLE_ESPACIO_ID_THRESHOLD = 1_000_000_000_000;

/**
 * Comprueba si un número puede ser un `id_espacio` real (entero positivo en rango PG int, no estilo timestamp).
 * @param {unknown} id
 * @returns {boolean}
 */
export function isPlausibleDbEspacioId(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) return false;
  if (n > PG_INTEGER_MAX) return false;
  if (n >= TIMESTAMP_STYLE_ESPACIO_ID_THRESHOLD) return false;
  return true;
}

function authHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * POST /api/reservas/batch — normaliza un ítem al contrato camelCase del backend.
 * @param {object} raw
 * @returns {{ idEspacio: number, fechaReserva: string, horaInicio: string, horaSalida: string, tipoReserva?: string, mail?: string, observaciones?: string }}
 */
export function toBatchReservaItem(raw) {
  const idEspacio = Number(raw.idEspacio ?? raw.id_espacio ?? raw.spaceId ?? raw.espacioId);
  const fechaReserva =
    raw.fechaReserva ?? raw.fecha_reserva ?? raw.fecha ?? raw.date ?? '';
  let horaInicio = raw.horaInicio ?? raw.hora_inicio ?? raw.startTime ?? '';
  let horaSalida =
    raw.horaSalida ?? raw.hora_salida ?? raw.hora_fin ?? raw.horaFin ?? raw.endTime ?? '';
  if (typeof horaInicio === 'number') horaInicio = String(horaInicio);
  if (typeof horaSalida === 'number') horaSalida = String(horaSalida);
  const out = {
    idEspacio,
    fechaReserva,
    horaInicio,
    horaSalida,
  };
  if (raw.tipoReserva) out.tipoReserva = raw.tipoReserva;
  if (raw.mail) out.mail = raw.mail;
  if (raw.observaciones) out.observaciones = raw.observaciones;
  return out;
}

/**
 * Interpreta la respuesta 201 de /api/reservas/batch para el paso "listo" del wizard.
 * Soporta forma nueva (`creadas`, `ids`, `reservas`) y legada (`creadas` como array de objetos).
 *
 * @param {object|null} data - JSON parseado
 * @param {Array<{ idEspacio?: number, id_espacio?: number }>} [fallbackItems] - ítems enviados (por orden)
 * @returns {Array<{ id_reserva: number|string, id_espacio: number, estado?: string }>}
 */
export function parseBatchCreateResponse(data, fallbackItems = []) {
  if (!data || typeof data !== 'object') return [];

  if (Array.isArray(data.reservas) && data.reservas.length > 0) {
    return data.reservas.map((r, i) => ({
      id_reserva: r.idReserva ?? r.id_reserva ?? data.ids?.[i] ?? '—',
      id_espacio: r.idEspacio ?? r.id_espacio ?? fallbackItems[i]?.idEspacio ?? fallbackItems[i]?.id_espacio,
      estado: r.estado ?? 'PENDIENTE',
    }));
  }

  if (Array.isArray(data.creadas) && data.creadas.length > 0 && typeof data.creadas[0] === 'object') {
    return data.creadas.map((c) => ({
      id_reserva: c.id_reserva ?? c.idReserva ?? '—',
      id_espacio: c.id_espacio ?? c.idEspacio,
      estado: c.estado ?? 'PENDIENTE',
    }));
  }

  if (typeof data.creadas === 'number' && Array.isArray(data.ids) && data.ids.length > 0) {
    return data.ids.map((id, i) => ({
      id_reserva: id,
      id_espacio: fallbackItems[i]?.idEspacio ?? fallbackItems[i]?.id_espacio,
      estado: 'PENDIENTE',
    }));
  }

  return (fallbackItems || []).map((it, i) => ({
    id_reserva: data.ids?.[i] ?? `local-${Date.now()}-${i}`,
    id_espacio: it.idEspacio ?? it.id_espacio,
    estado: 'PENDIENTE',
  }));
}

/**
 * @param {Object} datosReserva - Datos de la reserva (legacy /api/reservando)
 */
export async function reservar(datosReserva) {
  try {
    const res = await apiFetch('/api/reservando', { method: 'POST', body: datosReserva });
    const respuesta = await res.text();
    let mensaje = {};
    if (respuesta) {
      mensaje = JSON.parse(respuesta);
    }
    console.log('Mensaje', mensaje);
    return mensaje;
  } catch {
    return { message: 'Hubo un error al completar' };
  }
}

/**
 * POST /api/reservas/batch — cuerpo `{ reservas: [ ... ] }` (array no vacío).
 *
 * @param {Array<object>} items - Objetos con campos camelCase o snake_case; se pueden pasar por `toBatchReservaItem`.
 * @returns {Promise<{ ok:boolean, status:number, data:any }>}
 */
export async function reservarBatch(items) {
  const res = await apiFetch('/api/reservas/batch', {
    method: 'POST',
    headers: authHeaders(),
    body: { reservas: items },
  });
  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }
  return { ok: res.ok, status: res.status, data };
}

/**
 * POST /api/reservas/bloquear-temporal — bloquea espacios mientras el usuario está en Step 3
 * @param {Array<number>} idEspacios - IDs de espacios a bloquear
 * @param {number} idZona - ID de la zona
 * @returns {Promise<boolean>}
 */
export async function bloquearEspaciosTemporal(idEspacios, idZona, socketId = null) {
  try {
    const res = await apiFetch('/api/reservas/bloquear-temporal', {
      method: 'POST',
      headers: authHeaders(),
      body: {
        id_espacios: idEspacios,
        id_zona: idZona,
        socketId: socketId  // AGREGAR
      }
    });
    
    if (res.ok) {
      console.log(`[bloquearEspaciosTemporal] Espacios ${idEspacios.join(',')} bloqueados en zona ${idZona}`);
      return true;
    }
    
    console.warn(`[bloquearEspaciosTemporal] Error: ${res.status}`);
    return false;
  } catch (error) {
    console.error('[bloquearEspaciosTemporal] Error:', error);
    return false;
  }
}

/**
 * POST /api/reservas/liberar-temporal — libera espacios si el usuario cancela
 * @param {Array<number>} idEspacios - IDs de espacios a liberar
 * @param {number} idZona - ID de la zona
 * @returns {Promise<boolean>}
 */
export async function liberarEspaciosTemporal(idEspacios, idZona, socketId = null) {
  try {
    const res = await apiFetch('/api/reservas/liberar-temporal', {
      method: 'POST',
      headers: authHeaders(),
      body: {
        id_espacios: idEspacios,
        id_zona: idZona,
        socketId: socketId  // AGREGAR
      }
    });
    
    if (res.ok) {
      console.log(`[liberarEspaciosTemporal] Espacios ${idEspacios.join(',')} liberados en zona ${idZona}`);
      return true;
    }
    
    console.warn(`[liberarEspaciosTemporal] Error: ${res.status}`);
    return false;
  } catch (error) {
    console.error('[liberarEspaciosTemporal] Error:', error);
    return false;
  }
}