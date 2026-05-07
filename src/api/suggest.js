import { apiFetch } from './client'

/**
 * @param {Object} promptData - Datos de la reserva
 * @param {string} datosReserva.query - prompt del usuario para obtener sugerencias
 * @param {number} datosReserva.user_id - ID del usuario (Mientras no se manejan sesiones)
 * @param {string} datosReserva.today - Fecha actual (formato timestamp)
 * @returns {Promise<object>} 
 */
export async function suggest(promptData) {
  try {
    const res = await apiFetch('/suggest', { method: 'POST', body: promptData }, true);
    const respuesta = await res.text();
    let mensaje = {};
    if (respuesta) {
      mensaje = JSON.parse(respuesta);
    }
    console.log('Mensaje', mensaje);
    return mensaje;
  } catch {
    return {message: 'Hubo un error al obtener la sugerencia'};
  }
}