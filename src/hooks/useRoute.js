import { useState, useEffect } from "react";

const useRoute = (origin, destination) => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    data: null
  });

  useEffect(() => {
    if (!origin || !destination) return;
    async function fetchRoute() {
      setState({ loading: true, error: null, data: null });
      console.log('loading route')
      try {
        const { Route } = await google.maps.importLibrary('routes');

        const request = {
          origin: origin,
          destination: destination,
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
        console.log('Finalizing route loading');
        setState({loading: false, error: null, data: routes[0]});
      } catch(error){
        console.log('Error: ', error);
        setState({loading: false, error: error, data: null});
      };
    }
    fetchRoute();
  }, [origin]);

  return state;
};

export default useRoute