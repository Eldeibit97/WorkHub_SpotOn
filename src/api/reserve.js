import { apiFetch } from "./client";
import { getStoredToken } from "./auth";

function authHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * @param {Object} datosReserva - Datos de la reserva
 * @param {string} datosReserva.mail - mail del usuario (Mientras no se manejan sesiones)
 * @param {number} datosReserva.idEspacio - ID del espacio reservado
 * @param {string} datosReserva.fechaReserva - Fecha de la reserva (formato timestamp)
 * @param {string} datosReserva.fechaInicio - Fecha de inicio (formato timestamp)
 * @param {string} datosReserva.fechaSalida - Fecha de Salida (formato timestamp)
 * @param {string} datosReserva.fechaCreacion - Fecha de creación (formato timestamp)
 * @returns {Promise<object>}
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
 * Creates one reservation per item in `items`. Each item maps to a
 * { id_espacio, id_usuario | mail, fecha, horaInicio, horaFin, observaciones }
 * payload. The backend MUST treat the array atomically (all-or-nothing) when
 * possible.
 *
 * @param {Array<{ id_espacio:number, mail?:string, id_usuario?:number, fecha:string,
 *                 horaInicio:string, horaFin:string, observaciones?:string,
 *                 tipoReserva?:'OFICINA'|'ESTACIONAMIENTO' }>} items
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