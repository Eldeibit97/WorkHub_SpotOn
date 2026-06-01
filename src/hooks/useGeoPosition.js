import { useState, useEffect, useCallback } from "react";

const useGeoPosition = () => {
  const [state, setState] = useState({
    loading: true,
    error: null,
    coords: null
  });

  const onSuccess = useCallback(({ coords }) => {
    setState({
      loading: false,
      error: null,
      coords: {
        key: 'User Pos',
        lat: coords.latitude,
        lng: coords.longitude
      }
    });
  }, []);

  const onError = useCallback((error) => {
    setState({
      loading: false,
      error: error,
      coords: null
    });
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      onError(new Error("Geolocalización no soportada en este navegador"));
      return;
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError);
  }, []);

  return state;
}

export default useGeoPosition;