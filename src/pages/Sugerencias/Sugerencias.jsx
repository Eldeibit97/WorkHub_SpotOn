import React, { useState, useEffect, useRef, useCallback } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { suggest, checkPendingReservation } from '../../api/suggest';
import { useAuth } from '../../context/AuthContext';
import useGeoPosition from '../../hooks/useGeoPosition';
import useRoute from '../../hooks/useRoute';
import MapBox from './components/MapBox';
import './Sugerencias.css';

const OFFICE_COORDS = { lat: 25.670002013961874, lng: -100.37771014077546 };

function SugerenciasContent() {
  const { user } = useAuth();
  const userId = user?.sub;
  const [suggestion, setSuggestion] = useState({ suggestions: [] });
  const [suggestionError, setSuggestionError] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(true);
  const [hasPending, setHasPending] = useState(false);
  const [geoEnabled, setGeoEnabled] = useState(false);
  const [cachedGeoPos, setCachedGeoPos] = useState(null);

  const initDone = useRef(false);
  const pendingSuggestDone = useRef(false);

  const CACHE_KEY = `suggestions_cache_${userId}`;

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

  // Geo position hook — only activated when needed (pending reservation detected)
  const { loading: geoLoading, data: hookGeoPos } = useGeoPosition(geoEnabled);
  const geoPosData = cachedGeoPos ?? (geoEnabled ? hookGeoPos : null);

  // Route hook — only runs when pending=true and geo position is ready
  const routeOrigin = hasPending && geoPosData ? geoPosData.coords : null;
  const { loading: routeLoading, data: routeData } = useRoute(routeOrigin, OFFICE_COORDS);

  const doSuggest = useCallback(async (body, pending, geoPos) => {
    setLoadingSuggestion(true);
    const result = await suggest(body);
    if (!result.result) {
      setSuggestionError(result.message ?? 'No se pudieron cargar las sugerencias');
      setLoadingSuggestion(false);
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(result.result);
    } catch {
      setSuggestionError('Respuesta inválida del servicio de sugerencias');
      setLoadingSuggestion(false);
      return;
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ suggestions: parsed, pending, geoPosData: geoPos }));
    setSuggestion(parsed);
    setLoadingSuggestion(false);
  }, [CACHE_KEY]);

  // ① On mount: restore from cache or start the suggest flow
  useEffect(() => {
    if (!userId || initDone.current) return;
    initDone.current = true;

    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const c = JSON.parse(cached);
        setSuggestion(c.suggestions);
        setHasPending(c.pending ?? false);
        if (c.pending && c.geoPosData) setCachedGeoPos(c.geoPosData); // triggers route re-fetch for map
        pendingSuggestDone.current = true;
        setLoadingSuggestion(false);
        return;
      } catch {
        sessionStorage.removeItem(CACHE_KEY);
      }
    }

    // No cache — check for pending reservation then call LLM
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const rDate = new Date();
      rDate.setDate(rDate.getDate() + 7);
      const rango = rDate.toISOString().slice(0, 10);

      const pending = await checkPendingReservation(parseInt(userId, 10), today, rango);
      setHasPending(pending);

      if (!pending) {
        pendingSuggestDone.current = true;
        await doSuggest(
          { query: '¿Qué días debo ir a la oficina esta semana?', user_id: parseInt(userId, 10) },
          false,
          null
        );
      } else {
        setGeoEnabled(true); // activates geo hook → route hook → effect ② below
      }
    })();
  }, [userId, CACHE_KEY, doSuggest]);

  // ② When pending: wait for geo+route, then call LLM with traffic data
  useEffect(() => {
    if (!hasPending || pendingSuggestDone.current) return;
    if (geoLoading) return;

    if (!geoPosData) {
      // Geo failed — fall back to normal suggest
      pendingSuggestDone.current = true;
      doSuggest(
        { query: '¿Qué días debo ir a la oficina esta semana?', user_id: parseInt(userId, 10) },
        false,
        null
      );
      return;
    }

    if (routeLoading) return;

    pendingSuggestDone.current = true;

    if (routeData) {
      doSuggest(
        {
          query: '¿Cómo está el tráfico para ir a la oficina?',
          user_id: parseInt(userId, 10),
          origin: geoPosData.coords,
          destination: OFFICE_COORDS,
          route: {
            durationMillis: routeData.durationMillis,
            staticDurationMillis: routeData.staticDurationMillis,
            travelAdvisory: routeData.travelAdvisory,
          },
        },
        true,
        geoPosData
      );
    } else {
      // Route failed — fall back to normal suggest
      doSuggest(
        { query: '¿Qué días debo ir a la oficina esta semana?', user_id: parseInt(userId, 10) },
        false,
        null
      );
    }
  }, [hasPending, geoLoading, geoPosData, routeLoading, routeData, userId, doSuggest]);

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

  const renderSuggestionBox = (sugg) => (
    <div className="info-box" key={sugg.box_title}>
      <p className="info-box-title">{sugg.box_title}</p>
      <div className="suggestions-list">
        {sugg.items && sugg.items.map((item, index) => (
          <div className="suggestion-item" key={index}>
            <h4 className="info-box-bullet-title">{item.item_title}</h4>
            <p className="info-box-bullet-text">{item.item_explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAllSuggestions = (jsonData) => {
    if (!jsonData.suggestions || jsonData.suggestions.length === 0) {
      return <div className="no-suggestions"><p>No hay sugerencias disponibles.</p></div>;
    }
    return (
      <div className="suggestions-container">
        {hasPending && <MapBox geoPosData={geoPosData} routeData={routeData} />}
        {jsonData.suggestions.map((s) => renderSuggestionBox(s))}
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="today-info-container">
        <p className="greeting">Buenos dias ...</p>
        <p className="date">{getCurrentDate()}</p>
      </div>
      {loadingSuggestion
        ? renderSkeletonCards()
        : suggestionError
          ? <div className="no-suggestions"><p>{suggestionError}</p></div>
          : renderAllSuggestions(suggestion)
      }
    </div>
  );
}

export default function Sugerencias() {
  return (
    <APIProvider apiKey={import.meta.env.VITE_MAPS_API_KEY}>
      <SugerenciasContent />
    </APIProvider>
  );
}