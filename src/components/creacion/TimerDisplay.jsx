import React from 'react'

const TimerDisplay = () => {
  return (
    <div className="time-display">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path d="M12 6v6l4 2" strokeWidth="2" />
      </svg>
      {new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}
    </div>
  )
}

export default TimerDisplay