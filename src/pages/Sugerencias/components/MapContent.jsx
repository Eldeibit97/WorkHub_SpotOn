import React, { useEffect } from "react";
import { useMap, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import './mapbox.css'

const MapContent = ({officeData, geoPosData, routeData}) => {
  const map = useMap();

  console.log('office data', officeData);
  console.log('geopos data', geoPosData);
  console.log('route data', routeData);

  useEffect(() => {
    if (!map || !routeData) return;

    const polylines = routeData.createPolylines({
      polylineOptions: {
        strokeColor: '#a855f7',
        strokeWeight: 5,
        strokeOpacity: 0.8,
      },
    });
    polylines.forEach((p) => p.setMap(map));

    const bounds = new google.maps.LatLngBounds();
    routeData.path.forEach((pt) => bounds.extend(pt));
    map.fitBounds(bounds);

    return () => polylines.forEach((p) => p.setMap(null));
  }, [map, routeData]);

  return (
    <>
      <AdvancedMarker key={geoPosData.key} position={geoPosData.coords}>
        <Pin background='#6d20b5' glyphColor='#FFFFFF' borderColor='#FFFFFF'/>
      </AdvancedMarker>
      <AdvancedMarker key={officeData.key} position={officeData.coords}>
        <Pin background='#6d20b5' glyphColor='#FFFFFF' borderColor='#FFFFFF'/>
      </AdvancedMarker>
    </>
  );
}

export default MapContent