import Nav from "@components/Nav";
import MyFooter from '@components/MyFooter';
import { Suspense } from 'react';
import Loading from './loading';

export default function MainLayout({ children }) {
  return (
    <>
        <main className="app">
            <Nav />
            <Suspense fallback={<Loading />}>
                {children}
            </Suspense>
        </main>
        <MyFooter />
    </>
  )
}
