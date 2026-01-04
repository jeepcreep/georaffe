
"use client";

import { Button, Drawer, Sidebar, Avatar, Dropdown, Spinner, Tooltip, Badge } from "flowbite-react";
import { useState } from "react";
import toast from 'react-hot-toast';
import { MapStatus } from "@utils/enums";
import { MdDelete } from "react-icons/md";

import {
    HiDotsVertical
  } from "react-icons/hi";

export default function MyMapsDrawer({ maps, setMaps, selectedMap, setSelectedMap }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);

  const handleDelete = async (mapId, e) => {
    e.stopPropagation();
    
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

  const getFullImageUrl = (fileId) => {
    const filenameWithoutExt = fileId.substring(0, fileId.lastIndexOf('.'));
    let fullUrl = `${process.env.NEXT_PUBLIC_TILES_HOST_URL}/${filenameWithoutExt}/tiles/0/0/0.png`;
    return fullUrl;
  }

  const handleSelectMap = async (mapId) => {
    try {
      const response = await fetch(`/api/map/${mapId}`, {
          method: 'GET'
      })

      const map = await response.json();
      // we need to wrap it in an array because this is the expected underlying data structure
      const responseMap = map;
      setSelectedMap(responseMap);

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
          <Sidebar.Item key={map._id} onClick={() => handleSelectMap(map._id)} className={selectedMap._id == map._id ? 'selected_item selectable_item' : 'selectable_item'}>
            {map.status == MapStatus.Ready ? ( 
            <div className="flex h-full flex-row justify-between py-2">
              <div className='flex flow-row px-2 text-cyan-600 hover:no-underline dark:text-cyan-500'>
                <Avatar img={getFullImageUrl(map.fileId)} className="px-2"/>
                <Tooltip content={selectedMap.controlPoints.length + ' control points'} style="light">
                  <span>{map.title}</span>
                </Tooltip>
              </div>
              <Tooltip content="Delete map" style="light">
                <Badge size="sm" color="failure" icon={MdDelete} onClick={(e) => handleDelete(map._id, e)} />
              </Tooltip>
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
        <Button className='blue_gradient_btn' onClick={() => setIsOpen(true)}>My Maps</Button>
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
