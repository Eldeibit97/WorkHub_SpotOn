import React, { useState } from 'react';
import './TimeSelector.css';
 
const TimeSelector = ({ startTime, endTime, onTimeChange }) => {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
 
  // Generar horas desde 6:00 AM hasta 10:00 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      if (hour < 22) {
        slots.push(`${String(hour).padStart(2, '0')}:30`);
      }
    }
    return slots;
  };
 
  const timeSlots = generateTimeSlots();
 
  const handleStartTimeChange = (time) => {
    onTimeChange(time, endTime);
    setShowStartPicker(false);
  };
 
  const handleEndTimeChange = (time) => {
    onTimeChange(startTime, time);
    setShowEndPicker(false);
  };
 
  return (
    <div className="time-selector">
      <div className="time-input-wrapper">
        <input 
          type="text" 
          className="time-input" 
          value={startTime}
          onClick={() => setShowStartPicker(!showStartPicker)}
          readOnly
        />
        {showStartPicker && (
          <div className="time-picker-dropdown">
            {timeSlots.map((time) => (
              <div
                key={time}
                className={`time-option ${startTime === time ? 'selected' : ''}`}
                onClick={() => handleStartTimeChange(time)}
              >
                {time}
              </div>
            ))}
          </div>
        )}
      </div>
 
      <span className="time-arrow">→</span>
 
      <div className="time-input-wrapper">
        <input 
          type="text" 
          className="time-input" 
          value={endTime}
          onClick={() => setShowEndPicker(!showEndPicker)}
          readOnly
        />
        {showEndPicker && (
          <div className="time-picker-dropdown">
            {timeSlots.map((time) => (
              <div
                key={time}
                className={`time-option ${endTime === time ? 'selected' : ''}`}
                onClick={() => handleEndTimeChange(time)}
              >
                {time}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TimeSelector