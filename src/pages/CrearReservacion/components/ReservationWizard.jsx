import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import {
  reservarBatch,
  toBatchReservaItem,
  parseBatchCreateResponse,
  isPlausibleDbEspacioId,
  liberarEspaciosTemporal,
} from '../../../api/reserve'
import { toYyyyMmDd } from '../../../lib/dateFormat'
import StepIndicator from './StepIndicator'
import Step1DateFloor from './Step1DateFloor'
import Step2SeatMap from './Step2SeatMap'
import Step3Summary from './Step3Summary'
import Step4Done from './Step4Done'
import './ReservationWizard.css'

function todayAt(hour, minute = 0) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d
}

function batchTipoForApi(tipoReservaProp) {
  if (tipoReservaProp === 'ESTACIONAMIENTO') return 'ESTACIONAMIENTO'
  return 'INDIVIDUAL'
}

const EDIT_DRAFT_KEY = 'workhub_reservation_edit_draft'
const EDIT_SESSION_KEY = 'workhub_reservation_edit_mode'
const EDIT_STEP_KEY = 'workhub_reservation_edit_step'

function readEditModeFromUrlOrStorage() {
  if (typeof window === 'undefined') return false
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('edit') === '1') {
      sessionStorage.setItem(EDIT_SESSION_KEY, '1')
      return true
    }
    return sessionStorage.getItem(EDIT_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function readDraftFromStorage() {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(EDIT_DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function makeInitialData(editMode) {
  const base = {
    fecha: todayAt(0, 0),
    horaInicio: '08:00',
    horaFin: '13:00',
    zonaId: null,
    selectedSpaces: [],
    coworkers: [],
    createdReservations: [],
  }
  if (!editMode) return base
  const draft = readDraftFromStorage()
  let zonaFromQuery = null
  try {
    const params = new URLSearchParams(window.location.search)
    const z = Number(params.get('zona') || '')
    if (Number.isFinite(z) && z > 0) zonaFromQuery = z
  } catch {
    // ignore
  }
  return {
    ...base,
    fecha: draft?.fecha ? new Date(draft.fecha) : base.fecha,
    horaInicio: draft?.horaInicio || base.horaInicio,
    horaFin: draft?.horaFin || base.horaFin,
    zonaId: draft?.zonaId ?? zonaFromQuery ?? 3,
  }
}

function makeInitialStep(editMode) {
  if (!editMode) return 1
  try {
    const stored = Number(sessionStorage.getItem(EDIT_STEP_KEY))
    if (Number.isFinite(stored) && stored >= 2 && stored <= 3) return stored
  } catch {
    // ignore
  }
  return 2
}

export default function ReservationWizard({ tipoReserva = 'OFICINA' }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [editMode] = useState(readEditModeFromUrlOrStorage)
  const [step, setStep] = useState(() => makeInitialStep(editMode))
  const [data, setData] = useState(() => makeInitialData(editMode))
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [blockedSpaces, setBlockedSpaces] = useState(null) // Rastrear espacios bloqueados

  const canGoToStep2 = useMemo(() => {
    return data.zonaId != null && Number.isFinite(Number(data.zonaId))
  }, [data.zonaId])

  const canGoToStep3 = data.selectedSpaces.length > 0

  // Persist edit-mode draft so refreshes keep zona/fecha/horario.
  useEffect(() => {
    if (!editMode) return
    try {
      const draft = {
        fecha: data.fecha instanceof Date ? data.fecha.toISOString() : new Date(data.fecha).toISOString(),
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        zonaId: data.zonaId,
      }
      sessionStorage.setItem(EDIT_DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // ignore storage errors
    }
  }, [editMode, data.fecha, data.horaInicio, data.horaFin, data.zonaId])

  // Persist current step in edit mode so refresh stays where you are.
  useEffect(() => {
    if (!editMode) return
    try {
      sessionStorage.setItem(EDIT_STEP_KEY, String(step))
    } catch {
      // ignore storage errors
    }
  }, [editMode, step])

  // Liberar espacios SOLO cuando vuelve de Step 3 (atrás) o se desmonta definitivamente
  useEffect(() => {
    // Si el usuario está en Step 3, el bloqueo debe mantenerse
    // Si vuelve atrás FROM Step 3, liberar
    if (step < 3 && blockedSpaces && blockedSpaces.length > 0 && data.zonaId) {
      const handleRelease = async () => {
        try {
          const socketId = localStorage.getItem('websocket_socket_id')
          await liberarEspaciosTemporal(blockedSpaces, data.zonaId, socketId)
          if (import.meta.env.DEV && sessionStorage.getItem('DEBUG_RESERVATION')) {
            console.log('[ReservationWizard] Espacios bloqueados liberados al volver de Step 3')
          }
        } catch (err) {
          console.error('[ReservationWizard] Error liberando espacios:', err)
        }
      }
      handleRelease()
    }
  }, [step, blockedSpaces, data.zonaId])

  // Auto-release on unmount (navegación a otra página) y cierre de pestaña
  useEffect(() => {
    // Handler para beforeunload (cierre de pestaña/navegador)
    const handleBeforeUnload = () => {
      if (blockedSpaces && blockedSpaces.length > 0 && data.zonaId) {
        const socketId = localStorage.getItem('websocket_socket_id')
        const payload = JSON.stringify({
          espacios: blockedSpaces,
          zonaId: data.zonaId,
          socketId
        })
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5500'
        const endpoint = `${apiUrl}/api/reservas/liberar-temporal`
        
        // Intentar con sendBeacon (confiable para cierre de pestaña)
        const beaconSuccessful = navigator.sendBeacon(endpoint, payload)
        
        if (import.meta.env.DEV && sessionStorage.getItem('DEBUG_RESERVATION')) {
          console.log('[ReservationWizard] beforeunload: sendBeacon', beaconSuccessful ? 'exitoso' : 'falló', endpoint)
        }
        
        // Si sendBeacon falla, intentar con fetch (pero probablemente no se enviará si la página cierra)
        if (!beaconSuccessful) {
          try {
            fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload,
              keepalive: true // Importante para que se envíe incluso si la página se cierra
            }).catch(() => {
              // Silent fail - no hay tiempo para esperar en beforeunload
            })
          } catch {
            // Silent fail
          }
        }
      }
    }

    // Agregar listener para beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup: remover listener y liberar si se desmonta sin cerrar pestaña
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      
      // Liberar al desmontar (navegación a otra página)
      if (blockedSpaces && blockedSpaces.length > 0 && data.zonaId) {
        const socketId = localStorage.getItem('websocket_socket_id')
        liberarEspaciosTemporal(blockedSpaces, data.zonaId, socketId).catch((err) => {
          console.error('[ReservationWizard] Error al desmontar:', err)
        })
        if (import.meta.env.DEV && sessionStorage.getItem('DEBUG_RESERVATION')) {
          console.log('[ReservationWizard] unmount: liberados espacios al navegar a otra página')
        }
      }
    }
  }, [blockedSpaces, data.zonaId])

  const update = useCallback((patch) => {
    setData((prev) => ({ ...prev, ...patch }))
  }, [])

  const goNext = useCallback(() => setStep((s) => Math.min(4, s + 1)), [])
  const goBack = useCallback(
    () => setStep((s) => (editMode ? Math.max(2, s - 1) : Math.max(1, s - 1))),
    [editMode],
  )
  const goToStep = useCallback((n) => setStep(() => n), [])

  const isStepClickable = useCallback((targetStep) => {
    // Nunca navegable desde completado; y no permitir pasos futuros.
    if (step === 4) return false
    if (targetStep >= step) return false
    // Mantener restricción de modo edición: no regresar a paso 1.
    if (editMode && targetStep < 2) return false
    return targetStep >= 1 && targetStep <= 3
  }, [step, editMode])

  const handleStepIndicatorClick = useCallback((targetStep) => {
    if (!isStepClickable(targetStep)) return
    if (targetStep === 1) {
      const confirmed = window.confirm(
        'Si regresas a "01 Elegir piso", tus cambios actuales no serán guardados. ¿Deseas continuar?',
      )
      if (!confirmed) return
    }
    goToStep(targetStep)
  }, [goToStep, isStepClickable])

  const handleConfirm = useCallback(async () => {
    setSubmitting(true)
    setSubmitError('')
    const fechaReserva = toYyyyMmDd(data.fecha)
    const bookerMail = user?.correo_institucional || user?.correo || ''
    const apiTipo = batchTipoForApi(tipoReserva)

    const allPeople = [bookerMail, ...data.coworkers.map((c) => c.email)]
    const sharedRoomSelection = data.selectedSpaces.find((s) => s.sharedForAll)

    const mapAssigneeToItem = (id_espacio, assignee) =>
      toBatchReservaItem({
        id_espacio,
        fechaReserva,
        horaInicio: data.horaInicio,
        horaSalida: data.horaFin,
        tipoReserva: apiTipo,
        mail: assignee || bookerMail,
        observaciones:
          assignee !== bookerMail
            ? `Reserva creada por ${bookerMail} para ${assignee}`
            : 'Reserva creada por wizard',
      })

    const items = sharedRoomSelection
      ? allPeople.map((assignee) => mapAssigneeToItem(sharedRoomSelection.id_espacio, assignee))
      : data.selectedSpaces.map((sel, i) => {
          const assignee = allPeople[i] || bookerMail
          return mapAssigneeToItem(sel.id_espacio, assignee)
        })

    const badId = items.find((it) => !isPlausibleDbEspacioId(it.idEspacio))
    if (badId) {
      setSubmitError(
        'Cada reserva debe usar el id real de espacio (tabla Espacio en la base de datos). ' +
          'Si el plano muestra identificadores temporales, el servidor debe exponer GET /api/spaces ' +
          'con id_espacio y codigo alineados al mapa, o hay que corregir los datos del piso.',
      )
      setSubmitting(false)
      return
    }

    try {
      const res = await reservarBatch(items)
      if (res.ok) {
        const created = parseBatchCreateResponse(res.data, items)
        update({
          createdReservations:
            created.length > 0
              ? created
              : items.map((it, i) => ({
                  id_reserva: `local-${Date.now()}-${i}`,
                  id_espacio: it.idEspacio,
                  estado: 'PENDIENTE',
                })),
        })
        // Limpiar espacios bloqueados tras confirmación exitosa
        setBlockedSpaces(null)
        goNext()
      } else {
        setSubmitError(
          res.data?.message ||
            (res.data?.conflictos
              ? `Conflictos: ${res.data.conflictos.map((c) => c.razon ?? c).join(', ')}`
              : `Error ${res.status}`),
        )
      }
    } catch (err) {
      setSubmitError(err?.message || 'Error de red al confirmar la reserva')
    } finally {
      setSubmitting(false)
    }
  }, [data, user, tipoReserva, goNext, update])

  const handleStartOver = useCallback(() => {
    setBlockedSpaces(null) // Limpiar espacios bloqueados
    setData(makeInitialData(editMode))
    setStep(editMode ? 2 : 1)
  }, [editMode])

  const handleExitEditMode = useCallback(() => {
    try {
      sessionStorage.removeItem(EDIT_SESSION_KEY)
      sessionStorage.removeItem(EDIT_DRAFT_KEY)
      sessionStorage.removeItem(EDIT_STEP_KEY)
    } catch {
      // ignore
    }
    window.location.href = '/reservar'
  }, [])

  return (
    <div className="wizard">
      {editMode && (
        <div className="wizard__edit-banner">
          <span>
            Modo edición de coordenadas activo · siempre abre en Paso 2 · refresca cuando quieras.
          </span>
          <button type="button" className="wizard__edit-banner-btn" onClick={handleExitEditMode}>
            Salir del modo edición
          </button>
        </div>
      )}

      <StepIndicator
        currentStep={step}
        onStepClick={handleStepIndicatorClick}
        isStepClickable={isStepClickable}
      />

      <div className="wizard__body">
        {step === 1 && (
          <Step1DateFloor
            data={data}
            update={update}
            onNext={() => canGoToStep2 && goNext()}
            canContinue={canGoToStep2}
          />
        )}
        {step === 2 && (
          <Step2SeatMap
            data={data}
            update={update}
            editMode={editMode}
            onBack={goBack}
            onNext={() => canGoToStep3 && goNext()}
            canContinue={canGoToStep3}
            bookerMail={user?.correo_institucional || user?.correo || ''}
            bookerName={`${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Tú'}
            onBlockSpaces={setBlockedSpaces}
          />
        )}
        {step === 3 && (
          <Step3Summary
            data={data}
            tipoReserva={tipoReserva}
            bookerName={`${user?.nombre || ''} ${user?.apellido || ''}`.trim() || 'Tú'}
            onBack={goBack}
            onConfirm={handleConfirm}
            submitting={submitting}
            error={submitError}
          />
        )}
        {step === 4 && (
          <Step4Done
            data={data}
            onHome={() => navigate('/sugerencias')}
            onAnother={handleStartOver}
          />
        )}
      </div>
    </div>
  )
}
