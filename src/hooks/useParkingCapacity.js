/**
 * useParkingCapacidad.js
 *
 * Hook para la pantalla de registro de estacionamiento.
 * Maneja dos responsabilidades:
 *   1. Cargar y mostrar la capacidad actual por zona (HTTP)
 *   2. Escuchar cambios en tiempo real via WebSocket
 *
 * Uso:
 *   const { zonas, loading, error, reservar, reservando } = useParkingCapacidad({ fecha, horaInicio, horaFin })
 *
 * Para reservar:
 *   const resultado = await reservar({ mail, fechaReserva, horaInicio, horaSalida })
 *   if (!resultado.ok) mostrarError(resultado.error)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '../api/client'
import { getStoredToken } from '../api/auth'
import {
  connectWebSocket,
  onParkingEvent,
  subscribeToParkingZona,
  unsubscribeFromParkingZona,
} from '../api/websocket'

export function useParkingCapacidad({ fecha, horaInicio, horaFin }) {
  const [zonas, setZonas] = useState([])      // [{ id_zona, nombre_zona, total, ocupados, disponibles }]
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reservando, setReservando] = useState(false)

  // Guardar qué zonas tenemos suscritas para hacer cleanup correcto
  const suscritasRef = useRef([])

  // ── 1. Carga inicial de capacidad ─────────────────────────────────────────
  useEffect(() => {
    if (!fecha || !horaInicio || !horaFin) return

    let cancelled = false
    setLoading(true)
    setError(null)

    async function cargar() {
      try {
        const token = getStoredToken()
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const params = new URLSearchParams({ fecha, horaInicio, horaFin })
        const res = await apiFetch(`/api/parking/capacidad?${params}`, { headers: headers })

        if (!res.ok) throw new Error('Error al cargar capacidad')
        const data = await res.json()
        if (!cancelled) setZonas(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    cargar()
    return () => { cancelled = true }
  }, [fecha, horaInicio, horaFin])

  // ── 2. WebSocket: suscribirse a cada zona al recibirlas ───────────────────
  useEffect(() => {
    if (!zonas.length) return

    // Asegurar conexión
    connectWebSocket(() => {})

    // Suscribirse a las zonas que acabamos de cargar
    const ids = zonas.map((z) => z.id_zona)
    ids.forEach(subscribeToParkingZona)
    suscritasRef.current = ids

    // Listener: cuando llegue un cambio, actualizar solo la zona afectada
    const off = onParkingEvent('parking:occupancy-changed', (wsData) => {
      setZonas((prev) =>
        prev.map((z) =>
          z.id_zona === wsData.id_zona
            ? { ...z, ocupados: wsData.ocupados, disponibles: wsData.disponibles, total: wsData.total }
            : z
        )
      )
    })

    return () => {
      off()
      suscritasRef.current.forEach(unsubscribeFromParkingZona)
      suscritasRef.current = []
    }
  }, [zonas.length]) // solo cuando cambia el número de zonas, no en cada render

  // ── 3. Función para reservar ──────────────────────────────────────────────
  // Recibe los mismos campos que el endpoint /api/reservarEstacionamiento espera:
  // { mail, fechaReserva, horaInicio, horaSalida }
  const reservar = useCallback(async (datosReserva) => {
    setReservando(true)
    try {
      const token = getStoredToken()
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      const res = await apiFetch('/api/reservarEstacionamiento', {
        method: 'POST',
        headers : headers,
        body : datosReserva,
      })

      // El endpoint responde con texto o JSON según tu implementación
      const texto = await res.text()
      const data = texto ? JSON.parse(texto) : null

      if (!res.ok) {
        // 409 = sin espacios disponibles, otros = error general
        return { ok: false, error: data?.error || 'Error al reservar' }
      }

      return { ok: true, data: data[0] }
    } catch (err) {
      return { ok: false, error: 'Error de conexión' }
    } finally {
      setReservando(false)
    }
  }, []) // sin dependencias — los datos vienen como argumentos, no del closure

  return { zonas, loading, error, reservar, reservando }
}