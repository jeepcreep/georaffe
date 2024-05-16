import "@styles/globals.css";

import Nav from "@components/Nav";
import Provider from "@components/Provider";

import { Suspense } from 'react';

export const metadata = {
    title: "GeoRef",
    description: "Compare maps through the magic of georeferencing"
}

const RootLayout = ( {children} ) => {
  return (
    <html lang="en">
        <body>
            <Provider>
                <div className="main">
                    <div className="gradient" />
                </div>

                <main className="app">
                    <Nav />
                    <Suspense>
                        {children}
                    </Suspense>
                </main>
            </Provider>
        </body>
    </html>
  )
}

export default RootLayout