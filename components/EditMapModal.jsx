
"use client";

import { Button, FileInput, Label, Modal, TextInput, Spinner, RangeSlider, Dropdown } from "flowbite-react";
import { useState } from "react";

import { MapScope, MapScopes, MapScopeInfo, TransformationType, TransformationTypes, TransformationTypeLabels } from "@utils/enums";

import { MdOutlineArrowDropDown } from "react-icons/md";

import toast from 'react-hot-toast';

export default function EditMapModal ({ maps, setMaps, userId, selectedMap, setSelectedMap }) {
  const [openModal, setOpenModal] = useState(false);
  const [title, setTitle] = useState(selectedMap.title);
  const [year, setYear] = useState(selectedMap.yearDepicted);
  const [location, setLocation] = useState(selectedMap.locationDepicted);
  const [scope, setScope] = useState(selectedMap.scope)
  const [scopeInfo, setScopeInfo] = useState(MapScopeInfo[selectedMap.scope])
  const [transformationType, setTransformationType] = useState(selectedMap.transformationType || TransformationType.Polynomial);
  const [isLoading, setIsLoading] = useState(false);

  function onCloseModal() {
    setOpenModal(false);
    setTitle(selectedMap.title);
    setYear(selectedMap.yearDepicted);
    setLocation(selectedMap.locationDepicted);
    setScope(selectedMap.scope);
    setTransformationType(selectedMap.transformationType || TransformationType.Polynomial);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // first create the map entity in DB
    try {
      const editMapResponse = await fetch('/api/map/' + selectedMap._id, {
        method: 'PATCH',
        body: JSON.stringify({
            userId,
            title,
            scope,
            transformationType,
            year,
            location
        })
      })

      if (editMapResponse.ok) {
        const modifiedMap = await editMapResponse.json();

        const modifiedMaps = maps.map((map) => {
          if (map.id === modifiedMap._id) return { ...map, ...modifiedMap}
          else return map 
        })

        setMaps(modifiedMaps)
        setSelectedMap(modifiedMap);

        toast.success('Saving map changes was successful!', {
          position: 'top-left',
        })
        setOpenModal(false);
      }
    } catch (error) {
        console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>

      <Button className='blue_gradient_btn' onClick={() => setOpenModal(true)}>Edit map details</Button>
      <Modal show={openModal} size="md" onClose={onCloseModal} popup>
        <Modal.Header />
        <Modal.Body>
        <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Edit map '{selectedMap.title}'</h3>
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
                  sizing="sm"
                />
              </div>

              <div>
                <div className="mb-2 block">
                  <Label htmlFor="map-year" value="Year, Decade or Century depicted" />
                </div>
                <TextInput
                  id="map-year"
                  placeholder="e.g. 1723, 1900s, 1840s..."
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  required
                  sizing="sm"
                />
              </div>

              <div>
                <div className="mb-2 block">
                  <Label htmlFor="map-location" value="Location depicted" />
                </div>
                <TextInput
                  id="map-location"
                  placeholder="which location does the map depict?"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  required
                  sizing="sm"
                />
              </div>
                <div className="block">
                  <div className="mb-2">
                    Scope
                  </div>

                  <Dropdown dismissOnClick={true} 
                    renderTrigger={() => <Button size="xs" className='blue_gradient_btn'>{scope}<MdOutlineArrowDropDown 
                    className="ml-2 h-5 w-5"/></Button>}>
                  {MapScopes.map(mapScope => 
                    <Dropdown.Item 
                      className={mapScope == scope ? 'selected_item' : ''}
                      onClick={() => {
                          setScope(mapScope);
                          setScopeInfo(MapScopeInfo[mapScope]);
                          }}>
                        {mapScope}
                    </Dropdown.Item>
                  )}
                </Dropdown>
                </div>
                
                <div className="flex flex-row justify-between text-gray-400 text-xs">
                      {scopeInfo}
                </div>

                <div className="block">
                  <div className="mb-2">
                    Transformation Type
                  </div>

                  <Dropdown dismissOnClick={true} 
                    renderTrigger={() => <Button size="xs" className='blue_gradient_btn'>{TransformationTypeLabels[transformationType]}<MdOutlineArrowDropDown 
                    className="ml-2 h-5 w-5"/></Button>}>
                  {TransformationTypes.map(type => 
                    <Dropdown.Item 
                      key={type}
                      className={type == transformationType ? 'selected_item' : ''}
                      onClick={() => setTransformationType(type)}>
                        {TransformationTypeLabels[type]}
                    </Dropdown.Item>
                  )}
                </Dropdown>
                </div>
   
              
              <div className="w-full">
                <Button className='blue_gradient_btn' type="submit" disabled={isLoading}>
                  {
                  isLoading ? (
                    <div>
                    <Spinner aria-label="Spinner button example" size="sm" /><span className="pl-3">Saving...</span> 
                    </div> ) : ( 'Save changes' )
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
