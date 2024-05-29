"use client";

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { ImageOverlay } from 'react-leaflet/ImageOverlay'
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

import CreateMapModal from './CreateMapModal';

export default function GeorefMap({markers, setMarkers}) {
  const [oldMapUrl, setOldMapUrl] = useState(null);

  const AddMarker = () => {
    useMapEvents({
      click(e) {
        const newMarkers = [...markers, { latlng: e.latlng, isOldMap }];
        setMarkers(newMarkers);
      },
    });
    return null;
  };


  const bounds = [[-26.5, -25], [1021.5, 1023]];

  return (
    <section className='w-full flex-center flex-row'>
        
        <div className='w-1/2 mx-2.5'>
          <MapContainer center={[53.55, 10]} zoom={13} style={{ height: '500px', width: '100%' }}>
            <ImageOverlay bounds={bounds} url={oldMapUrl ? oldMapUrl : 'http://test.de'}></ImageOverlay>
            {/* <TileLayer
                url={isOldMap ? '/path-to-old-map-tiles/{z}/{x}/{y}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                attribution={isOldMap ? 'Old Map' : '&copy; OpenStreetMap contributors'}
            /> */}
            {markers.map((marker, idx) => (
                <Marker key={idx} position={marker.latlng} />
            ))}
            <AddMarker />

          </MapContainer>

        </div>
        <div className='w-1/2 mx-2.5'>
          <MapContainer center={[53.55, 10]} zoom={13} style={{ height: '500px', width: '100%' }}>
            <TileLayer
                url={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                attribution={'&copy; OpenStreetMap contributors'}
            />
            {markers.map((marker, idx) => (
                <Marker key={idx} position={marker.latlng} />
            ))}
            <AddMarker />
          
          </MapContainer>
        </div>

        {/* <CreateMapModal /> */}
    </section>
  );
};

// export default GeorefMap;