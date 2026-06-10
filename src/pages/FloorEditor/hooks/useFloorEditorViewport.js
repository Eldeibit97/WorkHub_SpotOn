import { useCallback, useEffect, useRef, useState } from 'react'
import { parseViewBox, SVG_H, SVG_W, ZOOM_MAX, ZOOM_MIN } from '../floorEditorUtils'

export function useFloorEditorViewport({ svgW = SVG_W, svgH = SVG_H, viewBox } = {}) {
  const canvasWrapRef = useRef(null)
  const [zoom, setZoomState] = useState(1)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef(null)

  const clampZoom = useCallback((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)), [])

  const setZoom = useCallback((valueOrFn) => {
    setZoomState((prev) => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn
      return clampZoom(+next.toFixed(3))
    })
  }, [clampZoom])

  const setZoomAtPoint = useCallback((newZoom, clientX, clientY) => {
    const wrap = canvasWrapRef.current
    if (!wrap) {
      setZoom(newZoom)
      return
    }
    const rect = wrap.getBoundingClientRect()
    const offsetX = clientX - rect.left + wrap.scrollLeft
    const offsetY = clientY - rect.top + wrap.scrollTop
    const ratio = newZoom / zoom

    setZoomState(clampZoom(+newZoom.toFixed(3)))

    requestAnimationFrame(() => {
      wrap.scrollLeft = offsetX * ratio - (clientX - rect.left)
      wrap.scrollTop = offsetY * ratio - (clientY - rect.top)
    })
  }, [clampZoom, zoom])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    if (spaceHeld || isPanning) return
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = clampZoom(zoom + delta * zoom)
    setZoomAtPoint(newZoom, e.clientX, e.clientY)
  }, [clampZoom, isPanning, setZoomAtPoint, spaceHeld, zoom])

  const fitToScreen = useCallback(() => {
    const wrap = canvasWrapRef.current
    if (!wrap) return
    const { w, h } = parseViewBox(viewBox, svgW, svgH)
    const pad = 48
    const availW = wrap.clientWidth - pad
    const availH = wrap.clientHeight - pad
    const fitScale = clampZoom(Math.min(availW / w, availH / h, 1))
    setZoomState(fitScale)
    requestAnimationFrame(() => {
      wrap.scrollLeft = Math.max(0, (w * fitScale - wrap.clientWidth) / 2)
      wrap.scrollTop = Math.max(0, (h * fitScale - wrap.clientHeight) / 2)
    })
  }, [clampZoom, svgH, svgW, viewBox])

  useEffect(() => {
    const wrap = canvasWrapRef.current
    if (!wrap) return
    wrap.addEventListener('wheel', handleWheel, { passive: false })
    return () => wrap.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT'
        && document.activeElement?.tagName !== 'SELECT'
        && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        setSpaceHeld(true)
      }
    }
    function onKeyUp(e) {
      if (e.code === 'Space') {
        setSpaceHeld(false)
        setIsPanning(false)
        panStartRef.current = null
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  const handleCanvasPointerDown = useCallback((e) => {
    const isMiddle = e.button === 1
    if (!spaceHeld && !isMiddle) return
    e.preventDefault()
    const wrap = canvasWrapRef.current
    if (!wrap) return
    setIsPanning(true)
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: wrap.scrollLeft,
      scrollTop: wrap.scrollTop,
    }
    wrap.setPointerCapture(e.pointerId)
  }, [spaceHeld])

  const handleCanvasPointerMove = useCallback((e) => {
    const start = panStartRef.current
    const wrap = canvasWrapRef.current
    if (!start || !wrap || !isPanning) return
    e.preventDefault()
    wrap.scrollLeft = start.scrollLeft - (e.clientX - start.x)
    wrap.scrollTop = start.scrollTop - (e.clientY - start.y)
  }, [isPanning])

  const handleCanvasPointerUp = useCallback((e) => {
    if (!isPanning) return
    setIsPanning(false)
    panStartRef.current = null
    canvasWrapRef.current?.releasePointerCapture(e.pointerId)
  }, [isPanning])

  const canvasCursor = isPanning ? 'grabbing' : spaceHeld ? 'grab' : undefined

  return {
    canvasWrapRef,
    zoom,
    setZoom,
    setZoomAtPoint,
    fitToScreen,
    spaceHeld,
    isPanning,
    canvasCursor,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
  }
}
