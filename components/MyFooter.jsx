
"use client";

import { Footer } from "flowbite-react";
import Image from 'next/image';

const MyFooter = () => {
  return (
    <Footer container>
      <div className="w-full text-center">
      <Footer.Divider />
        <div className="w-full justify-between sm:flex sm:items-center sm:justify-between">
          <Footer.Brand
            href="https://georaffe.org"
            src="/assets/icons/georaffe.png"
            alt="Georaffe Logo"
            name="Georaffe"
          />
          <Footer.LinkGroup>
            <Footer.Link href="/about">About</Footer.Link>
            <Footer.Link href="/how-to">How to</Footer.Link>
          </Footer.LinkGroup>
        </div>
       
        <div className='w-full flex-center flex-col'>
          <div className='w-full flex-center flex-row text-gray-500'>
            Made with  
              <Image 
                      src="/assets/icons/heart.svg" 
                      width={16}
                      height={16}
                      className='rounded-full mx-1'
                      alt='logo'
                  />
              in Hamburg 
            </div>
        </div>
        <Footer.Copyright href="https://www.linkedin.com/in/nils-weber-hamburg/" by="Nils Weber" year={2024} />
      </div>
    </Footer>
  );
}

export default MyFooter;
