export function getInitialsFromEmail(mail) {
  if (!mail) return '?'
  const before = mail.split('@')[0]
  const parts = before.split(/[.\-_]+/).filter(Boolean)
  if (parts.length === 0) return mail.charAt(0).toUpperCase()
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function getInitialsFromNames(first, last, fallbackChar = 'U') {
  const a = (first || '').charAt(0).toUpperCase()
  const b = (last || '').charAt(0).toUpperCase()
  const pair = `${a}${b}`
  return pair || fallbackChar
}
