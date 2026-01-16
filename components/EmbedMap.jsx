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

import { RangeSlider, Button, Tooltip } from "flowbite-react"; // Ensure Button/Tooltip are here
import { MdVisibility, MdVisibilityOff, MdList } from "react-icons/md";
import MapMarkers from './MapMarkers';
import { TransformationType } from "@utils/enums";
import { GcpTransformer } from '@allmaps/transform';
import proj4 from 'proj4';

const GeoRefOverlay = ({ selectedMap, canvasRef, setGL }) => {
    const context = useLeafletContext();
    const map = useMap();
    
    // Setup Proj4 definitions
    useEffect(() => {
         proj4.defs("EPSG:4839", "+proj=lcc +lat_0=51 +lon_0=10.5 +lat_1=48.6666666666667 +lat_2=53.6666666666667 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
         proj4.defs("EPSG:3395", "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs");
    }, []);


    useEffect(() => {
        if (!selectedMap || !selectedMap.controlPoints) {
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

        if (transformGcps.length < 3) {
             return;
        }

        const options = {
            differentHandedness: true,
            maxOffsetRatio: 5,
            maxDepth: 100
        }

        const activeTransformationType = selectedMap.transformationType || TransformationType.Polynomial;

        const transformer = new GcpTransformer(transformGcps, activeTransformationType);
        
        // Calculate corner points
        const pointTopLeft = transformer.transformForward([0, 0], options);
        const pointBottomLeft = transformer.transformForward([0, selectedMap.height], options);
        const pointTopRight = transformer.transformForward([selectedMap.width, 0], options);
        const pointBottomRight = transformer.transformForward([selectedMap.width, selectedMap.height], options);

        const forwardProj = proj4('WGS84', 'EPSG:3857').forward;
        
        // Setup WebGL context
         const canvas = canvasRef.current;
         if(canvas) {
            setGL(canvas.getContext("webgl2", {}));
         }


        const filename = selectedMap.fileId;
        const filenameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
        const fileExt = filename.substring(filename.lastIndexOf('.') + 1);
        const fullUrl = `${process.env.NEXT_PUBLIC_TILES_HOST_URL}/${filenameWithoutExt}/${filenameWithoutExt}_reduced.${fileExt}`;

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

            const container = context.layerContainer || context.map;
            container.addLayer(arrugatorLayer);

            const lats = [pointTopLeft[1], pointBottomLeft[1], pointTopRight[1], pointBottomRight[1]];
            const longs = [pointTopLeft[0], pointBottomLeft[0], pointTopRight[0], pointBottomRight[0]];
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...longs);
            const maxLng = Math.max(...longs);
            
            map.fitBounds([[minLat, minLng], [maxLat, maxLng]]);

            return () => {
                container.removeLayer(arrugatorLayer);
            }
        } catch (error) {
            console.error('EmbedMap: Error creating/adding layer', error);
        }

    }, [selectedMap, context, map]);

    return null;
};

    return null;
};

const MapController = ({ activeMarker }) => {
    const map = useMap();
    useEffect(() => {
        if (activeMarker) {
            map.flyTo([activeMarker.lat, activeMarker.lng], 16, {
                animate: true,
                duration: 1.5
            });
            map.closePopup(); // Close others
            // To open the specific popup, we'd need a ref to the marker. 
            // For now, flyTo is the main requested feature.
        }
    }, [activeMarker, map]);
    return null;
}

export default function EmbedMap({ selectedMap }) {
    const [gl, setGL] = useState(null);
    const canvasRef = useRef(null);
    const [showMarkers, setShowMarkers] = useState(true);
    const [showLegend, setShowLegend] = useState(false);
    const [activeMarker, setActiveMarker] = useState(null);

    const setOpacity = (val) => {
        const value = parseFloat(val);
        const opacity = value / 100;
        
        if (canvasRef.current) {
             L.DomUtil.setOpacity(canvasRef.current, opacity.toFixed(2));
        }
    }

    return (
        <section className='w-full h-screen relative overflow-hidden'>
            <MapContainer center={[53.55, 10]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer
                    url={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                    attribution={'&copy; OpenStreetMap contributors'}
                />
                <GeoRefOverlay selectedMap={selectedMap} canvasRef={canvasRef} setGL={setGL} />
                {showMarkers && <MapMarkers markers={selectedMap.markers} />}
                <MapController activeMarker={activeMarker} />
            </MapContainer>

             {/* Floating UI Controls */}
            <div className='absolute bottom-5 left-5 right-5 z-[1000] bg-white/90 p-3 rounded-lg shadow-lg max-w-sm transition-all'>
                 <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-gray-700 truncate mr-2">{selectedMap.title}</span>
                         <div className="flex gap-1">
                            <Tooltip content={showMarkers ? "Hide Markers" : "Show Markers"}>
                                <Button size="xs" color="light" onClick={() => setShowMarkers(!showMarkers)}>
                                    {showMarkers ? <MdVisibility className="h-4 w-4"/> : <MdVisibilityOff className="h-4 w-4"/>}
                                </Button>
                            </Tooltip>
                            <Tooltip content="Toggle Legend">
                                <Button size="xs" color={showLegend ? "gray" : "light"} onClick={() => setShowLegend(!showLegend)}>
                                    <MdList className="h-4 w-4"/>
                                </Button>
                            </Tooltip>
                         </div>
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

            {/* Legend Drawer */}
            <div className={`absolute top-0 right-0 bottom-0 w-64 bg-white/95 shadow-xl z-[1001] overflow-y-auto p-4 transition-transform duration-300 ease-in-out ${showLegend ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-bold text-gray-900">Points of Interest</h3>
                    <Button size="xs" color="light" pill onClick={() => setShowLegend(false)}>X</Button>
                </div>
                <div className="flex flex-col gap-2">
                    {selectedMap.markers && selectedMap.markers.map(marker => (
                        <div 
                            key={marker._id} 
                            className={`p-3 rounded-lg cursor-pointer border hover:shadow-md transition-all ${activeMarker?._id === marker._id ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-gray-200'}`}
                            onClick={() => setActiveMarker(marker)}
                        >
                            <div className="font-semibold text-sm text-gray-800">{marker.title}</div>
                            {marker.description && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{marker.description}</div>}
                        </div>
                    ))}
                    {(!selectedMap.markers || selectedMap.markers.length === 0) && (
                        <div className="text-center py-8 text-gray-400">
                            <p className="text-sm italic">No markers added yet.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Canvas for Arrugator - Leaflet will move this into the map pane */}
            <canvas ref={canvasRef} />
        </section>
    );
};