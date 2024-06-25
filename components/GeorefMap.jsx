"use client";

import { useState, Suspense } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useLeafletContext } from '@react-leaflet/core'
import { useMap, useMapEvents } from 'react-leaflet/hooks'
import L from 'leaflet'
L.RasterCoords = require('leaflet-rastercoords');
import { ImageOverlay } from 'react-leaflet/ImageOverlay'
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { useEffect, useMemo, useRef, useCallback } from 'react'
import toast from 'react-hot-toast';
import { Button, Label } from "flowbite-react";
import Loading from './loading';
import { CurrentControlPointStatus } from "@utils/enums";

export default function GeorefMap({selectedMap}) {
  let rasterCoordsRef = useRef(null);
  let controlPointsCountRef = useRef(selectedMap.controlPoints ? selectedMap.controlPoints.length : 0)
  const [controlPointStatus, setControlPointStatus] = useState(CurrentControlPointStatus.FreeForSelection);
  const [controlPointSelection, setControlPointSelection] = useState({});
  const [newlyCreatedControlPoint, setNewlyCreatedControlPoint] = useState(null);

  const [controlPoints, setControlPoints] = useState(selectedMap.controlPoints? selectedMap.controlPoints : []);

  let markers = {};

  const center = {
    lat: 53.551,
    lng: 9.993,
  }

  const existingControlPointIcon = L.icon({
    iconUrl: '/assets/icons/cp-existing.png',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor : [-3, -3]
  });

  const newControlPointIcon = L.icon({
    iconUrl: '/assets/icons/cp-new.png',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor : [-3, -3]
  });

  console.log('selectedMap in georef map', selectedMap);
  console.log('has ' + controlPointsCountRef.current + ' control points.');

  const saveControlPoint = async() => {
    console.log('saving control point selection : ' + JSON.stringify(controlPointSelection));
    try {
      const createNewControlPointResponse = await fetch('/api/map/' + selectedMap._id + '/controlpoint', {
        method: 'POST',
        body: JSON.stringify({controlPoint : controlPointSelection,
          controlPointsCount: controlPointsCountRef.current
        })
      })

      if (createNewControlPointResponse.ok) {
          const newControlPoint = await createNewControlPointResponse.json();
          setNewlyCreatedControlPoint(newControlPoint);

          toast.success('New control point created successfully!', {
            position: 'top-left',
          })
        }
      } catch (error) {
          console.log(error);
      } finally {
        setControlPointSelection({});
        setControlPointStatus(CurrentControlPointStatus.FreeForSelection);
      }
  };

  const deleteControlPoint = async(e, controlPoint, isRasterImage, isNew, markerId) => {
    L.DomEvent.stopPropagation(e);

    if (isNew) {
      if (isRasterImage) {
        const { fromPoint, rasterImageCoords, ...rest } = controlPointSelection;
        setControlPointSelection(rest);
      } else {
        const { toPoint, ...rest } = controlPointSelection;
        setControlPointSelection(rest);
      }

      toast.success('New control point deleted successfully!', {
        position: 'top-left',
      })
    }
    // existing control points
    else {
      try {
        const deleteControlPointResponse = await fetch('/api/map/' + selectedMap._id + '/controlpoint', {
          method: 'DELETE',
          body: JSON.stringify({controlPointId : controlPoint._id
          })
        })
  
        if (deleteControlPointResponse.ok) {  
            toast.success('Control point deleted successfully!', {
              position: 'top-left',
            })

            const modifiedMap = await deleteControlPointResponse.json();
            setControlPoints(modifiedMap.controlPoints);
          }
        } catch (error) {
            console.log(error);
        } finally {
          

          setControlPointSelection({});
          setControlPointStatus(CurrentControlPointStatus.FreeForSelection);

          //we need to modify the markers object too
          delete markers.markerId;
          const twinMarkerId = markerId.includes('to') ? markerId.replace('to', 'from') : markerId.replace('from', 'to');
          delete markers.twinMarkerId;
        }
    }
  }
  

  const DraggableMarker = ({controlPoint, isRasterImage, isNew = false, markerId}) => {
    console.log('draggable marker for control point : ' + JSON.stringify(controlPoint));
    const [draggable, setDraggable] = useState(isNew ? true : false)
    const [position, setPosition] = useState(isRasterImage ? controlPoint.fromPoint : controlPoint.toPoint)
    const markerRef = useRef(null)

    const index = markerId.substring(markerId.lastIndexOf('-') + 1);
    const isFrom = markerId.includes('from') ? true : false;
    const twinMarkerId = 'cp-' + (isFrom ? 'to-' : 'from-') + index;

    const eventHandlers = useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current
          if (controlPoint != null) {
            // const point = isRasterImage ? controlPoint.fromPoint : controlPoint.toPoint
            const marker = markerRef.current
            if (marker != null) {
              const point = marker.getLatLng();
              setPosition(point);
              console.log('setting position to : ' + point);

              if (isRasterImage) {
                let rc = rasterCoordsRef.current;
                var coords = rc.project(point);
                let unprojectedLatLng = rc.unproject(coords);
                setControlPointSelection({...controlPointSelection, fromPoint : unprojectedLatLng, rasterImageCoords : coords});
              }
              else {
                setControlPointSelection({...controlPointSelection, toPoint  : point});
              }
            }
            // console.log('setting position to : ' + point);
            // setPosition(point)
          }
        },
        mouseover(event) {
          console.log('mouse over : ' + markerId);

          if (!markerId.includes('current')) {
            markerRef.current.setIcon(newControlPointIcon);
            const twinMarkerRef = markers[twinMarkerId];
            twinMarkerRef.current.setIcon(newControlPointIcon);
          }
        },
        mouseout(event) {
          console.log('mouse over : ' + markerId);

          if (!markerId.includes('current')) {
            markerRef.current.setIcon(existingControlPointIcon);
            const twinMarkerRef = markers[twinMarkerId];
            twinMarkerRef.current.setIcon(existingControlPointIcon);
          }
        }
      }),
      []
    )

    markers[markerId] = markerRef;

    const toggleDraggable = useCallback((e) => {
      L.DomEvent.stopPropagation(e);

      toast('Editing control point. Click and drag it to its new position.', {
        position: 'top-left',
      })

      setDraggable((d) => !d)

      markerRef.current.setIcon(newControlPointIcon); 
      markerRef.current.closePopup();
    }, [])


    return (
      <Marker
        // key={key}
        draggable={draggable}
        eventHandlers={eventHandlers}
        position={position}
        icon={isNew ? newControlPointIcon : existingControlPointIcon}
        ref={markerRef}
        >
        <Popup minWidth={90}>
          {/* <span onClick={toggleDraggable}>
            {draggable
              ? 'Marker is draggable'
              : 'Click here to make marker draggable'}
          </span> */}
          <div className='w-full flex-center flex-row my-2.5'>
            {/* <div>
            Lat/Lng : 
              {
                isRasterImage ?
                  controlPoint.fromPoint[0].toFixed(4) + '/' + controlPoint.fromPoint[1].toFixed(4)
                :
                  controlPoint.toPoint[0].toFixed(4) + '/' + controlPoint.toPoint[1].toFixed(4)
              }
            </div> */}
            <div className='w-full flex-center flex-row my-2.5'>
              {!isNew ? (
                <span className='mx-1.5'><Button onClick={(e) => toggleDraggable(e)}>Edit</Button></span>
              ) : ( <></>)
              }
              <span className='mx-1.5'><Button key="delete-control-point-button" color="failure" onClick={(e) => deleteControlPoint(e, controlPoint, isRasterImage, isNew, markerId)}>Delete</Button></span>
            </div>
          </div>
        </Popup>
      </Marker>
    )
  }

  const AddMarker = ({isRasterImage}) => {
    console.log('add marker isRasterImage? ' + JSON.stringify(isRasterImage));
    useMapEvents({
      click(e) {
        let latlng = e.latlng;

        if (isRasterImage) {
          let rc = rasterCoordsRef.current;
          var coords = rc.project(e.latlng);
          latlng = rc.unproject(coords);
          console.log('raster image coords : ' + coords);

          if (controlPointStatus == CurrentControlPointStatus.ToPointSelected || controlPointStatus == CurrentControlPointStatus.ReadyForSaving) {
            setControlPointStatus(CurrentControlPointStatus.ReadyForSaving);
            console.log('ready for saving!');
          }
          else {
            setControlPointStatus(CurrentControlPointStatus.FromPointSelected);
            console.log('from point set!');
          }
          setControlPointSelection({...controlPointSelection, fromPoint : latlng, rasterImageCoords : coords});
        }
        else {
          if (controlPointStatus == CurrentControlPointStatus.FromPointSelected || controlPointStatus == CurrentControlPointStatus.ReadyForSaving) {
            setControlPointStatus(CurrentControlPointStatus.ReadyForSaving);
            console.log('ready for saving!');
          }
          else {
            setControlPointStatus(CurrentControlPointStatus.ToPointSelected);
            console.log('to point set!');
          }
          setControlPointSelection({...controlPointSelection, toPoint : latlng});
        }
        console.log('lat/lng : ' + latlng);
        console.log('controlPointSelection : ' + JSON.stringify(controlPointSelection));
        
        // const newMarkers = [...markers, { latlng: e.latlng, isOldMap }];
        // const newMarkers = [...markers, { latlng }];
        // console.log('new marker : ' + newMarkers);
        // setMarkers(newMarkers);
      },
    });
    return null;
  };

  const getFullImageUrl = (filename) => {
    const filenameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    let fullUrl = `https://${process.env.NEXT_PUBLIC_AWS_S3_TILES_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_S3_REGION}.amazonaws.com/${filenameWithoutExt}/tiles`;
    return fullUrl;
 }

  const TileLayerWithRasterCoords = ({selectedMap}) => {
    
    const context = useLeafletContext()

    const map = useMap()

    const width = selectedMap != null ? selectedMap.width : 1000;
    const height = selectedMap != null ? selectedMap.height : 1000;

    console.log('width : ' + width + ', height : ' + height);

    const img = [
      width, //6960,  // original width of image
      height //5409   // original height of image
    ]

    const rc = new L.RasterCoords(map, img);
    rasterCoordsRef.current = rc; 

    map.setMaxZoom(rc.zoomLevel())
    //map.setView(rc.unproject([img[0], img[1]]), 2)

   // setRasterCoords(rc);

    // map.on('click', function (event) {
    //   // any position in leaflet needs to be projected to obtain the image coordinates
    //   var coords = rc.project(event.latlng)
    //   var marker = L.marker(rc.unproject(coords), {
    //     draggable: true
    //   })
    //     .addTo(map)
    //   marker.bindPopup('[' + Math.floor(coords.x) + ',' + Math.floor(coords.y) + ']')
    //     .openPopup()
    // })

    const s3ImageUrl = selectedMap != null ? getFullImageUrl(selectedMap.fileId) : '';
    console.log('s3ImageUrl', s3ImageUrl);

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
    }, [])

    return null;
  };

  return (
    <section className='w-full flex-center flex-col'>
      <div className='w-full flex-center flex-row'>
          
          <div className='w-1/2 mx-2.5'>
            <MapContainer center={[53.55, 10]} zoom={2} style={{ height: '500px', width: '100%' }}>
            <Suspense fallback={<Loading />}>
              <TileLayerWithRasterCoords selectedMap={selectedMap} />
            </Suspense>
            {controlPoints.length > 0 ? controlPoints.map((controlPoint, idx) => (
                  <DraggableMarker key={idx} 
                    controlPoint={controlPoint}
                    isRasterImage={true}
                    markerId={'cp-from-' + controlPoint.index}
                  />
              )) : ( <></>)}
              {controlPointSelection && controlPointSelection.fromPoint ? (
                  <DraggableMarker key={'cp-from-current'} 
                    controlPoint={controlPointSelection}
                    isRasterImage={true}
                    isNew={true}
                    markerId={'cp-from-current'} 
                  />
              ) : ( <></>)}
              {newlyCreatedControlPoint ? (
                  <DraggableMarker key={newlyCreatedControlPoint.index} 
                    controlPoint={newlyCreatedControlPoint}
                    isRasterImage={true}
                    markerId={'cp-from-' + newlyCreatedControlPoint.index}
                  />
              ) : ( <></>)}
            <AddMarker isRasterImage={true}/>
            </MapContainer>

          </div>
          <div className='w-1/2 mx-2.5'>
            <MapContainer center={[53.55, 10]} zoom={13} style={{ height: '500px', width: '100%' }}>
              <TileLayer
                  url={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                  attribution={'&copy; OpenStreetMap contributors'}
              />
              {controlPoints.length > 0 ? controlPoints.map((controlPoint, idx) => (
                  <DraggableMarker key={idx} 
                    controlPoint={controlPoint}
                    isRasterImage={false}
                    markerId={'cp-to-' + controlPoint.index}
                  />
              )) : ( <></>)}
              {controlPointSelection && controlPointSelection.toPoint ? (
                  <DraggableMarker key={'cp-to-current'} 
                    controlPoint={controlPointSelection}
                    isRasterImage={false}
                    isNew={true}
                    markerId={'cp-to-current'} 
                  />
              ) : ( <></>)}
              {newlyCreatedControlPoint ? (
                  <DraggableMarker key={newlyCreatedControlPoint.index} 
                    controlPoint={newlyCreatedControlPoint}
                    isRasterImage={false}
                    markerId={'cp-to-' + newlyCreatedControlPoint.index}
                  />
              ) : ( <></>)}
              <AddMarker isRasterImage={false}/>
            
            </MapContainer>
          </div>

      </div>
      <div className='w-full flex-center flex-row my-2.5'>
        {controlPointStatus == CurrentControlPointStatus.ReadyForSaving ? (
          <Button onClick={() => saveControlPoint()}>Save control point</Button>
        ) : ( <></>)
        }
      </div>
    </section>
  );
};

// export default GeorefMap;