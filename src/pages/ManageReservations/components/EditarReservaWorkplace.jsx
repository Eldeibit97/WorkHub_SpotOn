import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../api/client';
import { getStoredToken } from '../../../api/auth';
import { toYyyyMmDd } from '../../../lib/dateFormat';
import '../../CrearReservacion/CrearReservacion.css';
import './EditarReservaWorkplace.css';
import DateSelector from './DateSelector';
import TimeSelector from '../../CrearReservacion/components/TimeSelector';

function authHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const EditarReservaWorkplace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.sub;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [rawReservation, setRawReservation] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date(),
    horaInicio: '08:00',
    horaSalida: '17:00',
    location: '—',
    reservationId: id ? `WP-${id}` : '—',
  });

  // Fetch the real reservation data on mount
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch(`/api/reservas/consulta?userId=${userId}`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (cancelled) return;

        const list = Array.isArray(data) ? data : [];
        const reservation = list.find((r) => String(r.id_reserva) === String(id));

        if (!reservation) {
          setError('No se encontró la reservación. Puede que ya haya sido cancelada.');
          setLoading(false);
          return;
        }

        setRawReservation(reservation);

        const location =
          [reservation.nombre_espacio, reservation.codigo_espacio].filter(Boolean).join(' - ')
          || [reservation.nombre_zona, reservation.edificio].filter(Boolean).join(' · ')
          || '—';

        setFormData({
          date: reservation.fecha_reserva ? new Date(`${reservation.fecha_reserva.slice(0, 10)}T12:00:00`) : new Date(),
          horaInicio: reservation.hora_inicio?.slice(0, 5) ?? '08:00',
          horaSalida: reservation.hora_fin?.slice(0, 5) ?? '17:00',
          location,
          reservationId: `WP-${id}`,
        });
      } catch {
        if (!cancelled) setError('No se pudo cargar la reservación.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId, id]);

  const handleDateChange = (newDate) =>
    setFormData((prev) => ({ ...prev, date: newDate }));

  const handleTimeChange = (start, end) =>
    setFormData((prev) => ({ ...prev, horaInicio: start, horaSalida: end }));

  const handleSave = async () => {
    if (!rawReservation) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch('/api/reservas/update', {
        method: 'PUT',
        headers: authHeaders(),
        body: {
          id_reserva: rawReservation.id_reserva,
          id_usuario: userId,
          id_espacio: rawReservation.id_espacio,
          fecha_reserva: toYyyyMmDd(formData.date),
          hora_inicio: formData.horaInicio,
          hora_fin: formData.horaSalida,
          estado_reserva: rawReservation.estado_reserva,
          fecha_creacion: rawReservation.fecha_creacion,
          tipo_reserva: rawReservation.tipo_reserva,
        },
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          navigate('/cancelar');
        }, 2000);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.message || `Error ${res.status}: no se pudo actualizar la reservación.`);
      }
    } catch {
      setError('Error de red al actualizar la reservación.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="reservation-container">
      <header className="page-header">
        <div className="page-header-content erw-header-row">
          <div>
            <h1 className="page-title">Modificar Reservación</h1>
            <p className="page-subtitle">Actualiza los detalles de tu reservación existente</p>
          </div>
          <button className="erw-back-btn" onClick={() => navigate('/cancelar')}>
            ← Mis reservaciones
          </button>
        </div>
      </header>

      <div className="edit-page-content">
        <div className="erw-panel">

          <div className="erw-panel-header">
            <span className="erw-id-badge">{formData.reservationId}</span>
            <h3 className="erw-panel-title">Editar Reservación</h3>
          </div>

          {loading ? (
            <div className="erw-loading-state">
              <div className="erw-spinner" />
              <span>Cargando reservación...</span>
            </div>
          ) : (
            <>
              {error && (
                <div className="erw-error-banner">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              {saved && (
                <div className="erw-success-banner">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Cambios guardados correctamente
                </div>
              )}

              {/* Fecha */}
              <div className="erw-section">
                <p className="erw-section-label">Fecha</p>
                <DateSelector
                  selectedDate={formData.date}
                  onDateChange={handleDateChange}
                />
              </div>

              {/* Horario */}
              <div className="erw-section">
                <p className="erw-section-label">Horario</p>
                <div className="erw-time-wrapper">
                  <TimeSelector
                    horaInicio={formData.horaInicio}
                    horaSalida={formData.horaSalida}
                    onTimeChange={handleTimeChange}
                  />
                </div>
              </div>

              {/* Espacio asignado (read-only) */}
              <div className="erw-section">
                <p className="erw-section-label">Espacio asignado</p>
                <div className="erw-location-box">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9.5L12 3l9 6.5" /><path d="M5 9.5V21h14V9.5" />
                  </svg>
                  {formData.location}
                </div>
              </div>

              <button className="erw-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default EditarReservaWorkplace;

