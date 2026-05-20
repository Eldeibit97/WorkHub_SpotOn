import { round } from '../floorEditorUtils'

function inputTextValue(value) {
  if (value == null) return ''
  return String(value)
}

function inputNumberValue(value) {
  if (value == null || Number.isNaN(Number(value))) return ''
  return String(value)
}

export default function FloorEditorPropsPanel({
  selectedSpace,
  selectedCount,
  tipoOptions,
  onUpdate,
  onDeleteSelected,
  variant = 'sidebar',
}) {
  const panelClass =
    variant === 'float'
      ? 'fe__props fe__props-float'
      : variant === 'rail'
        ? 'fe__props fe__props--rail'
        : 'fe__section fe__props'

  if (selectedCount === 0) return null

  if (selectedCount > 1) {
    return (
      <section className={panelClass}>
        <div className="fe__section-title">Propiedades</div>
        <p className="fe__multi-select-msg">
          {selectedCount} espacios seleccionados
        </p>
        <button
          type="button"
          className="fe__delete-selected"
          onClick={onDeleteSelected}
        >
          Eliminar seleccionados
        </button>
      </section>
    )
  }

  if (!selectedSpace) return null

  function applyCoord(field, raw) {
    const n = Number(raw)
    onUpdate({ [field]: round(n) })
  }

  return (
    <section className={panelClass}>
      <div className="fe__section-title">Propiedades</div>

      <div className="fe__prop-row">
        <label htmlFor="fe-prop-id">ID Espacio</label>
        <input
          id="fe-prop-id"
          type="number"
          value={inputNumberValue(selectedSpace.id_espacio)}
          onChange={(e) => onUpdate({ id_espacio: Number(e.target.value) })}
        />
      </div>
      <div className="fe__prop-row">
        <label htmlFor="fe-prop-codigo">Código</label>
        <input
          id="fe-prop-codigo"
          type="text"
          value={inputTextValue(selectedSpace.codigo)}
          onChange={(e) => onUpdate({ codigo: e.target.value })}
        />
      </div>
      <div className="fe__prop-row">
        <label htmlFor="fe-prop-nombre">Nombre</label>
        <input
          id="fe-prop-nombre"
          type="text"
          value={inputTextValue(selectedSpace.nombre)}
          onChange={(e) => onUpdate({ nombre: e.target.value })}
        />
      </div>
      <div className="fe__prop-row">
        <label htmlFor="fe-prop-tipo">Tipo</label>
        <select
          id="fe-prop-tipo"
          value={selectedSpace.tipo == null ? '' : String(selectedSpace.tipo)}
          onChange={(e) => onUpdate({ tipo: Number(e.target.value) })}
        >
          {tipoOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="fe__prop-coords">
        <div className="fe__prop-row">
          <label htmlFor="fe-prop-x">X</label>
          <input
            id="fe-prop-x"
            type="number"
            value={inputNumberValue(selectedSpace.x)}
            onChange={(e) => applyCoord('x', e.target.value)}
          />
        </div>
        <div className="fe__prop-row">
          <label htmlFor="fe-prop-y">Y</label>
          <input
            id="fe-prop-y"
            type="number"
            value={inputNumberValue(selectedSpace.y)}
            onChange={(e) => applyCoord('y', e.target.value)}
          />
        </div>

        {selectedSpace.shape === 'circle' ? (
          <div className="fe__prop-row">
            <label htmlFor="fe-prop-r">Radio</label>
            <input
              id="fe-prop-r"
              type="number"
              min="1"
              value={inputNumberValue(selectedSpace.r ?? 6)}
              onChange={(e) => onUpdate({ r: round(Number(e.target.value)) })}
            />
          </div>
        ) : (
          <>
            <div className="fe__prop-row">
              <label htmlFor="fe-prop-w">Ancho</label>
              <input
                id="fe-prop-w"
                type="number"
                min="1"
                value={inputNumberValue(selectedSpace.w ?? 30)}
                onChange={(e) => onUpdate({ w: round(Number(e.target.value)) })}
              />
            </div>
            <div className="fe__prop-row">
              <label htmlFor="fe-prop-h">Alto</label>
              <input
                id="fe-prop-h"
                type="number"
                min="1"
                value={inputNumberValue(selectedSpace.h ?? 30)}
                onChange={(e) => onUpdate({ h: round(Number(e.target.value)) })}
              />
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        className="fe__delete-selected"
        onClick={onDeleteSelected}
      >
        Eliminar espacio
      </button>
    </section>
  )
}
