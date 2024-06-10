
"use client";

import { Button, Drawer, Sidebar, Avatar, Dropdown, Spinner } from "flowbite-react";
import { useState } from "react";

import toast from 'react-hot-toast';

import { MapStatus } from "@utils/enums";

import {
    HiDotsVertical
  } from "react-icons/hi";

export default function MyMapsDrawer({ maps, setMaps, selectedMap, setSelectedMap }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);

  const handleDelete = async (mapId) => {
    const hasConfirmed = confirm("Are you sure you want to delete this map?");  

    if (hasConfirmed) {
        try {
            await fetch(`/api/map/${mapId}`, {
                method: 'DELETE'
            })

            const filteredMaps = maps.filter((p) => p._id !== mapId)

            setMaps(filteredMaps);

            toast.success('Map deleted successfully!', {
              position: 'top-left',
            })
        } catch (error) {
            console.log(error);
        }
    }
  }

  const handleSelectMap = async (mapId) => {
    try {
      const response = await fetch(`/api/map/${mapId}`, {
          method: 'GET'
      })

      const map = await response.json();
      // we need to wrap it in an array because this is the expected underlying data structure
      setSelectedMap([map]);

    } catch (error) {
        console.log(error);
    }
  }
// * tiles hochladen
// * status hier anzeigen
  const MyMapsList = ({ data }) => {
    return (
      <>
        {data.map((map) => (
          // <Sidebar.Item key={map._id} href={`/api/map/${map._id}`}>
          <Sidebar.Item key={map._id} onClick={() => handleSelectMap(map._id)}>
            {map.status == MapStatus.Ready ? ( 
            <div className="flex h-full flex-row justify-between py-2">
              <div  className="flex flow-row px-2 text-cyan-600 hover:no-underline dark:text-cyan-500">
                <Avatar img={map.fileUrl} className="px-2"/>
                <span>{map.title}</span>{(selectedMap != null && selectedMap._id == map._id) ? ( <div>(*)</div>) : (<></>)}
              </div>
              <Dropdown placement="left" label="" dismissOnClick={false} renderTrigger={() => <span className="cursor-pointer"><HiDotsVertical /></span>}>
                <Dropdown.Item onClick={() => handleDelete(map._id)}>Delete</Dropdown.Item>
              </Dropdown>
            </div>
            ): (
              <div className="flex h-full flex-row justify-between py-2 text-gray-300">
                <span>{map.title} (processing)</span><Spinner aria-label="Default status example" />
              </div>
            )}
          </Sidebar.Item>
        ))}
      </>
    )
  }

  return (
    <>
      <div className="flex min-h-[50vh] items-center justify-center">
        <Button onClick={() => setIsOpen(true)}>My Maps</Button>
      </div>
      <Drawer open={isOpen} onClose={handleClose} className="drawer">
        <Drawer.Header title="My Maps" />
        <Drawer.Items>
        <Sidebar
            aria-label="Sidebar with multi-level dropdown example"
            className="[&>div]:bg-transparent [&>div]:p-0"
          >
            <div className="flex h-full flex-col justify-between py-2">
              <div>
                <Sidebar.Items>
                    <Sidebar.ItemGroup>
                      <div className='mt-16'>
                        <MyMapsList data={maps} />
                      </div>
                    </Sidebar.ItemGroup>
                </Sidebar.Items>
              </div>
            </div>

            </Sidebar>
          
        </Drawer.Items>
      </Drawer>
    </>
  );
}
