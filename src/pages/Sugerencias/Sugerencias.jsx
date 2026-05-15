import React, { useState, useEffect, useRef } from 'react';
import { suggest } from '../../api/suggest';
import { useAuth } from '../../context/AuthContext';
import './Sugerencias.css';

const Sugerencias = () => {
  const { user } = useAuth();
  const userId = user?.sub;
  const [suggestion, setSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(true);
  const hasFetched = useRef(false);

  const getCurrentDate = () => {
    const today = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

    const dayName = days[today.getDay()];
    const monthName = months[today.getMonth()];
    const day = today.getDate();
    const year = today.getFullYear();

    return `${dayName}, ${monthName} ${String(day).padStart(2, '0')} of ${year}`;
  };

  useEffect(() => {
    if (!userId || hasFetched.current) return;
    hasFetched.current = true;

    const fetchSuggestion = async () => {
      setLoadingSuggestion(true);
      const result = await suggest({
        user_id: parseInt(userId, 10),
        today: new Date().toISOString().slice(0, 10),
      });
      setSuggestion(result);
      setLoadingSuggestion(false);
    };

    fetchSuggestion();
  }, [userId]);

  const renderSuggestion = (text) => {
    return text.split('\n').filter(line => line.trim()).map((line, i) => {
      const parts = line.split(/(\\[^]+\\*)/g);
      const rendered = parts.map((part, j) =>
        part.startsWith('*') && part.endsWith('*')
          ? <strong key={j}>{part.slice(2, -2)}</strong>
          : part
      );
      const isTitle = line.trim().startsWith('**');
      return (
        <p key={i} className={isTitle ? 'info-box-bullet-title' : 'info-box-bullet-text'}>
          {rendered}
        </p>
      );
    });
  };

  return (
    <div className='page-container'>
      <div className='today-info-container'>
        <p className='greeting'>Buenos dias ...</p>
        <p className='date'>{getCurrentDate()}</p>
      </div>
      <div className='suggestions-container'>
        <div className="info-box">
          <p> Aqui se mostrara el mapa que utilizara la ubicacion del usuario para darle sugerencias de ruta</p>
        </div>
        <div className="info-box">
          <p className='info-box-title'>Tus espacios previos</p>
          {loadingSuggestion
            ? <p>Cargando sugerencias...</p>
            : suggestion?.result
              ? renderSuggestion(suggestion.result)
              : <p>No se pudieron obtener sugerencias.</p>
          }
        </div>
        <div className="info-box">
          <p className='info-box-title'>Tipos de espacios recomendados</p>
          {loadingSuggestion
            ? <p>Cargando sugerencias...</p>
            : suggestion?.result
              ? renderSuggestion(suggestion.result)
              : <p>No se pudieron obtener sugerencias.</p>
          }
        </div>
      </div>
    </div>
  )
}

export default Sugerencias