import React, { useMemo } from 'react';
import { labelForTipo, normalizeTipoEspacio } from '../../../lib/spaceTipo';
import './SpaceTypeFilter.css';

function deriveTypes(spaces, availability) {
  const map = new Map();
  for (const s of spaces) {
    const key = normalizeTipoEspacio(s.tipo);
    const label = labelForTipo(s.tipo);
    if (!map.has(key)) {
      map.set(key, { tipo: key, label, total: 0, disponibles: 0 });
    }
    const entry = map.get(key);
    entry.total++;
    const av = availability[s.id_espacio] || 'DISPONIBLE';
    if (av === 'DISPONIBLE') entry.disponibles++;
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

const TYPE_ICONS = {
  escritorio: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="14" width="20" height="2" rx="1" /><rect x="6" y="4" width="12" height="10" rx="1" /><line x1="8" y1="20" x2="8" y2="16" /><line x1="16" y1="20" x2="16" y2="16" /></svg>
  ),
  sala: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="11" rx="2" /><path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" /><line x1="8" y1="18" x2="8" y2="21" /><line x1="16" y1="18" x2="16" y2="21" /></svg>
  ),
  cubiculo: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h8v8H3z" /><path d="M13 3h8v8h-8z" /><path d="M3 13h8v8H3z" /><path d="M13 13h8v8h-8z" /></svg>
  ),
  default: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" /></svg>
  ),
};

function getIcon(tipo) {
  // Aseguramos que 'tipo' sea tratado como string antes de usar toLowerCase
  if (tipo === null || tipo === undefined) return TYPE_ICONS.default;
  
  const t = String(tipo).toLowerCase();
  
  if (t.includes('sala') || t.includes('junta') || t.includes('reuni')) return TYPE_ICONS.sala;
  if (t.includes('cubiculo') || t.includes('cubículo') || t.includes('privado')) return TYPE_ICONS.cubiculo;
  if (t.includes('escritorio') || t.includes('puesto') || t.includes('desk')) return TYPE_ICONS.escritorio;
  return TYPE_ICONS.default;
}

export default function SpaceTypeFilter({ spaces = [], availability = {}, activeTypes = [], onChange }) {
  const types = useMemo(() => deriveTypes(spaces, availability), [spaces, availability]);
  
  if (types.length < 2) return null;

  const allSelected = activeTypes.length === 0;

  function toggleType(tipo) {
    if (activeTypes.includes(tipo)) {
      onChange(activeTypes.filter((t) => t !== tipo));
    } else {
      onChange([...activeTypes, tipo]);
    }
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div className="space-filter" role="group" aria-label="Filtrar por tipo de espacio">
      <span className="space-filter__label">Tipo</span>
      <div className="space-filter__chips">
        <button
          type="button"
          className={`space-filter__chip${allSelected ? ' space-filter__chip--active' : ''}`}
          onClick={clearAll}
        >
          <span className="space-filter__chip-text">Todos</span>
          <span className="space-filter__chip-count">{spaces.length}</span>
        </button>

        {types.map(({ tipo, label, total }) => {
          const isActive = activeTypes.includes(tipo);
          return (
            <button
              key={tipo}
              type="button"
              className={`space-filter__chip space-filter__chip--tipo-${tipo}${isActive ? ' space-filter__chip--active' : ''}`}
              onClick={() => toggleType(tipo)}
            >
              <span className="space-filter__chip-icon">{getIcon(tipo)}</span>
              <span className="space-filter__chip-text">{label}</span>
              <span className="space-filter__chip-count">{total}</span>
            </button>
          );
        })}
      </div>
      
      {!allSelected && (
        <button type="button" className="space-filter__clear" onClick={clearAll}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          Limpiar
        </button>
      )}
    </div>
  );
}