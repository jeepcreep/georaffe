"use client";

import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useLeafletContext } from '@react-leaflet/core';
import { useMap } from 'react-leaflet/hooks';
import L from 'leaflet';

import * as Arrugator from '@public/scripts/leaflet.imageoverlay.arrugator';

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

import { RangeSlider } from "flowbite-react";
import { TransformationType } from "@utils/enums";
import { GcpTransformer } from '@allmaps/transform';
import proj4 from 'proj4';

export default function EmbedMap({ selectedMap }) {
    const [gl, setGL] = useState(null);
    const canvasRef = useRef(null);
    // const transformationType = TransformationType.Polynomial; // Fixed transformation type

    const setOpacity = (value) => {
        if (value > 0) {
            value /= 100;
        }
        if (canvasRef.current) {
             L.DomUtil.setOpacity(canvasRef.current, value.toFixed(2));
        }
    }

    const GeoRefOverlay = ({ selectedMap }) => {
        const context = useLeafletContext();
        const map = useMap();
        
        // Setup Proj4 definitions
        useEffect(() => {
             proj4.defs("EPSG:4839", "+proj=lcc +lat_0=51 +lon_0=10.5 +lat_1=48.6666666666667 +lat_2=53.6666666666667 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
             proj4.defs("EPSG:3395", "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs");
        }, []);


        useEffect(() => {
            console.log('EmbedMap: Checking map data', selectedMap);
            if (!selectedMap || !selectedMap.controlPoints) {
                console.log('EmbedMap: No map or control points');
                return;
            }

            var transformGcps = [];
            for (var controlPoint of selectedMap.controlPoints) {
                if (controlPoint.toPoint &&
                    controlPoint.toPoint.length >= 2 &&
                    controlPoint.rasterImageCoords &&
                    controlPoint.rasterImageCoords.length >= 2) {

                    transformGcps.push({
                        source: controlPoint.rasterImageCoords,
                        destination: [controlPoint.toPoint[1], controlPoint.toPoint[0]]
                    })
                }
            }
            console.log('EmbedMap: Transform GCPs', transformGcps);

            if (transformGcps.length < 3) {
                 console.log('EmbedMap: Not enough GCPs', transformGcps.length);
                 return;
            }

            const options = {
                differentHandedness: true,
                maxOffsetRatio: 5,
                maxDepth: 100
            }

            const activeTransformationType = selectedMap.transformationType || TransformationType.Polynomial;
            console.log('EmbedMap: Using transformation type', activeTransformationType);

            const transformer = new GcpTransformer(transformGcps, activeTransformationType);
            
            // Calculate corner points
            const pointTopLeft = transformer.transformForward([0, 0], options);
            const pointBottomLeft = transformer.transformForward([0, selectedMap.height], options);
            const pointTopRight = transformer.transformForward([selectedMap.width, 0], options);
            const pointBottomRight = transformer.transformForward([selectedMap.width, selectedMap.height], options);

            console.log('EmbedMap: Transformed corners', { pointTopLeft, pointBottomLeft, pointTopRight, pointBottomRight });

            const forwardProj = proj4('WGS84', 'EPSG:3857').forward;
            
            // Setup WebGL context
             const canvas = canvasRef.current;
             if(canvas) {
                console.log('EmbedMap: Canvas found, initializing WebGL');
                setGL(canvas.getContext("webgl2", {}));
             } else {
                 console.error('EmbedMap: Canvas ref is null');
             }


            const filename = selectedMap.fileId;
            const filenameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
            const fileExt = filename.substring(filename.lastIndexOf('.') + 1);
            // Assuming NEXT_PUBLIC_TILES_HOST_URL is available in the env
            const fullUrl = `${process.env.NEXT_PUBLIC_TILES_HOST_URL}/${filenameWithoutExt}/${filenameWithoutExt}_reduced.${fileExt}`;
            console.log('EmbedMap: Full Image URL', fullUrl);

            try {
                const arrugatorLayer = new L.ImageOverlay.Arrugator(
                    fullUrl,
                    {
                        controlPoints: [
                            pointTopLeft,
                            pointBottomLeft,
                            pointTopRight,
                            pointBottomRight,
                        ],
                        projector: forwardProj,
                        epsilon: 1000000,
                        fragmentShader: "void main() { gl_FragColor = texture2D(uRaster, vUV); }",
                        subdivisions: 1,
                        cropX: [-Infinity, Infinity],
                        cropY: [-Infinity, Infinity],
                        padding: 0.1,
                        opacity: 1,
                        attribution: selectedMap.title,
                        pane: "overlayPane",
                        map: map,
                        myCanvas: canvasRef.current
                    }
                );

                console.log('EmbedMap: Arrugator layer created', arrugatorLayer);

                const container = context.layerContainer || context.map;
                container.addLayer(arrugatorLayer);
                console.log('EmbedMap: Layer added to container');

                // Fit bounds to the overlay
                // We can approximate bounds from the transformed corners or just let the user scroll
                // For better UX, let's try to center on the map.
                // Using the center of the transformed points roughly:
                // ... (existing bounds logic) ...
                 const lats = [pointTopLeft[1], pointBottomLeft[1], pointTopRight[1], pointBottomRight[1]];
                 const longs = [pointTopLeft[0], pointBottomLeft[0], pointTopRight[0], pointBottomRight[0]];
                 const minLat = Math.min(...lats);
                 const maxLat = Math.max(...lats);
                 const minLng = Math.min(...longs);
                 const maxLng = Math.max(...longs);
                 
                 console.log('EmbedMap: Fitting bounds', [[minLat, minLng], [maxLat, maxLng]]);
                 map.fitBounds([[minLat, minLng], [maxLat, maxLng]]);

                return () => {
                    console.log('EmbedMap: Cleaning up layer');
                    container.removeLayer(arrugatorLayer);
                }
            } catch (error) {
                console.error('EmbedMap: Error creating/adding layer', error);
            }

        }, [selectedMap, context, map]);

        return null;
    };

    return (
        <section className='w-full h-screen relative'>
            <MapContainer center={[53.55, 10]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer
                    url={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                    attribution={'&copy; OpenStreetMap contributors'}
                />
                <GeoRefOverlay selectedMap={selectedMap} />
            </MapContainer>

             {/* Floating UI Controls */}
            <div className='absolute bottom-5 left-5 right-5 z-[1000] bg-white/90 p-3 rounded-lg shadow-lg max-w-sm'>
                 <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-gray-700">{selectedMap.title}</span>
                         {/* <span className="text-xs text-gray-500">{selectedMap.yearDepicted}</span> */}
                    </div>
                    <label htmlFor="opacity-level" className="sr-only">Opacity</label>
                    <RangeSlider
                        id="opacity-level"
                        min="0"
                        max="100"
                        defaultValue="100"
                        onChange={(event) => setOpacity(event.target.value)}
                        className="w-full"
                    />
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>Transparent</span>
                        <span>Opaque</span>
                    </div>
                </div>
            </div>
            
            {/* Canvas for Arrugator - Leaflet will move this into the map pane */}
            <canvas ref={canvasRef} />
        </section>
    );
};
