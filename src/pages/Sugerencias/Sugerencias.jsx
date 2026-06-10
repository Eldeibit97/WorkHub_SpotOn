import React, { useState, useEffect, useRef } from 'react';
import { suggest } from '../../api/suggest';
import { useAuth } from '../../context/AuthContext';
import './Sugerencias.css';

const Sugerencias = () => {
  const { user } = useAuth();
  const userId = user?.sub;
  const [suggestion, setSuggestion] = useState({suggestions : []});
  const [suggestionError, setSuggestionError] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(true);
  const hasFetched = useRef(false);

  const getCurrentDate = () => {
    const today = new Date();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    const dayName = days[today.getDay()];
    const monthName = months[today.getMonth()];
    const day = today.getDate();
    const year = today.getFullYear();

    return `${dayName}, ${monthName} ${String(day).padStart(2, '0')} de ${year}`;
  };

  useEffect(() => {
    if (!userId || hasFetched.current) return;
    hasFetched.current = true;

    const rangoFecha = new Date();
    rangoFecha.setDate(rangoFecha.getDate() + 7);
    const fetchSuggestion = async () => {
      setLoadingSuggestion(true);
      const result = await suggest({
        user_id: parseInt(userId, 10),
        today: new Date().toISOString().slice(0, 10),
        rango: rangoFecha.toISOString().slice(0, 10)
      });
      if (!result.result) {
        setSuggestionError(result.message ?? 'No se pudieron cargar las sugerencias');
        setLoadingSuggestion(false);
        return;
      }
      let parsedResult;
      try {
        parsedResult = JSON.parse(result.result);
      } catch {
        setSuggestionError('Respuesta inválida del servicio de sugerencias');
        setLoadingSuggestion(false);
        return;
      }
      setSuggestion(parsedResult);
      setLoadingSuggestion(false);
    };

    fetchSuggestion();
  }, [userId]);

  const renderSuggestionBox = (suggestion) => {
    return (
      <div className="info-box" key={suggestion.box_title}>
        <p className='info-box-title'>{suggestion.box_title}</p>
        <div className="suggestions-list">
          {suggestion.items && suggestion.items.map((item, index) => (
            <div className="suggestion-item" key={index}>
              <h4 className="info-box-bullet-title">{item.item_title}</h4>
              <p className="info-box-bullet-text">{item.item_explanation}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAllSuggestions = (jsonData) => {
    if (!jsonData.suggestions || jsonData.suggestions.length === 0) {
      return (
        <div className="no-suggestions">
          <p>Cargando sugerencias...</p>
        </div>
      );
    }

    return (
      <div className="suggestions-container">
        {jsonData.suggestions.map((suggestion, index) => 
          renderSuggestionBox(suggestion)
        )}
      </div>
    );
  };

  return (
    <div className='page-container'>
      <div className='today-info-container'>
        <p className='greeting'>Buenos dias ...</p>
        <p className='date'>{getCurrentDate()}</p>
      </div>
      {suggestionError
        ? <div className='no-suggestions'><p>{suggestionError}</p></div>
        : renderAllSuggestions(suggestion)
      }
    </div>
  )
}

export default Sugerencias