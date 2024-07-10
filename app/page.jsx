"use client"

import React, { Suspense } from 'react'
import dynamic from "next/dynamic";
import GeorefMap from '@components/GeorefMap';
import OverlayMap from '@components/OverlayMap';
import MyMapsDrawer from '@components/MyMapsDrawer';
import CreateMapModal from '@components/CreateMapModal';
import { useState, useEffect } from 'react';
import { Button } from "flowbite-react";

import fetchDefaultSelectedMap from '@utils/initialize';

import Loading from './loading';

const Home = () => {
  // const [markers, setMarkers] = useState([]);
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);

  const [isLoading, setLoading] = useState(true)

  const [schedulerStarted, setSchedulerStarted] = useState(false);

  const [displayOverlayMap, setDisplayOverlayMap] = useState(false);

  useEffect( () => {
      const fetchMaps = async () => {
      
      const response = await fetch('/api/map');
      const data = await response.json();

      if (!schedulerStarted) {
        try {
          const createNewMapResponse = await fetch('/api/services/scheduler', {
            method: 'POST',
            body: JSON.stringify({})
          })
          setSchedulerStarted(true);
        } catch  (error) {
          console.log(error);
        }
      }

      setMaps(data);

      if (!selectedMap) {
        let urlParams = '?selectedMap=newest'
        fetch('/api/map' + urlParams)
          .then((res) => res.json())
          .then((selectedMap) => {
            setSelectedMap(selectedMap[0])
            setLoading(false)
        })
      }
      
    }

    fetchMaps();
  }, [])

  // console.log('selectedMap on page level : ' + selectedMap);

  const toggleOverlayMap = () => {
    setDisplayOverlayMap(!displayOverlayMap);
    console.log('over lay ? ' + displayOverlayMap);
  }

  if (isLoading) return <p>Loading...</p>

  return (

    <section className='w-full flex-center flex-col'>
        
        <p className='desc text-center'>
            GeoRaffe is your stop for comparing
            geographical maps with one another
        </p>
        <div className='w-full flex-center flex-row my-2.5'>
          {selectedMap.controlPoints && selectedMap.controlPoints.length >= 3 ? (
            <Button onClick={() => toggleOverlayMap(true)}>{displayOverlayMap ? 'Georeference' : 'Overlay map'}</Button>
          ) : ( <></>)
          }
        </div>
        <div className='w-full flex-center flex-row'>
            <Suspense fallback={<Loading />}>
              <MyMapsDrawer maps={maps} setMaps={setMaps} selectedMap={selectedMap} setSelectedMap={setSelectedMap}/>
              {!displayOverlayMap ? (
                <GeorefMap selectedMap={selectedMap}/>
              ) : (
                <OverlayMap selectedMap={selectedMap}/>
              )}
            </Suspense>
            <CreateMapModal maps={maps} setMaps={setMaps}/>
        </div>
       

    </section>
  )
}

export default Home