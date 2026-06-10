import { apiFetch } from './client'

/**
 * @param {Object} promptData - Datos de la reserva
 * @param {number} datosReserva.user_id - ID del usuario (Mientras no se manejan sesiones)
 * @param {string} datosReserva.today - Fecha actual (formato timestamp)
 * @returns {Promise<object>} 
 */
export async function suggest(promptData) {
  try {
    let hasPending = false;
    try {
      const pendiente = await apiFetch('/api/reservas/tieneReserva', { method: 'POST', body: promptData });
      if (pendiente.ok) {
        const marcador = await pendiente.text();
        hasPending = JSON.parse(marcador).pendiente ?? false;
      }
    } catch {
      // endpoint not available; default to no pending reservation
    }
    promptData = {
      ...promptData, query: hasPending
        ? `Dame solo dos respuestas. El primer tipo de sugerencia: Que posibles inconvenientes habria en mi ruta hacia 
       la oficina (Por el momento digamos que partes del tec de monterrey 
       campus monterrey a la oficina de accenture monterrey), 
       Segundo tipo de sugerencia: ¿Que recomendaciones me darias para antes de salir 
       hacia la oficina? (ej. con cuanto tiempo deberia salir, que deberia tomar en 
       cuenta, etc.)`
       : `Primer tipo de sugerencia: ¿Que me sugieres reservar en la proxima semana 
       basado en mis preferencias? Da opciones variadas, segundo tipo de sugerencia: 
       ¿Como esta en disponibilidad espacios que he utilizado en reservas previas?, 
       tercera`
    };
    const res = await apiFetch('/suggest', { method: 'POST', body: promptData }, true);
    if (!res.ok) {
      return { message: `Error ${res.status} al obtener la sugerencia` };
    }
    const respuesta = await res.text();
    let mensaje = {};
    if (respuesta) {
      mensaje = JSON.parse(respuesta);
      mensaje = {...mensaje, pending: hasPending}
    }
    console.log(mensaje);
    return mensaje;
  } catch {
    return { message: 'Hubo un error al obtener la sugerencia' };
  }
}