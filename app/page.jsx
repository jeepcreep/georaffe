"use client"

import React from 'react'
import dynamic from "next/dynamic";
import GeorefMap from '@components/GeorefMap';
import MyMapsDrawer from '@components/MyMapsDrawer';
import CreateMapModal from '@components/CreateMapModal';
import { useState, useEffect } from 'react';

const DEFAULT_CENTER = [38.907132, -77.036546]

const Home = () => {
  const [markers, setMarkers] = useState([]);
  const [maps, setMaps] = useState([]);

  useEffect( () => {
    const fetchMaps = async () => {
      const response = await fetch('/api/map');
      const data = await response.json();

      setMaps(data);
    }

    fetchMaps();
  }, [])


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
            <MyMapsDrawer maps={maps} setMaps={setMaps}/>
            <GeorefMap markers={markers} setMarkers={setMarkers} />
            <CreateMapModal maps={maps} setMaps={setMaps} />
        </div>
       

    </section>
  )
}

export default Home