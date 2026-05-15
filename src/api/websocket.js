import io from 'socket.io-client'
import { getStoredToken } from './auth'

let socket = null

/**
 * Conecta al servidor WebSocket usando Socket.io
 * @param {Function} onAvailabilityChange - Callback cuando hay cambios de disponibilidad
 * @returns {Object} Instancia de Socket.io
 */
export function connectWebSocket(onAvailabilityChange) {
  // Si ya está conectado, retorna la instancia existente
  if (socket?.connected) {
    return socket
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5500'
  const token = getStoredToken()

  if (!token) {
    console.warn('[WebSocket] No token disponible, conexión rechazada')
    return null
  }

  socket = io(apiUrl, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  })

  // Evento cuando hay cambios de disponibilidad
  socket.on('availability:changed', (data) => {
    if (onAvailabilityChange) {
      onAvailabilityChange(data)
    }
  })

  // Manejo de errores
  socket.on('error', (err) => {
    console.error('[WebSocket] Error:', err)
  })

  // Evento de desconexión
  socket.on('disconnect', () => {
    console.log('[WebSocket] Desconectado del servidor')
  })

  // Evento de reconexión
  socket.on('connect', () => {
    console.log('[WebSocket] Conectado al servidor')
  })

  return socket
}

/**
 * Se suscribe a los cambios de una zona específica
 * @param {number} zonaId - ID de la zona
 */
export function subscribeToZona(zonaId) {
  if (!socket?.connected) {
    console.warn('[WebSocket] No conectado, no se puede suscribir a zona', zonaId)
    return
  }

  socket.emit('join-zona', { zonaId })
  console.log(`[WebSocket] Suscrito a zona ${zonaId}`)
}

/**
 * Se desuscribe de los cambios de una zona específica
 * @param {number} zonaId - ID de la zona
 */
export function unsubscribeFromZona(zonaId) {
  if (!socket?.connected) {
    console.warn('[WebSocket] No conectado, no se puede desuscribir de zona', zonaId)
    return
  }

  socket.emit('leave-zona', { zonaId })
  console.log(`[WebSocket] Desuscrito de zona ${zonaId}`)
}

/**
 * Desconecta del servidor WebSocket
 */
export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log('[WebSocket] Desconectado')
  }
}

/**
 * Obtiene el estado de conexión actual
 * @returns {boolean}
 */
export function isConnected() {
  return socket?.connected ?? false
}

/**
 * Obtiene la instancia actual del socket (para casos especiales)
 * @returns {Object|null}
 */
export function getSocket() {
  return socket
}
