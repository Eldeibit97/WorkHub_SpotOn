import io from 'socket.io-client'
import { getStoredToken } from './auth'

let socket = null
let availabilityCallback = null

// ─── NUEVO: listeners por evento de parking ──────────────────────────────────
// Estructura: { 'parking:occupancy-changed': [fn1, fn2], ... }
const listeners = {}

function emitToListeners(event, data) {
  const fns = listeners[event]
  if (!fns) return
  for (const fn of fns) {
    try { fn(data) } catch (e) { console.error(`[WebSocket] listener error en ${event}`, e) }
  }
}

/**
 * Suscribe una función a un evento de parking.
 * Retorna una función de cleanup para usar en el return de useEffect.
 *
 * Uso:
 *   const off = onParkingEvent('parking:occupancy-changed', (data) => { ... })
 *   return () => off()
 */
export function onParkingEvent(event, fn) {
  if (!listeners[event]) listeners[event] = []
  listeners[event].push(fn)
  return () => {
    listeners[event] = listeners[event].filter((l) => l !== fn)
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export function connectWebSocket(onAvailabilityChange) {
  // Guardar callback siempre, incluso si ya está conectado
  availabilityCallback = onAvailabilityChange

  if (socket?.connected) {
    return socket
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5500'
  const token = getStoredToken()

  if (!token) return null

  // Si existe pero no está conectado, desconectar limpiamente
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }

  socket = io(apiUrl, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  })

  // ── Evento existente ──────────────────────────────────────────────────────
  socket.on('availability:changed', (data) => {
    if (availabilityCallback) availabilityCallback(data)
  })

  // ── NUEVO: eventos de parking ─────────────────────────────────────────────
  // El servidor emite 'parking:occupancy-changed' después de cada reserva.
  // Cualquier componente puede escucharlo con onParkingEvent().
  socket.on('parking:occupancy-changed', (data) => {
    emitToListeners('parking:occupancy-changed', data)
  })
  // ─────────────────────────────────────────────────────────────────────────

  socket.on('error', (err) => {
    console.error('[WebSocket] Error:', err)
  })

  socket.on('connect', () => {
    // Guardar socketId de forma confiable
    localStorage.setItem('websocket_socket_id', socket.id)
  })

  socket.on('disconnect', () => {
    localStorage.removeItem('websocket_socket_id')
  })

  return socket
}

export function subscribeToZona(zonaId) {
  if (!socket?.connected) return
  socket.emit('join-zona', { zonaId })
}

export function unsubscribeFromZona(zonaId) {
  if (!socket?.connected) return
  socket.emit('leave-zona', { zonaId })
}

// ─── NUEVO: rooms de parking ──────────────────────────────────────────────────
/**
 * Suscribirse a los cambios de ocupación de una zona de estacionamiento.
 * El servidor debe hacer join al room `parking:${id_zona}`.
 */
export function subscribeToParkingZona(id_zona) {
  if (!socket?.connected) return
  socket.emit('join-zona', { zonaId: `parking:${id_zona}` })
}

export function unsubscribeFromParkingZona(id_zona) {
  if (!socket?.connected) return
  socket.emit('leave-zona', { zonaId: `parking:${id_zona}` })
}
// ─────────────────────────────────────────────────────────────────────────────

export function disconnectWebSocket() {
  // No desconectar el socket global aquí — solo limpia si realmente se desmonta todo
  // Si quieres desconectar al salir de la página, hazlo desde el componente raíz
}

export function forceDisconnect() {
  if (socket) {
    socket.disconnect()
    socket = null
    localStorage.removeItem('websocket_socket_id')
  }
}

export function isConnected() {
  return socket?.connected ?? false
}

export function getSocket() {
  return socket
}

export function getSocketId() {
  return socket?.id || localStorage.getItem('websocket_socket_id') || null
}