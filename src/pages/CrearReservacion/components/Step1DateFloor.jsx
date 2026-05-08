import { useEffect, useState } from 'react'
import { getZonas, getFloorMap } from '../../../api/spaces'
import FLOOR_INTERIOR_IMAGES from '../../../assets/floors/index.js'
import './Step1DateFloor.css'

export default function Step1DateFloor({ data, update, onNext, canContinue }) {
  const [zonas, setZonas] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const zs = await getZonas()
      if (cancelled) return
      const sorted = [...zs].sort((a, b) => a.id_zona - b.id_zona)
      setZonas(sorted)
      const result = {}
      await Promise.all(
        sorted.map(async (z) => {
          const map = await getFloorMap(z.id_zona)
          result[z.id_zona] = map.spaces?.length ?? 0
        }),
      )
      if (!cancelled) {
        setCounts(result)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="step1">
      <header className="step1__header">
        <h2 className="step1__title">¿En qué planta quieres trabajar?</h2>
        <p className="step1__subtitle">
          Elige una planta. En el siguiente paso podrás elegir fecha, horario y tu lugar exacto sobre el plano.
        </p>
      </header>

      <div className="step1__grid">
        <section className="step1__panel">
          <div className="step1__panel-title">
            <span className="step1__panel-num">01</span>
            <h3>Elegir Piso</h3>
          </div>

          <div className="step1__floors">
            {loading && (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="floor-card floor-card--skeleton" />
                ))}
              </>
            )}

            {!loading && zonas.map((z) => {
              const isSelected = data.zonaId === z.id_zona
              const thumb = FLOOR_INTERIOR_IMAGES[z.id_zona]
              return (
                <button
                  key={z.id_zona}
                  type="button"
                  className={`floor-card${isSelected ? ' floor-card--selected' : ''}`}
                  onClick={() => update({ zonaId: z.id_zona })}
                >
                  <div className="floor-card__thumb">
                    {thumb && (
                      <img
                        src={thumb}
                        alt={`Vista ${z.descripcion}`}
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="floor-card__body">
                    <div className="floor-card__codigo">{z.nombre_zona}</div>
                    <div className="floor-card__name">{z.descripcion}</div>
                    <div className="floor-card__meta">
                      <span>{z.edificio}</span>
                      <span className="floor-card__count">
                        {counts[z.id_zona] ?? '—'} espacios
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="floor-card__check" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      </div>

      <div className="wiz-actions wiz-actions--end">
        <button
          type="button"
          className="wiz-btn wiz-btn--primary"
          onClick={onNext}
          disabled={!canContinue}
        >
          Continuar
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  )
}
