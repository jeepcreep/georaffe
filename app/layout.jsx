import "@styles/globals.css";

import Nav from "@components/Nav";
import Provider from "@components/Provider";
import MyMapsDrawer from '@components/MyMapsDrawer';

import { Suspense } from 'react';

import Script from 'next/script'

import { ThemeModeScript } from "flowbite-react";
import { Toaster } from 'react-hot-toast';

import Loading from './loading';

export const metadata = {
    title: "GeoRef",
    description: "Compare maps through the magic of georeferencing"
}

const RootLayout = ( {children} ) => {
  return (
    <html lang="en">
        <head>
            <ThemeModeScript />
            {/* <Script src="https://unpkg.com/leaflet.imageoverlay.arrugator@1.4.0/dist/leaflet.imageoverlay.arrugator.js" /> */}
            <Script src="https://cdnjs.cloudflare.com/ajax/libs/numeric/1.2.6/numeric.min.js" />
            <Script src="/scripts/leaflet.imageoverlay.arrugator.js" />
        </head>
        <body>
            <Toaster />
            <Provider>
    
                <div className="main">
                    <div className="gradient" />
                </div>
                <main className="app">
                    <Nav />
                    <Suspense fallback={<Loading />}>
                        {children}
                    </Suspense>
                </main>
            </Provider>
        </body>
    </html>
  )
}

export default RootLayout