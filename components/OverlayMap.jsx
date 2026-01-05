"use client";

import { useState, Suspense } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useLeafletContext } from '@react-leaflet/core'
import { useMap, useMapEvents } from 'react-leaflet/hooks'
import L from 'leaflet'

import * as Arrugator from '@public/scripts/leaflet.imageoverlay.arrugator'

//L.RasterCoords = require('leaflet-rastercoords');

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { useEffect, useMemo, useRef, useCallback } from 'react'
import toast from 'react-hot-toast';
import { RangeSlider, Label, Dropdown } from "flowbite-react";
import Loading from './loading';
import { TransformationType, TransformationTypes, TransformationTypeLabels, TransformationTypesMinGCP } from "@utils/enums";

import { GcpTransformer } from '@allmaps/transform';

import proj4 from 'proj4';
import { t } from 'numeric';

export default function OverlayMap({selectedMap}) {
    //const [opacityLevel, setOpacityLevel] = useState(1);
    const [gl, setGL] = useState(null);
    const [transformationType, setTransformationType] = useState(TransformationType.Polynomial);
    let canvasRef = useRef(null);

    const setOpacity = (value) => {
        if (value > 0) {
            value /= 100;
        }
        L.DomUtil.setOpacity(canvasRef.current, value.toFixed(2));
    }

    const TransformationTypeItem = ({type}) => {
        const gcpCount = selectedMap.controlPoints?.length;

        console.log('type : ' + type);
        if (gcpCount >= TransformationTypesMinGCP[type]) {
            return (
                <Dropdown.Item value={type} onClick={() => setTransformationType(type)} className={transformationType == type ? 'selected_item' : ''}>
                    {TransformationTypeLabels[type]}
                </Dropdown.Item>
            )
        }
        else {
            return ( 
                <Dropdown.Item value={type} disabled className='disabled_item'>
                    {TransformationTypeLabels[type]} (needs {TransformationTypesMinGCP[type]} GCPs)
                </Dropdown.Item>
            )
        }
    }

    const GeoRefOverlay = ({selectedMap}) => {

        // Define projections
        proj4.defs("EPSG:4839","+proj=lcc +lat_0=51 +lon_0=10.5 +lat_1=48.6666666666667 +lat_2=53.6666666666667 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
        proj4.defs("EPSG:3395","+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs");
        proj4.defs("EPSG:3857","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs");

        // We use this to project GCPs from Lng/Lat to Meters (Web Mercator) BEFORE the transform
        const wgs84ToMercator = proj4('WGS84','EPSG:3857').forward;

        var transformGcps = [];
        if (selectedMap.controlPoints) {
            for (var controlPoint of selectedMap.controlPoints) {
                if (controlPoint.toPoint && controlPoint.toPoint.length === 2 && controlPoint.rasterImageCoords && controlPoint.rasterImageCoords.length === 2) {
                    // Project the GCP destination to meters immediately
                    // toPoint is [Lat, Lng], so we flip to [Lng, Lat] for proj4
                    const projectedPoint = wgs84ToMercator([controlPoint.toPoint[1], controlPoint.toPoint[0]]);
                    
                    if (!isNaN(projectedPoint[0]) && !isNaN(projectedPoint[1])) {
                        transformGcps.push({
                            source: controlPoint.rasterImageCoords,
                            destination: projectedPoint
                        })
                    }
                }
            }
        }

        console.log('transformGcps (in meters) : ' + JSON.stringify(transformGcps));

        if (transformGcps.length < 3) {
            console.warn("Not enough valid GCPs to render overlay.");
            return null;
        }

        const options = {
            differentHandedness: true,
            maxOffsetRatio: 5,
            maxDepth: 100
        }

        const transformer = new GcpTransformer(transformGcps, transformationType)
        
        // These points are now in Web Mercator Meters
        const pointTopLeft = transformer.transformForward([0, 0], options);
        const pointBottomLeft = transformer.transformForward([0, selectedMap.height], options);
        const pointTopRight = transformer.transformForward([selectedMap.width, 0], options);
        const pointBottomRight = transformer.transformForward([selectedMap.width, selectedMap.height], options);

        // Sanity check for NaNs which cause Leaflet crashes
        if ([pointTopLeft, pointBottomLeft, pointTopRight, pointBottomRight].some(p => !p || isNaN(p[0]) || isNaN(p[1]))) {
            console.error("Georeferencer produced NaN coordinates. Check GCP validity or polynomial order.");
            console.error("TopLeft:", pointTopLeft);
            console.error("BottomLeft:", pointBottomLeft);
            console.error("TopRight:", pointTopRight);
            console.error("BottomRight:", pointBottomRight);
            return null;
        }

        console.log('--- DEBUG GEOREF ---');
        console.log('GCPs (Pixel -> Meter):', transformGcps);
        console.log('Transformer created.');
        console.log('Projected TopLeft (Meters):', pointTopLeft);
        
        // Test the projector function manually
        try {
            const testPoint = arrugatorProjector([100, 100]);
            console.log('Test Projection [100, 100] ->', testPoint);
            if (!testPoint || isNaN(testPoint[0]) || isNaN(testPoint[1])) {
                throw new Error("Projector function returned NaN/Null");
            }
        } catch (e) {
            console.error("Projector function failed sanity check:", e);
            return null;
        }

        const context = useLeafletContext();
        const map = useMap();

        // The projector function for Arrugator.
        // It takes a point in the source image (Pixels) and returns a point in the destination CRS (Meters).
        const arrugatorProjector = (coords) => {
            try {
                const result = transformer.transformForward(coords, options);
                // Check for validity
                if (!result || isNaN(result[0]) || isNaN(result[1])) {
                    console.warn(`Arrugator projector produced invalid coords for pixel [${coords}]:`, result);
                    // Return a safe fallback (e.g., center of map or 0,0) to prevent crash
                    // Returning 0,0 (Null Island) is safer than crashing
                    return [0, 0];
                }
                return result;
            } catch (err) {
                console.error("Arrugator projector crashed:", err);
                return [0, 0];
            }
        };

        useEffect(() => {

            const canvas = canvasRef.current;
            setGL(canvas?.getContext?.("webgl2", {

            }) ?? undefined);

            // const image = new Image();
            // image.onload = () => {
            //     const transformedImageURL = transformImage(image, params, 1);
            //     const imageBounds = [[53.578, 9.974], [53.537, 10.062]];
            //     L.imageOverlay(transformedImageURL, imageBounds).addTo(map);

            // }
            // image.src = '/assets/images/Ion6X7C.jpeg';

            const filename = selectedMap.fileId;
            const filenameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
            const fileExt = filename.substring(filename.lastIndexOf('.') + 1);
            const fullUrl = `${process.env.NEXT_PUBLIC_TILES_HOST_URL}/${filenameWithoutExt}/${filenameWithoutExt}_reduced.${fileExt}`;        

            const arrugatorLayer = new L.ImageOverlay.Arrugator(
                // First argument to the factory/constructor is the URL of the image. Only png/jpg.
                fullUrl,
                {
                    // The "controlPoints" option must be an array of arrays of numbers, containing
                    // the coordinates in the source CRS of the four corners of the image, as follows:
                    // controlPoints: [
                    //     [-35105.635432, 284599.061820],	// top-left
                    //     [-35044.070476, 282872.895477],	// bottom-left
                    //     [-32689.868363, 284743.952094],	// upper-right
                    //     [-32685.244098, 282867.785720],	// lower-right
                    // ],
                    controlPoints: [
                        pointTopLeft,	// top-left
                        pointBottomLeft,	// bottom-left
                        pointTopRight,	// upper-right
                        pointBottomRight,	// lower-right
                    ],
            
                    // The "projector" option must be a forward-projection function.
                    // Leveraging proj4 as follows is recommended.
                    // It's up to the developer to ensure that the destination projection matches the Leaflet display CRS.
                    projector: arrugatorProjector,
            
                    // The "epsilon" option controls how much the triangular mesh will be subdivided.
                    // Set it to the *square* of the maximum expected error, in units of the destination CRS.
                    // A value of 100 means the maximum reprojection error distance shall be 10 meters (10^2).
                    epsilon: 100,
            
                    // If you don't know what a "fragment shader" is, do not change this default.
                    // If you *do* know what a "fragment shader" is, then be aware that there's a
                    // predefined `uRaster` 2D sampler and a `vUV` `vec2` varying.
                    fragmentShader: "void main() { gl_FragColor = texture2D(uRaster, vUV); }",
            
                    // Rasters that cover very large areas (i.e. the whole earth) can lead to
                    // projection artifacts. For those cases, subdivide the mesh before
                    // arrugating by providing a value larger than 1.
                    subdivisions: 1,
            
                    // If the input coordinates are so large, or so close to discontinuties/asimptotic
                    // points, these options will crop it to prevent artifacts.
                    // In other words: when the input data covers the poles, prevent
                    // projecting the areas near the poles by cropping the `Y` coordinate
                    // between `[-85.5, 85.5]`.
                    cropX: [-Infinity, Infinity],
                    cropY: [-Infinity, Infinity],
            
                    // Can take a "padding" option, as per L.Renderer
                    padding: 0.1,
            
                    // "opacity" as per L.ImageOverlay
                    opacity: 1,
            
                    // Can take usual L.Layer options as well.
                    attribution: "Hamburg 1830",
                    pane: "overlayPane",
                    map: map,
                    myCanvas: canvasRef.current
                }
            );

            const container = context.layerContainer || context.map;
            container.addLayer(arrugatorLayer)

            return () => {
                container.removeLayer(arrugatorLayer)
              }

        }, []);

        return null;
    }

    console.log('selectedMap in overlay map', selectedMap);

  return (
    <section className='w-full flex-center flex-col'>
        <div className='w-full flex-center flex-row'>
            <div className='w-1/2 flex-center flex-col'>
                <RangeSlider 
                    id="opacity-level" 
                    min="0.1" 
                    max="100"
                    
                    onChange={(event) => setOpacity(event.target.value)}/>
                <div className="flex h-full flex-row justify-between py-2 text-gray-400 text-xs">
                        Set opacity to see how well the overlay works
                </div>
            </div>
            <div className='w-1/2 flex-center flex-col'>
                <Dropdown label="Transformation type" className='transformTypeSelection'>
                    {TransformationTypes.map((type) => (
                        <TransformationTypeItem key={type} type={type} />
                    )
                    )}
                </Dropdown>
            </div>
        </div>
      <div className='w-full flex-center flex-row'>

            <MapContainer center={[53.55, 10]} zoom={13} style={{ height: '500px', width: '100%' }}>
                <TileLayer
                    url={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                    attribution={'&copy; OpenStreetMap contributors'}
                />
                <GeoRefOverlay selectedMap={selectedMap} />
            </MapContainer>
        
      </div>

      <canvas ref={canvasRef}></canvas>
    </section>
    
  );
};