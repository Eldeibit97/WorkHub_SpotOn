import React from 'react'
import { formatDateLongEsMx } from '../../lib/dateFormat'
import './Sugerencias.css'

const Sugerencias = () => {
  const todayLabel = formatDateLongEsMx(new Date())

  useEffect(() => {
    if (!userId || hasFetched.current) return;
    hasFetched.current = true;

    const fetchSuggestion = async () => {
      setLoadingSuggestion(true);
      const result = await suggest({
        query: '¿Que me sugieres reservar en la proxima semana basado en mis preferencias? Da opciones variadas',
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
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, j) =>
        part.startsWith('**') && part.endsWith('**')
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
    <div className="page-container">
      <div className="today-info-container">
        <p className="greeting">Buenos dias ...</p>
        <p className="date">{todayLabel}</p>
      </div>
      <div className="suggestions-container">
        <div className="info-box">
          <p> Aqui se mostrara el mapa que utilizara la ubicacion del usuario para darle sugerencias de ruta</p>
        </div>
        <div className="info-box">
          <p className="info-box-title">Sobre tu ruta...</p>
          <p className="info-box-text">ETA </p>
          <p> Al realizar la conexion con el servicio de IA que creamos la informacion se desplegara aqui</p>
        </div>
        <div className="info-box">
          <p className='info-box-title'>Sugerencias para tu salida</p>
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
