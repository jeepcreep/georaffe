"use client";

import { useState, Suspense } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { useLeafletContext } from '@react-leaflet/core'
import { useMap, useMapEvents } from 'react-leaflet/hooks'
import L from 'leaflet'
L.RasterCoords = require('leaflet-rastercoords');
import { ImageOverlay } from 'react-leaflet/ImageOverlay'
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

import { useEffect } from 'react'

import Loading from './loading';

export default function GeorefMap({markers, setMarkers, selectedMap}) {
  const [oldMapUrl, setOldMapUrl] = useState(null);

  // const AddMarker = () => {
  //   useMapEvents({
  //     click(e) {
  //       const newMarkers = [...markers, { latlng: e.latlng, isOldMap }];
  //       setMarkers(newMarkers);
  //     },
  //   });
  //   return null;
  // };

  const getFullImageUrl = (filename) => {
    const filenameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    let fullUrl = `https://${process.env.NEXT_PUBLIC_AWS_S3_TILES_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${filenameWithoutExt}/tiles`;
    return fullUrl;
 }

  const TileLayerWithRasterCoords = (selectedMapObj) => {
    const selectedMap =  selectedMapObj.selectedMap[0];
    console.log('selectedMap in georef map', selectedMap);
    const context = useLeafletContext()

    const map = useMap()

    const width = selectedMap != null ? selectedMap.width : 1000;
    const height = selectedMap != null ? selectedMap.height : 1000;

    console.log('width : ' + width + ', height : ' + height);

    const img = [
      width, //6960,  // original width of image
      height //5409   // original height of image
    ]

    const rc = new L.RasterCoords(map, img)
    map.setMaxZoom(rc.zoomLevel())
    map.setView(rc.unproject([img[0], img[1]]), 2)
    map.on('click', function (event) {
      // any position in leaflet needs to be projected to obtain the image coordinates
      var coords = rc.project(event.latlng)
      var marker = L.marker(rc.unproject(coords))
        .addTo(map)
      marker.bindPopup('[' + Math.floor(coords.x) + ',' + Math.floor(coords.y) + ']')
        .openPopup()
    })

    const s3ImageUrl = selectedMap != null ? getFullImageUrl(selectedMap.fileId) : '';
    console.log('s3ImageUrl', s3ImageUrl);

    // const tileLayer = L.tileLayer(s3ImageUrl + '/{z}/{x}/{y}.png', {
    //   noWrap: true,
    //   bounds: rc.getMaxBounds(),
    //   maxNativeZoom: rc.zoomLevel()
    // }).addTo(map)

    useEffect(() => {
      const tileLayer = L.tileLayer(s3ImageUrl + '/{z}/{x}/{y}.png', {
        noWrap: true,
        bounds: rc.getMaxBounds(),
        maxNativeZoom: rc.zoomLevel()
      })
      // const bounds = L.latLng(props.center).toBounds(props.size)
      // const square = new L.Rectangle(bounds)
      const container = context.layerContainer || context.map
      container.addLayer(tileLayer)
  
      return () => {
        container.removeLayer(tileLayer)
      }
    })

    // const map = L.map('map', {
    //   crs: L.CRS.Simple
    // })

    // useMapEvents({
    //   click(e) {
    //     const newMarkers = [...markers, { latlng: e.latlng, isOldMap }];
    //     setMarkers(newMarkers);
    //   },
    // });
    return null;
  };

  return (
    <section className='w-full flex-center flex-row'>
        
        <div className='w-1/2 mx-2.5'>
          <MapContainer center={[53.55, 10]} zoom={2} style={{ height: '500px', width: '100%' }}>
          <Suspense fallback={<Loading />}>
            <TileLayerWithRasterCoords selectedMap={selectedMap}/>
          </Suspense>
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
            {/* <AddMarker /> */}
          
          </MapContainer>
        </div>

        {/* <CreateMapModal /> */}
    </section>
  );
};

// export default GeorefMap;