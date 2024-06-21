"use client"

import React, { Suspense } from 'react'
import dynamic from "next/dynamic";
import GeorefMap from '@components/GeorefMap';
import MyMapsDrawer from '@components/MyMapsDrawer';
import CreateMapModal from '@components/CreateMapModal';
import { useState, useEffect } from 'react';

import fetchDefaultSelectedMap from '@utils/initialize';

import Loading from './loading';

const Home = () => {
  // const [markers, setMarkers] = useState([]);
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);

  const [isLoading, setLoading] = useState(true)

  const [schedulerStarted, setSchedulerStarted] = useState(false);

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

      let urlParams = '?selectedMap=newest'
      fetch('/api/map' + urlParams)
        .then((res) => res.json())
        .then((selectedMap) => {
          setSelectedMap(selectedMap[0])
          setLoading(false)
      })

      // const selectedMapResponse = await fetch(process.env.HOST_BASE_URL_DEV + '/api/map' + urlParams);
      // const selectedMapData = await selectedMapResponse.json();

      // console.log('selectedMapData', selectedMapData);
    }

    fetchMaps();
  }, [])

  if (isLoading) return <p>Loading...</p>

  return (

    <section className='w-full flex-center flex-col'>
        <h1 className='head_text text-center'>
            GeoRef
            <br className='max-md:hidden'/>
            <span className='orange_gradient text-center'>Next-level georeferencing</span>
        </h1>
        <p className='desc text-center'>
            GeoRef is your stop for comparing
            geographical maps with one another
        </p>
        <div className='w-full flex-center flex-row'>
            <Suspense fallback={<Loading />}>
              <MyMapsDrawer maps={maps} setMaps={setMaps} selectedMap={selectedMap} setSelectedMap={setSelectedMap}/>
              <GeorefMap selectedMap={selectedMap}/>
            </Suspense>
            <CreateMapModal maps={maps} setMaps={setMaps}/>
        </div>
       

    </section>
  )
}

export default Home