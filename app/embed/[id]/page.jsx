import EmbedMap from '@components/EmbedMap';
import { getMapById } from '@utils/dbTools';

export default async function EmbedPage({ params }) {
    try {
        const map = await getMapById(params.id);

        if (!map) {
            return <div className="flex items-center justify-center h-screen text-gray-500">Map not found</div>;
        }
        
        // Only allow Public maps to be embedded
        if (map.scope !== 'public') {
             return <div className="flex items-center justify-center h-screen text-gray-500">This map is private and cannot be embedded.</div>;
        }
    
        // Serialize the map object (convert Mongoose doc to plain object)
        const serializedMap = JSON.parse(JSON.stringify(map));
    
        return (
            <main className="w-full h-screen">
                <EmbedMap selectedMap={serializedMap} />
            </main>
        );
    } catch (error) {
        console.error("Error loading embed map:", error);
        return <div className="flex items-center justify-center h-screen text-red-500">Error loading map</div>;
    }
}
