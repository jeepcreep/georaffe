import "@styles/globals.css";

import dynamic from 'next/dynamic'

import Nav from "@components/Nav";
import Provider from "@components/Provider";
import MyFooter from '@components/MyFooter';

import { Suspense } from 'react';

import Script from 'next/script'

import { ThemeModeScript } from "flowbite-react";
import { Toaster } from 'react-hot-toast';

import Loading from './loading';

export const metadata = {
    title: "GeoRaffe",
    description: "GeoRaffe is where you can compare maps through the beauty of georeferencing and georectifying"
}

const RootLayout = ( {children} ) => {
  return (
    <html lang="en">
        <head>
            <ThemeModeScript />
            <link rel="manifest" href="/site.webmanifest" />
            <link rel="icon" href="/favicon.ico" sizes="any" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" type="image/png" sizes="180x180" />
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
            <MyFooter />
        </body>
    </html>
  )
}

export default RootLayout