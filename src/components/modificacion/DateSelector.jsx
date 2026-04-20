import React, { useState } from 'react';
import './date_selector.css';
 
const DateSelector = ({ selectedDate, onDateChange }) => {
  const [showCalendar, setShowCalendar] = useState(false);
 
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };
 
  const formatDate = (date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${dayName}, ${monthName} ${String(day).padStart(2, '0')} of ${year}`;
  };
 
  const formatShortDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };
 
  const availableDates = generateDates();
 
  const handleDateSelect = (date) => {
    onDateChange(formatDate(date));
    setShowCalendar(false);
  };
 
  return (
    <div className="date-selector-container">
      <div className="date-selector" onClick={() => setShowCalendar(!showCalendar)}>
        <span>{selectedDate}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
        </svg>
      </div>
 
      {showCalendar && (
        <div className="calendar-dropdown">
          <div className="calendar-header">
            <h4>Select a Date</h4>
            <button className="close-btn" onClick={() => setShowCalendar(false)}>×</button>
          </div>
          <div className="calendar-grid">
            {availableDates.map((date, index) => {
              const isSelected = formatDate(date) === selectedDate;
              const isToday = index === 0;
              
              return (
                <div
                  key={index}
                  className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleDateSelect(date)}
                >
                  <div className="day-name">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="day-number">{date.getDate()}</div>
                  <div className="day-month">{formatShortDate(date)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default DateSelector