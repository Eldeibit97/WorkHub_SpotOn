import { apiFetch } from "./client";

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
  const res = await apiFetch('/api/reservando', { method: 'POST', body: datosReserva });
  const respuesta = await res.text();
  let mensaje = {}
  if (respuesta) {
    mensaje = JSON.parse(respuesta)
  }
  console.log('Mensaje', mensaje);
}