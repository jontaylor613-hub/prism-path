import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { 
  MapPin, Users, Volume2, Sun, Eye, Shield, 
  Navigation, BookOpen, ArrowLeft 
} from 'lucide-react';

// --- MOCK DATA: Local Safe Spots ---
// We use a central point (Cincinnati) for the demo.
const CENTER_POS = [39.1031, -84.5120];

const SAFE_SPOTS = [
  {
    id: 1,
    name: "The Dragon's Den",
    type: "Hobby Shop",
    position: [39.1031, -84.5120],
    color: "#a855f7", // Purple
    sensory: { noise: "Medium", light: "Low", crowd: "Low" },
    features: ["Quiet Hours (Tue 2-4pm)", "Fidget Friendly"],
    socialStory: "When I walk in, I will smell old paper and cards. The counter is on the left. If I want to play a game, I can ask the person at the desk for a 'Table Pass'. It is okay to just look at the glass cases.",
    buddyActive: 2
  },
  {
    id: 2,
    name: "Main Street Library",
    type: "Library",
    position: [39.1060, -84.5090], // Slightly offset
    color: "#22c55e", // Green
    sensory: { noise: "Silent", light: "Bright", crowd: "Medium" },
    features: ["Private Study Pods", "Safe Zone Geofence"],
    socialStory: "The library doors slide open automatically. The lights are bright fluorescent. I must use my 'whisper voice'. If I get overwhelmed, the 'Quiet Corner' is in the back right.",
    buddyActive: 0
  },
  {
    id: 3,
    name: "Riverfront Sensory Garden",
    type: "Park",
    position: [39.0980, -84.5150], // Slightly offset
    color: "#eab308", // Yellow
    sensory: { noise: "Traffic", light: "Natural", crowd: "High" },
    features: ["Tactile Plants", "Enclosed Fence"],
    socialStory: "The park is outside. It might be windy. The ground is soft rubber. I can touch the plants in the raised beds. If I hear a loud boat horn, I can put on my headphones.",
    buddyActive: 5
  }
];

