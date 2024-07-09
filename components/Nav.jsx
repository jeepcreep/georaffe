"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { signIn, signOut, useSession, getProviders } from 'next-auth/react';

const Nav = () => {
    const { data: session } = useSession();

    const [providers, setProviders ] = useState(null);

    const [toggleDropdown, setToggleDropdown] = useState(false);

    useEffect(() => {
        const setupProviders = async () => {
            const response = await getProviders();

            setProviders(response);
        }

        setupProviders();
    }, [])

  return (
    <nav className='flex-between w-full mb-8 pt-3'>

        <Link href="/" className="flex gap-2 flex-center">
            <div className='w-full flex-center flex-col'>
                <div className='w-full flex-center flex-row'>
                    <h1 className='head_text text-center'>
                        GeoRaffe
                    </h1>
                </div>
                <div className='w-full flex-center flex-row'>
                    <h2 className='subhead_text text-center'>
                    <span className='orange_gradient text-center'>Next-level georeferencing</span>
                    </h2>
                </div>
            </div>
        </Link>

        { /* Desktop Nav */ }
        <div className='sm:flex hidden'>
            {session?.user ? (
                <div className='flex gap-3 md:gap-5'>

                    <button type="button" onClick={signOut}
                    className='outline_btn'>
                        Sign Out
                    </button>

                    <Link href="/profile">
                        <Image src={session?.user.image} 
                        width={37}
                        height={37}
                        className='rounded-full'
                        alt='profile'/>
                    </Link>
                </div>
            ): (
                <>
                    {providers && 
                        Object.values(providers).map((provider) => (
                            <button
                                type="button"
                                key={provider.name}
                                onClick={() => signIn(provider.id)}
                                className='black_btn'>
                                Sign In
                            </button>
                        )
                    
                    )
                    }
                </>
            )}
        </div>

        { /* Mobile Nav */ }
        <div className='sm:hidden flex relative'>
            {session?.user ? (
                <div className='flex'>
                    <Image 
                        src="/assets/images/logo.svg" 
                        width={37}
                        height={37}
                        className='rounded-full'
                        alt='profile'
                        onClick={() => setToggleDropdown((prev) => !prev)}
                    />

                    {toggleDropdown && (
                        <div className='dropdown'>
                            <Link
                                href="/profile"
                                className='dropdown_link'
                                onClick={() => setToggleDropdown(false)}
                            >
                                My Profile
                            </Link>
                            <Link
                                href="/create-prompt"
                                className='dropdown_link'
                                onClick={() => setToggleDropdown(false)}
                            >
                                Create Prompt
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    setToggleDropdown(false);
                                    signOut();
                                }}
                                className='mt-5 w-full black_btn'
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {providers && 
                        Object.values(providers).map((provider) => (
                            <button
                                type="button"
                                key={provider.name}
                                onClick={() => signIn(provider.id)}
                                className='black_btn'>
                                Sign In
                            </button>
                        ))
                    }
                </>
            )}
        </div>
    </nav>
  )
}

export default Nav