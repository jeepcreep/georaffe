
"use client";

import { Button, FileInput, Label, Modal, TextInput, Spinner, RangeSlider } from "flowbite-react";
import { useState } from "react";

import toast from 'react-hot-toast';

export default function CreateMapModal ({maps, setMaps }) {
  const [openModal, setOpenModal] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  function onCloseModal() {
    setOpenModal(false);
    setTitle('');
    setFile(null);
    setZoomLevel(5);
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    // first create the map entity in DB
    try {
      const createNewMapResponse = await fetch('/api/map/new', {
        method: 'POST',
        body: JSON.stringify({
            userId: 1,
            title: title,
            maxZoomLevel: zoomLevel
        })
      })

      if (createNewMapResponse.ok) {
        const newMap = await createNewMapResponse.json();

        setMaps( // Replace the state
        [ // with a new array
          ...maps, // that contains all the old items
          newMap // and one new item at the end
        ]
        );

        toast.success('New map created successfully!', {
          position: 'top-left',
        })
        setOpenModal(false);

        // Store the file locally, tile it and upload it to a storage server (e.g. AWS S3)
        const uploadImageResponse = await fetch(`/api/map/${newMap._id}/upload?maxZoomLevel=${zoomLevel}`, {
          method: 'POST',
          body: formData,
        });

        if (uploadImageResponse.status == 201) {
            const result = await uploadImageResponse.json();
            // setOldMapUrl(result.s3ImageUrl);
            toast.success('Image is being processed, this may take a few seconds.', {
              position: 'top-left',
            })
        }
      }
    } catch (error) {
        console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>

      <Button onClick={() => setOpenModal(true)}>Upload new map</Button>
      <Modal show={openModal} size="md" onClose={onCloseModal} popup>
        <Modal.Header />
        <Modal.Body>
        <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Upload new map for georeferencing</h3>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="map-title" value="Map's Title" />
                </div>
                <TextInput
                  id="map-title"
                  placeholder="something meaningful..."
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </div>

              <div className="flex w-full items-center justify-center">
                <Label
                  htmlFor="dropzone-file"
                  className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                >
                  <div className="flex flex-col items-center justify-center pb-6 pt-5">
                    <svg
                      className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>

                    { file == null ? (
                      <div>
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PNG or JPG (MAX. 20MB)</p>
                      </div>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{file.name}</p>
                      )}
                  </div>
                  <FileInput id="dropzone-file" className="hidden" onChange={handleFileChange}/>
                </Label>
              </div>

              <div>
                <div className="mb-1 block">
                  <Label htmlFor="default-range" value="Max. zoom level" />: {zoomLevel}
                </div>
                <RangeSlider 
                  id="zoom-level" 
                  min="1" 
                  max="6" 
                  value={zoomLevel}
                  onChange={(event) => setZoomLevel(event.target.value)}/>
                <div className="flex h-full flex-row justify-between py-2 text-gray-400 text-xs">
                      The higher, the longer it takes to process the image
                </div>
              </div>

              <div className="w-full">
                <Button type="submit" disabled={isLoading}>
                  {
                  isLoading ? (
                    <div>
                    <Spinner aria-label="Spinner button example" size="sm" /><span className="pl-3">Creating...</span> 
                    </div> ) : ( 'Create' )
                  }
                </Button>
              </div>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
}
