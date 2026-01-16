import { Marker, Popup } from 'react-leaflet';
import { Button } from "flowbite-react";

export default function MapMarkers({ markers, deleteMarker, isEditable }) {
    if (!markers) return null;

    return (
        <>
            {markers.map((marker, idx) => (
                <Marker key={marker._id || idx} position={[marker.lat, marker.lng]}>
                    <Popup>
                        <div className="flex flex-col gap-2 min-w-[150px]">
                            <h3 className="font-bold text-lg text-gray-900">{marker.title}</h3>
                            {marker.description && <p className="text-sm text-gray-700">{marker.description}</p>}
                            {marker.link && (
                                <a href={marker.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                    More Info &rarr;
                                </a>
                            )}
                            {isEditable && deleteMarker && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                    <Button size="xs" color="failure" onClick={() => deleteMarker(marker._id)}>
                                        Delete Marker
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
}
