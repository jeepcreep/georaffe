import React from 'react'
import dynamic from "next/dynamic";

const DEFAULT_CENTER = [38.907132, -77.036546]

const Map = dynamic(() => import("../components/Map"), {
  loading: () => <p>A map is loading</p>,
  ssr: false,
});

const Home = () => {
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
        
        <Map />
    </section>
  )
}

export default Home