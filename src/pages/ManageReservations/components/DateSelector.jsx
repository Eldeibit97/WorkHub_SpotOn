import React, { useState } from 'react'
import { formatDateChipEs, formatDatePickerLabelEs, isSameLocalDay } from '../../../lib/dateFormat'
import './DateSelector.css'

const DateSelector = ({ selectedDate, onDateChange }) => {
  const [showCalendar, setShowCalendar] = useState(false)

  const generateDates = () => {
    const dates = []
    const today = new Date()

    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }

    return dates
  }

  const availableDates = generateDates()

  const handleDateSelect = (date) => {
    onDateChange(date)
    setShowCalendar(false)
  }

  const getSelectedDateObj = () => {
    if (selectedDate instanceof Date) {
      return selectedDate
    }
    if (selectedDate?.day && selectedDate?.month !== undefined && selectedDate?.year) {
      return new Date(selectedDate.year, selectedDate.month, selectedDate.day)
    }
    return new Date()
  }

  const selectedDateObj = getSelectedDateObj()

  return (
    <div className="date-selector-container">
      <div className="date-selector" onClick={() => setShowCalendar(!showCalendar)}>
        <span>{formatDatePickerLabelEs(selectedDateObj)}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
        </svg>
      </div>

      {showCalendar && (
        <div className="calendar-dropdown">
          <div className="calendar-header">
            <h4>Elegir fecha</h4>
            <button type="button" className="close-btn" onClick={() => setShowCalendar(false)}>×</button>
          </div>
          <div className="calendar-grid">
            {availableDates.map((date, index) => {
              const isSelected = isSameLocalDay(date, selectedDateObj)
              const isToday = index === 0
              return (
                <div
                  key={index}
                  className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleDateSelect(date)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleDateSelect(date)
                  }}
                >
                  <div className="day-name">
                    {date.toLocaleDateString('es-MX', { weekday: 'short' })}
                  </div>
                  <div className="day-number">{date.getDate()}</div>
                  <div className="day-month">{formatDateChipEs(date)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DateSelector
