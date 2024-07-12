"use client"

import window from 'global'

import dynamic from 'next/dynamic'

const GeorefMap = dynamic(() => import('@components/GeorefMap'), { ssr: false })
const OverlayMap = dynamic(() => import('@components/OverlayMap'), { ssr: false })

import React, { Suspense } from 'react'
import Image from 'next/image';
import MyMapsDrawer from '@components/MyMapsDrawer';
import CreateMapModal from '@components/CreateMapModal';
import { useState, useEffect } from 'react';
import { Button } from "flowbite-react";

import { useSession } from 'next-auth/react';

import Loading from './loading';

const Home = () => {
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [isLoading, setLoading] = useState(true)
  const [schedulerStarted, setSchedulerStarted] = useState(false)
  const [displayOverlayMap, setDisplayOverlayMap] = useState(false);

  const { data: session } = useSession();

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
        
     {!session?.user ? (

        <div className='w-full flex-center flex-col'>

          <p className='desc text-center'>
              GeoRaffe is your stop for comparing
              geographical maps with one another by
              matching known geographical points
              ('ground control points') both on a normal
              OpenStreetMap and on a raster image, often a 
              historical depiction of the same geo location.
              <hr class="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
              It's fun, easy and free - just sign up with 
              a google account and you're good to go.  
          </p>
          <p>

          <Image 
                width={240*2}
                height={146*2}
                src="/assets/images/georaffe-short-b.gif" 
                alt='video'
            />

          </p>

        </div>

      ) : (
        
        <div className='w-full flex-center flex-col'>

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
                    <GeorefMap selectedMap={selectedMap} s3TilesBucket={process.env.NEXT_PUBLIC_AWS_S3_TILES_BUCKET} s3Region={process.env.NEXT_PUBLIC_AWS_S3_REGION}/>
                  ) : (
                    <OverlayMap selectedMap={selectedMap}/>
                  )}
                </Suspense>
                <CreateMapModal maps={maps} setMaps={setMaps}/>
            </div>
        </div>

        )}

    </section>
  )
}

export default Home