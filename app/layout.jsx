import "@styles/globals.css";

import dynamic from 'next/dynamic'

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
        </head>
        <body>
            <Toaster />
            <Provider>
    
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