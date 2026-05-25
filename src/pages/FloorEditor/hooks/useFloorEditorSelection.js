import { useCallback, useState } from 'react'

export function useFloorEditorSelection() {
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const selectSingle = useCallback((id) => {
    setSelectedIds(new Set([id]))
  }, [])

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleMarkerSelect = useCallback((id, shiftKey) => {
    if (shiftKey) toggleSelect(id)
    else selectSingle(id)
  }, [selectSingle, toggleSelect])

  const selectMany = useCallback((ids) => {
    setSelectedIds(new Set(ids))
  }, [])

  const removeFromSelection = useCallback((idsToRemove) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of idsToRemove) next.delete(id)
      return next
    })
  }, [])

  const selectedCount = selectedIds.size
  const singleSelectedId = selectedCount === 1 ? [...selectedIds][0] : null

  return {
    selectedIds,
    selectedCount,
    singleSelectedId,
    clearSelection,
    selectSingle,
    toggleSelect,
    handleMarkerSelect,
    selectMany,
    removeFromSelection,
  }
}
