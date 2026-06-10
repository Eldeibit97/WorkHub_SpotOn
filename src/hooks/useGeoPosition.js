import { useState, useEffect } from "react";

const useGeoPosition = (enabled = true) => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    data: null,
    settled: false,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, error: null, data: null, settled: false });
      return;
    }

    setState({ loading: true, error: null, data: null, settled: false });

    if (!("geolocation" in navigator)) {
      setState({ loading: false, error: new Error("Geolocalización no soportada en este navegador"), data: null, settled: true });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setState({
          loading: false,
          error: null,
          data: { key: 'UserPos', coords: { lat: coords.latitude, lng: coords.longitude } },
          settled: true,
        });
      },
      (error) => {
        setState({ loading: false, error, data: null, settled: true });
      }
    );
  }, [enabled]);

  return state;
}

export default useGeoPosition;