// Helper to re-center map when clicking a spot
function MapController({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

const SensoryBadge = ({ type, value }) => {
  let color = "bg-slate-700";
  if (value.includes("Low") || value.includes("Silent")) color = "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
  if (value.includes("Medium")) color = "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
  if (value.includes("High") || value.includes("Bright") || value.includes("Traffic")) color = "bg-red-500/20 text-red-300 border-red-500/50";

  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${color} flex items-center gap-1`}>
      {type === 'noise' && <Volume2 size={10} />}
      {type === 'light' && <Sun size={10} />}
      {type === 'crowd' && <Users size={10} />}
      {value}
    </span>
  );
};

export default function SocialMap({ onBack, isLowStim }) {
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [buddyBeacon, setBuddyBeacon] = useState(false);

  return (
    <div className="w-full h-screen fixed inset-0 z-[50] bg-slate-900 flex flex-col md:flex-row">
      
      {/* 1. SIDEBAR INFO PANEL */}
      <div className={`w-full md:w-1/3 h-1/3 md:h-full overflow-y-auto p-6 relative z-20 shadow-2xl border-r ${isLowStim ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/95 border-slate-700 backdrop-blur-md'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold"><ArrowLeft size={18}/> Exit Map</button>
            
            <button 
                onClick={() => setBuddyBeacon(!buddyBeacon)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-all ${buddyBeacon ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-slate-800 text-slate-500 border-slate-600'}`}
            >
                <div className={`w-2 h-2 rounded-full ${buddyBeacon ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                {buddyBeacon ? "BEACON ACTIVE" : "ENABLE BEACON"}
            </button>
        </div>

        {!selectedSpot ? (
            <div className="text-center mt-12 opacity-50">
                <MapPin size={64} className="mx-auto text-slate-600 mb-4" />
                <h2 className="text-xl font-bold text-white">Explore the Village</h2>
                <p className="text-sm text-slate-400 mt-2">Select a circle on the map to see its<br/>Social Story and Sensory Rating.</p>
            </div>
        ) : (
            <div className="animate-in slide-in-from-left duration-300">
                <div className="mb-6">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedSpot.type}</span>
                    <h1 className="text-3xl font-bold text-white leading-tight mb-2">{selectedSpot.name}</h1>
                    
                    {/* Sensory Tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        <SensoryBadge type="noise" value={selectedSpot.sensory.noise} />
                        <SensoryBadge type="light" value={selectedSpot.sensory.light} />
                        <SensoryBadge type="crowd" value={selectedSpot.sensory.crowd} />
                    </div>
                </div>

                {/* Social Story Card */}
                <div className="bg-slate-800 rounded-xl p-5 border-l-4 border-fuchsia-500 mb-4 shadow-lg">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider"><BookOpen size={14} className="text-fuchsia-400"/> Social Story</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{selectedSpot.socialStory}</p>
                </div>

                {/* Features List */}
                <div className="bg-slate-800 rounded-xl p-5 border-l-4 border-cyan-500 shadow-lg">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider"><Shield size={14} className="text-cyan-400"/> Safe Features</h3>
                    <ul className="space-y-2">
                        {selectedSpot.features.map(f => (
                            <li key={f} className="text-slate-300 text-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div> {f}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Buddy Count */}
                {selectedSpot.buddyActive > 0 && (
                    <div className="mt-4 text-center p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <p className="text-indigo-300 text-sm font-bold">{selectedSpot.buddyActive} Friends are here now!</p>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* 2. THE MAP */}
      <div className="w-full md:w-2/3 h-2/3 md:h-full relative z-10 bg-slate-800">
        <MapContainer 
            center={CENTER_POS} 
            zoom={14} 
            scrollWheelZoom={true} 
            style={{ height: "100%", width: "100%" }}
            className="z-0"
        >
            {/* Dark Mode Map Tiles */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={isLowStim 
                    ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" // Light/Clean for Low Stim
                    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark/Cool for Normal
                }
            />
            
            {/* Render Circles instead of Icons */}
            {SAFE_SPOTS.map(spot => (
                <CircleMarker 
                    key={spot.id}
                    center={spot.position}
                    radius={12}
                    pathOptions={{ 
                        color: selectedSpot?.id === spot.id ? 'white' : spot.color, 
                        fillColor: spot.color, 
                        fillOpacity: 0.7,
                        weight: selectedSpot?.id === spot.id ? 4 : 0 
                    }}
                    eventHandlers={{
                        click: () => setSelectedSpot(spot),
                    }}
                >
                    {/* Minimal Popup on Hover */}
                    <Popup className="text-slate-900 font-bold">
                        {spot.name}
                    </Popup>
                </CircleMarker>
            ))}

            {selectedSpot && <MapController center={selectedSpot.position} />}
        </MapContainer>

        {/* Legend Overlay */}
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-slate-700 text-xs text-white z-[1000]">
            <div className="font-bold mb-2 text-slate-400 uppercase tracking-wider">Map Legend</div>
            <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-[#a855f7]"></div> Hobby Shop</div>
            <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-[#22c55e]"></div> Library</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#eab308]"></div> Park</div>
        </div>
      </div>
    </div>
  );
}
```

### Step 2: **Mandatory** CSS Fix
If you skip this, the map will look like a scrambled puzzle.

Go to your **`index.html`** file (in the root folder).
Check if you have this line inside the `<head>` section. If not, add it:

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
```

### Why this works better
1.  **CircleMarker:** Instead of trying to load an image file (which was 404ing and crashing your map), we are drawing simple colored circles using code. They render instantly.
2.  **Dark Mode Tiles:** I switched the map background to "CartoDB Dark Matter". It looks **much** cooler and fits your aesthetic perfectly (unlike the bright white default map).
3.  **Z-Index Fix:** I added `z-[50]` to the container to ensure the map sits *on top* of your background grid, so clicks actually register on the map instead of the background.

**Save, Commit, and Deploy.** The map will work instantly now.
