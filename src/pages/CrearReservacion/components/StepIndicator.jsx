const STEPS = [
  { id: 1, label: 'Elegir piso' },
  { id: 2, label: 'Reserva tu espacio' },
  { id: 3, label: 'Resumen' },
  { id: 4, label: 'Completado' },
]

export default function StepIndicator({ currentStep, onStepClick, isStepClickable }) {
  return (
    <div className="wizard-steps" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={currentStep}>
      {STEPS.map((s, i) => {
        const isActive = s.id === currentStep
        const isCompleted = s.id < currentStep
        const clickable = Boolean(isStepClickable?.(s.id))
        return (
          <div key={s.id} className="wizard-steps__item">
            <button
              type="button"
              className={`wizard-steps__pill${isActive ? ' wizard-steps__pill--active' : ''}${isCompleted ? ' wizard-steps__pill--done' : ''}${clickable ? ' wizard-steps__pill--clickable' : ''}`}
              onClick={() => clickable && onStepClick?.(s.id)}
              disabled={!clickable}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="wizard-steps__num">{String(s.id).padStart(2, '0')}</span>
              <span className="wizard-steps__label">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <span className="wizard-steps__divider" aria-hidden="true" />}
          </div>
        )
      })}
    </div>
  )
}
