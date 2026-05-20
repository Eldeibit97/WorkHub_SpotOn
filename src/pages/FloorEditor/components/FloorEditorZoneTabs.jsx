export default function FloorEditorZoneTabs({ zones, zonaId, onChange }) {
  return (
    <div className="fe__zone-tabs" role="tablist" aria-label="Seleccionar piso">
      {zones.map((z) => (
        <button
          key={z.id}
          type="button"
          role="tab"
          aria-selected={zonaId === z.id}
          className={`fe__zone-tab${zonaId === z.id ? ' fe__zone-tab--active' : ''}`}
          onClick={() => onChange(z.id)}
        >
          {z.codigoZona}
        </button>
      ))}
    </div>
  )
}
