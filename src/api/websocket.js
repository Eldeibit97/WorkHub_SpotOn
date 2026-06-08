import io from 'socket.io-client'
import { getStoredToken } from './auth'

let socket = null
let availabilityCallback = null

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

  socket.on('availability:changed', (data) => {
    if (availabilityCallback) {
      availabilityCallback(data)
    }
  })

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

// IMPORTANTE: no desconectar el socket, solo desuscribirse de la zona
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

// Util: esperar a que el socket esté conectado y devolver el ID
export function getSocketId() {
  return socket?.id || localStorage.getItem('websocket_socket_id') || null
}