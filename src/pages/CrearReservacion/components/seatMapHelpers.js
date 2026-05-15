export function isSharedRoomType(tipo) {
  return tipo !== 1
}

export function formatCountdown(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
