import React, { useEffect } from 'react'
import useGeoPosition from '../../../hooks/useGeoPosition'
import useRoute from '../../../hooks/useRoute'
import { APIProvider, Map } from '@vis.gl/react-google-maps'
import MapContent from './MapContent'
import '../sugerencias.css'
import './mapbox.css'

const MapBox = () => {
  const officeData = {
    key: 'AccentureOffice',
    coords: {
      lat: 25.670002013961874,
      lng: -100.37771014077546
    }
  };
  const { loading: geoPosLoading, error: geoPosError, data: geoPosData } = useGeoPosition();
  const { loading: routeLoading, error: routeError, data: routeData } = useRoute(geoPosData?.coords, officeData.coords);

  if (geoPosLoading || routeLoading) {
    return (
      <div>
        <p>{routeLoading ? 'Encontrando Ubicación' : 'Trazando ruta'}</p>
      </div>
    );
  }
  if (geoPosError || routeError) {
    console.log('Geo position error ',geoPosError);
    console.log('Route tracing error', routeError);
    return (
      <div>
        <p> {geoPosError ? 'No se pudo cargar tu posición' : 'No se pudo trazar la ruta'}, intentalo de nuevo despues {geoPosError ? geoPosError : routeError} </p>
      </div>
    );
  }
  return (
    <div className='info-box'>
      <APIProvider
        apiKey={import.meta.env.VITE_MAPS_API_KEY}
        onLoad={() => console.log('API cargada correctamente')}
      >
        <Map
          className='map'
          mapId='OfficeRoute'
          defaultCenter={geoPosData.coords}
          defaultZoom={11}
        >
          <MapContent officeData={officeData} geoPosData={geoPosData} routeData={routeData} />
        </Map>
      </APIProvider>
    </div>
  );
}

export default MapBox