import { apiFetch } from './client'

/**
 * Checks whether the user has a pending reservation for today.
 * @returns {Promise<boolean>}
 */
export async function checkPendingReservation(userId, today, rango) {
  try {
    const res = await apiFetch('/api/reservas/tiene-reserva', {
      method: 'POST',
      body: { user_id: userId, today, rango },
    });
    if (res.ok) {
      const text = await res.text();
      return JSON.parse(text).pendiente ?? false;
    }
  } catch {
    // endpoint not available; default to no pending reservation
  }
  return false;
}

/**
 * Sends a suggestion request to the LLM endpoint.
 * For normal requests: { query, user_id }
 * For traffic requests: { query, user_id, origin, destination, route }
 * @returns {Promise<object>}
 */
export async function suggest(body) {
  try {
    const res = await apiFetch('/suggest', { method: 'POST', body }, true);
    if (!res.ok) {
      return { message: `Error ${res.status} al obtener la sugerencia` };
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: 'Hubo un error al obtener la sugerencia' };
  }
}