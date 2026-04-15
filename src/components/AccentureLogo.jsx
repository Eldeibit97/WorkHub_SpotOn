export default function AccentureLogo({ className = '', size = 'default' }) {
  const sizes = {
    small: { width: 120, fontSize: '1.1rem' },
    default: { width: 160, fontSize: '1.5rem' },
    large: { width: 200, fontSize: '1.875rem' },
  }
  const s = sizes[size] || sizes.default

  return (
    <div className={`acn-logo ${className}`} style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0' }}>
      <span style={{
        fontSize: s.fontSize,
        fontWeight: 700,
        color: '#FFFFFF',
        letterSpacing: '-0.02em',
        lineHeight: 1,
        position: 'relative',
      }}>
        <span style={{
          position: 'absolute',
          top: '-0.55em',
          left: '5.1em',
          color: '#A100FF',
          fontSize: '0.75em',
          fontWeight: 900,
        }}>{'>'}</span>
        accenture
      </span>
    </div>
  )
}
