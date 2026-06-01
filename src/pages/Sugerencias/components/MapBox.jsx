import React, { useEffect, useState } from 'react'
import useGeoPosition from '../../../hooks/useGeoPosition'
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'
import '../sugerencias.css'
import './mapbox.css'

const MapBox = () => {
  const officePos = { key: 'Accenture Office', lat: 25.670002013961874, lng: -100.37771014077546 };
  const [allowMap, setAllowMap] = useState(null);
  const { loading, error, coords } = useGeoPosition();


  if (loading) {
    return (
      <div>
        <p>Cargando mapa</p>
      </div>
    );
  } else if (error) {
    return (
      <div>
        <p>No se pudo cargar el mapa, intentalo denuevo despues {error} </p>
      </div>
    );
  } else {
    return (
      <div className='info-box'>
        <APIProvider apiKey={import.meta.env.VITE_MAPS_API_KEY} onLoad={() => console.log('La API cargo correctamente, ahora se mostrara el mapa')}>
          <Map
            className='map'
            MapId='Office Route'
            defaultCenter={{ lat: coords.lat, lng: coords.lng }}
            defaultZoom={12}>
              <AdvancedMarker
                Key={coords.key}
                position={{lat: coords.lat, lng: coords.lng}}>
                <Pin background='pin' glyphColor='pin-extras' borderColor='pin-extras' />
              </AdvancedMarker>
              <AdvancedMarker
                Key={officePos.key}
                position={{lat: officePos.lat, lng: officePos.lng}}>
                <Pin background='pin' glyphColor='pin-extras' borderColor='pin-extras' />
              </AdvancedMarker>
          </Map>
        </APIProvider>
      </div>
    )
  }
}

export default MapBox