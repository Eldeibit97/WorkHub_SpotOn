import { useState, useEffect } from "react";
import { useApiIsLoaded } from "@vis.gl/react-google-maps";

const useRoute = (origin, destination) => {
  const apiLoaded = useApiIsLoaded();
  const [state, setState] = useState({
    loading: false,
    error: null,
    data: null,
    settled: false,
  });

  useEffect(() => {
    if (!origin || !destination || !apiLoaded) return;
    async function fetchRoute() {
      setState({ loading: true, error: null, data: null, settled: false });
      try {
        const { Route } = await google.maps.importLibrary('routes');
        const request = {
          origin,
          destination,
          travelMode: 'DRIVING',
          routingPreference: 'TRAFFIC_AWARE',
          extraComputations: ['TRAFFIC_ON_POLYLINE'],
          fields: [
            'distanceMeters',
            'durationMillis',
            'staticDurationMillis',
            'speedPaths',
            'travelAdvisory'
          ]
        };
        const { routes } = await Route.computeRoutes(request);
        setState({ loading: false, error: null, data: routes[0], settled: true });
      } catch (error) {
        console.log('Error: ', error);
        setState({ loading: false, error, data: null, settled: true });
      }
    }
    fetchRoute();
  }, [origin, apiLoaded]);

  return state;
};

export default useRoute