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
    if (import.meta.env.DEV && sessionStorage.getItem('DEBUG_WS')) {
      console.debug('[WebSocket] Ya conectado, reutilizando conexión')
    }
    return socket
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5500'
  const token = getStoredToken()

  if (!token) {
    if (import.meta.env.DEV && sessionStorage.getItem('DEBUG_WS')) {
      console.debug('[WebSocket] No token, conexión rechazada')
    }
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
    if (import.meta.env.DEV && sessionStorage.getItem('DEBUG_WS')) {
      console.debug('[WebSocket] Cambio de disponibilidad recibido:', data)
    }
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
    if (import.meta.env.DEV && sessionStorage.getItem('DEBUG_WS')) {
      console.debug('[WebSocket] Desconectado')
    }
  })

  // Evento de reconexión
  socket.on('connect', () => {
    if (import.meta.env.DEV && sessionStorage.getItem('DEBUG_WS')) {
      console.debug('[WebSocket] Conectado. Socket ID:', socket.id)
    }
    localStorage.setItem('websocket_socket_id', socket.id)
  })

  return socket
}

/**
 * Se suscribe a los cambios de una zona específica
 * @param {number} zonaId - ID de la zona
 */
export function subscribeToZona(zonaId) {
  if (!socket?.connected) {
    // Solo log en dev si está en modo debug
    if (import.meta.env.DEV && sessionStorage.getItem('DEBUG_WS')) {
      console.debug('[WebSocket] No conectado, intentando suscribir a zona', zonaId)
    }
    return
  }

  socket.emit('join-zona', { zonaId })
  if (import.meta.env.DEV && sessionStorage.getItem('DEBUG_WS')) {
    console.log(`[WebSocket] Suscrito a zona ${zonaId}`)
  }
}

/**
 * Se desuscribe de los cambios de una zona específica
 * @param {number} zonaId - ID de la zona
 */
export function unsubscribeFromZona(zonaId) {
  if (!socket?.connected) {
    // Silent fail en producción y dev normal
    return
  }

  socket.emit('leave-zona', { zonaId })
  if (import.meta.env.DEV && sessionStorage.getItem('DEBUG_WS')) {
    console.log(`[WebSocket] Desuscrito de zona ${zonaId}`)
  }
}

/**
 * Desconecta del servidor WebSocket
 */
export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
    if (import.meta.env.DEV && sessionStorage.getItem('DEBUG_WS')) {
      console.debug('[WebSocket] Desconectado')
    }
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
