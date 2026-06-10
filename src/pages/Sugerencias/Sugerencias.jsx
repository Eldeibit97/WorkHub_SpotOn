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

  const CACHE_KEY = `suggestions_cache_${userId}`;

  useEffect(() => {
    if (!userId || hasFetched.current) return;
    hasFetched.current = true;

    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setSuggestion(JSON.parse(cached));
        setLoadingSuggestion(false);
        return;
      } catch {
        sessionStorage.removeItem(CACHE_KEY);
      }
    }

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
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(parsedResult));
      setSuggestion(parsedResult);
      setLoadingSuggestion(false);
    };

    fetchSuggestion();
  }, [userId, CACHE_KEY]);

  const renderSkeletonCards = () => (
    <div className="suggestions-container">
      {[0, 1, 2].map((i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-line skeleton-title" />
          {[0, 1, 2].map((j) => (
            <div key={j}>
              <div className="skeleton-line skeleton-item-title" />
              <div className="skeleton-line skeleton-item-text" />
              <div className="skeleton-line skeleton-item-text-short" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );

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
      {loadingSuggestion
        ? renderSkeletonCards()
        : suggestionError
          ? <div className='no-suggestions'><p>{suggestionError}</p></div>
          : renderAllSuggestions(suggestion)
      }
    </div>
  )
}

export default Sugerencias