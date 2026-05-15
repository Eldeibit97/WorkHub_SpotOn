import { apiFetch } from './client'

/**
 * @param {Object} promptData - Datos de la reserva
 * @param {number} datosReserva.user_id - ID del usuario (Mientras no se manejan sesiones)
 * @param {string} datosReserva.today - Fecha actual (formato timestamp)
 * @returns {Promise<object>} 
 */
export async function suggest(promptData) {
  try {
    const pendiente = await apiFetch('/api/reservas/tieneReserva', { method: 'POST', body: promptData });
    const marcador = await pendiente.text();
    console.log(marcador);
    promptData = {
      ...promptData, query: marcador.pendiente ?
       'Que recomendaciones me darias para antes de salir hacia la oficina? (ej. con cuanto tiempo deberia salir, que deberia tomar en cuenta, etc.)'
       : 'Primer tipo de sugerencia: ¿Que me sugieres reservar en la proxima semana basado en mis preferencias? Da opciones variadas, segundo tipo de sugerencia: ¿Como esta en disponibilidad espacios que he utilizado en reservas previas?, tercera'
    };
    const res = await apiFetch('/suggest', { method: 'POST', body: promptData }, true);
    const respuesta = await res.text();
    let mensaje = {};
    if (respuesta) {
      mensaje = JSON.parse(respuesta);
    }
    console.log('Mensaje', mensaje);
    return mensaje;
  } catch {
    return { message: 'Hubo un error al obtener la sugerencia' };
  }
}