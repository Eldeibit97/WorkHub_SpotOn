import React from 'react'
import { Map } from '@vis.gl/react-google-maps'
import MapContent from './MapContent'
import './mapbox.css'

const OFFICE_DATA = {
  key: 'AccentureOffice',
  coords: { lat: 25.670002013961874, lng: -100.37771014077546 },
};

const MapBox = ({ geoPosData, routeData }) => {
  if (!geoPosData || !routeData) {
    return (
      <div className="map-card info-box">
        <p className="info-box-title">Ruta al trabajo</p>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>
          {!geoPosData ? 'Obteniendo ubicación...' : 'Trazando ruta...'}
        </p>
      </div>
    );
  }

  return (
    <div className="map-card">
      <Map
        className="map"
        mapId="OfficeRoute"
        defaultCenter={geoPosData.coords}
        defaultZoom={11}
      >
        <MapContent officeData={OFFICE_DATA} geoPosData={geoPosData} routeData={routeData} />
      </Map>
    </div>
  );
};

export default MapBox