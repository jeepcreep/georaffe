
"use client";

import { Button, Drawer, Sidebar, Avatar, Tooltip, Badge, Spinner } from "flowbite-react";
import { useState } from "react";
import toast from 'react-hot-toast';
import { MapStatus } from "@utils/enums";
import { MdDelete, MdErrorOutline, MdCheckCircle, MdSchedule } from "react-icons/md";

export default function MyMapsDrawer({ maps, setMaps, selectedMap, setSelectedMap }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);

  const handleDelete = async (mapId, e) => {
    e.stopPropagation();
    
    const hasConfirmed = confirm("Are you sure you want to delete this map? This cannot be undone.");  

    if (hasConfirmed) {
        try {
            await fetch(`/api/map/${mapId}`, {
                method: 'DELETE'
            })

            const filteredMaps = maps.filter((p) => p._id !== mapId)

            setMaps(filteredMaps);
            
            // If the deleted map was selected, deselect it
            if (selectedMap && selectedMap._id === mapId) {
                setSelectedMap(null);
            }

            toast.success('Map deleted successfully!', {
              position: 'top-left',
            })
        } catch (error) {
            console.log(error);
            toast.error('Failed to delete map.');
        }
    }
  }

  const getFullImageUrl = (fileId) => {
    if (!fileId) return "";
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
      setSelectedMap(map);

    } catch (error) {
        console.log(error);
    }
  }

  const StatusBadge = ({ status }) => {
      switch (status) {
          case MapStatus.Ready:
              return <Badge color="success" icon={MdCheckCircle}>Ready</Badge>;
          case MapStatus.Tiling:
          case MapStatus.Uploading:
              return <Badge color="info" icon={Spinner}>Processing</Badge>;
          case MapStatus.ErrorWhileTiling:
              return <Badge color="failure" icon={MdErrorOutline}>Error</Badge>;
          default:
              return <Badge color="gray" icon={MdSchedule}>{status}</Badge>;
      }
  };

  const MyMapsList = ({ data }) => {
    return (
      <div className="flex flex-col gap-3">
        {data.map((map) => (
          <div 
            key={map._id} 
            onClick={() => handleSelectMap(map._id)} 
            className={`
                group relative flex items-center p-3 rounded-lg border border-gray-200 bg-white shadow-sm hover:bg-gray-50 cursor-pointer transition-all
                ${selectedMap && selectedMap._id === map._id ? 'ring-2 ring-cyan-500 border-cyan-500 bg-cyan-50' : ''}
            `}
          >
            {/* Thumbnail */}
            <div className="flex-shrink-0 mr-4">
                <Avatar 
                    img={map.status === MapStatus.Ready ? getFullImageUrl(map.fileId) : null} 
                    size="md"
                    rounded
                    bordered
                    color={map.status === MapStatus.ErrorWhileTiling ? "failure" : "gray"}
                    placeholderInitials={map.title ? map.title.substring(0, 2).toUpperCase() : "??"}
                />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h5 className="text-sm font-semibold text-gray-900 truncate dark:text-white mb-1">
                        {map.title}
                    </h5>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-1">
                    <StatusBadge status={map.status} />
                    {map.controlPoints && map.controlPoints.length > 0 && (
                        <Badge color="gray">{map.controlPoints.length} GCPs</Badge>
                    )}
                </div>

                {map.yearDepicted && (
                    <p className="text-xs text-gray-500 truncate">
                       Year: {map.yearDepicted}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="ml-2">
                <Tooltip content="Delete map" style="light" placement="left">
                    <button 
                        onClick={(e) => handleDelete(map._id, e)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                    >
                        <MdDelete className="w-5 h-5" />
                    </button>
                </Tooltip>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="flex min-h-[50vh] items-center justify-center">
        <Button className='blue_gradient_btn' onClick={() => setIsOpen(true)}>My Maps</Button>
      </div>
      <Drawer open={isOpen} onClose={handleClose} className="drawer w-80 sm:w-96 border-r border-gray-200">
        <Drawer.Header title="My Maps" titleIcon={() => <></>} />
        <Drawer.Items>
            <div className="mt-4">
                {maps && maps.length > 0 ? (
                    <MyMapsList data={maps} />
                ) : (
                    <p className="text-center text-gray-500 mt-10">No maps found. Create one to get started!</p>
                )}
            </div>
        </Drawer.Items>
      </Drawer>
    </>
  );
}
