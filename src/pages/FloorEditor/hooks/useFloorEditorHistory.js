import { useCallback, useRef, useState } from 'react'
import { cloneSpaces, HISTORY_MAX } from '../floorEditorUtils'

export function useFloorEditorHistory(initialSpaces) {
  const [spaces, setSpacesState] = useState(() => cloneSpaces(initialSpaces))
  const undoStackRef = useRef([])
  const redoStackRef = useRef([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const syncFlags = useCallback(() => {
    setCanUndo(undoStackRef.current.length > 0)
    setCanRedo(redoStackRef.current.length > 0)
  }, [])

  const setSpaces = useCallback((updater) => {
    setSpacesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return cloneSpaces(next)
    })
  }, [])

  const resetHistory = useCallback((newSpaces) => {
    undoStackRef.current = []
    redoStackRef.current = []
    setSpacesState(cloneSpaces(newSpaces))
    syncFlags()
  }, [syncFlags])

  const pushHistory = useCallback((snapshotBefore) => {
    undoStackRef.current = [
      ...undoStackRef.current.slice(-(HISTORY_MAX - 1)),
      cloneSpaces(snapshotBefore),
    ]
    redoStackRef.current = []
    syncFlags()
  }, [syncFlags])

  const commitSpaces = useCallback((snapshotBefore, nextSpaces) => {
    if (JSON.stringify(snapshotBefore) === JSON.stringify(nextSpaces)) return
    pushHistory(snapshotBefore)
    setSpacesState(cloneSpaces(nextSpaces))
  }, [pushHistory])

  const undo = useCallback(() => {
    const prev = undoStackRef.current.pop()
    if (!prev) return
    setSpacesState((current) => {
      redoStackRef.current.push(cloneSpaces(current))
      return cloneSpaces(prev)
    })
    syncFlags()
  }, [syncFlags])

  const redo = useCallback(() => {
    const next = redoStackRef.current.pop()
    if (!next) return
    setSpacesState((current) => {
      undoStackRef.current.push(cloneSpaces(current))
      return cloneSpaces(next)
    })
    syncFlags()
  }, [syncFlags])

  return {
    spaces,
    setSpaces,
    resetHistory,
    pushHistory,
    commitSpaces,
    undo,
    redo,
    canUndo,
    canRedo,
  }
}
