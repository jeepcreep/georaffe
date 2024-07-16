"use client"

import window from 'global'

import dynamic from 'next/dynamic'

const GeorefMap = dynamic(() => import('@components/GeorefMap'), { ssr: false })
const OverlayMap = dynamic(() => import('@components/OverlayMap'), { ssr: false })

import React, { Suspense } from 'react'
import Image from 'next/image';
import MyMapsDrawer from '@components/MyMapsDrawer';
import CreateMapModal from '@components/CreateMapModal';
import EditMapModal from '@components/EditMapModal';
import { useState, useEffect } from 'react';
import { Button } from "flowbite-react";

import { MapStatus } from "@utils/enums";

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

      const response = await fetch('/api/map');
      if (response.status == 401) {
        return;
      }

      const data = await response.json();

      setMaps(data);

      if (!selectedMap) {
        let urlParams = '?selectedMap=newest'
        fetch('/api/map' + urlParams)
          .then((res) => res.json())
          .then((selectedMap) => {
            setSelectedMap(selectedMap[0])
            //setSelectedMap(null)
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
              GeoRaffe (a pun on 'georef') is your stop for comparing
              geographical maps with one another by
              matching known locations
              ('ground control points') both on a normal
              OpenStreetMap and on a raster image, often a 
              historical depiction of the same place.
          </p>
          <hr class="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
          <p className='desc text-center'>
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
              {selectedMap != null && selectedMap != undefined && selectedMap.controlPoints && selectedMap.controlPoints.length >= 3 ? (
                <Button className='blue_gradient_btn' onClick={() => toggleOverlayMap(true)}>{displayOverlayMap ? 'Georeference' : 'Overlay map'}</Button>
              ) : ( <></>)
              }
            </div>
            <div className='w-full flex-center flex-row'>
            {selectedMap != null && selectedMap != undefined ? (
                <Suspense fallback={<Loading />}>
                  <MyMapsDrawer maps={maps} setMaps={setMaps} selectedMap={selectedMap} setSelectedMap={setSelectedMap}/>

                  {selectedMap.status == MapStatus.Ready ? (
                    !displayOverlayMap ? (
                    <GeorefMap selectedMap={selectedMap} s3TilesBucket={process.env.NEXT_PUBLIC_AWS_S3_TILES_BUCKET} s3Region={process.env.NEXT_PUBLIC_AWS_S3_REGION}/>
                  ) : (
                    <OverlayMap selectedMap={selectedMap}/>
                  )
                  ) : (
                    <></>
                  )}

                  {selectedMap.status != MapStatus.Ready ? (
                     <div className='w-full flex-center flex-row'>
                        <h2 className='subhead2_text text-center'>
                          <span className='orange_gradient text-center'>Your map is currently being processed, sit tight!</span>
                        </h2>
                     </div>
                  ) : (
                    <></>
                  )}
          
                </Suspense>
                ) : ( 
                  <section className='w-full flex-center flex-col my-3'>
                    <h2 className='subhead2_text'>No maps, no problem</h2>
                    <p className='desc_medium text-center text-gray-600'>
                       Start by uploading a new map
                    </p>
                  </section>
                )
              }
              
              <div className='flex-center flex-col'>
                <div className='my-3'>
                  <CreateMapModal maps={maps} setMaps={setMaps} userId={session?.user.id} setSelectedMap={setSelectedMap}/>
                </div>
                {selectedMap.status == MapStatus.Ready ? (
                  <div className='my-3'>
                    <EditMapModal maps={maps} setMaps={setMaps} userId={session?.user.id} selectedMap={selectedMap} setSelectedMap={setSelectedMap}/>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </div>
        </div>

        )}

    </section>
  )
}

export default Home