import "@styles/globals.css";
import Provider from "@components/Provider";
import { ThemeModeScript } from "flowbite-react";
import { Toaster } from 'react-hot-toast';

export const metadata = {
    title: "GeoRaffe",
    description: "GeoRaffe is where you can compare maps through the beauty of georeferencing and georectifying"
}

export default function RootLayout({ children }) {
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
                {children}
            </Provider>
        </body>
    </html>
  )
}
