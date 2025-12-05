import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { 
  MapPin, Users, Volume2, Sun, Shield, 
  BookOpen, ArrowLeft, Loader2 
} from 'lucide-react';

// Default Fallback (Cincinnati) if GPS is denied
const DEFAULT_CENTER = [39.1031, -84.5120];

// --- 1. SENSORY LOGIC ENGINE ---
// This function takes a raw map place and "guesses" the sensory environment
const inferSensoryProfile = (tags) => {
  const type = tags.amenity || tags.shop || tags.leisure || "unknown";
  
  if (type === 'library') {
    return {
      type: "Library",
      color: "#22c55e", // Green
      sensory: { noise: "Silent", light: "Bright", crowd: "Low" },
      story: "Libraries are quiet safe zones. I can find a private desk to read. The lights are bright, but nobody will shout here."
    };
  }
  if (type === 'games' || type === 'toys' || type === 'collector') {
    return {
      type: "Game Store",
      color: "#a855f7", // Purple
      sensory: { noise: "High", light: "Dim", crowd: "High" },
      story: "This is a place for fun. It might be loud with people playing cards. It is a great place to meet friends who like the same games I do."
    };
  }
  if (type === 'park' || type === 'garden' || type === 'playground') {
    return {
      type: "Park",
      color: "#eab308", // Yellow
      sensory: { noise: "Variable", light: "Natural", crowd: "Medium" },
      story: "An open outdoor space. The ground might be uneven. It is a good place to run or find a quiet bench away from people."
    };
  }
  if (type === 'community_centre' || type === 'social_centre') {
    return {
      type: "Community Center",
      color: "#3b82f6", // Blue
      sensory: { noise: "Medium", light: "Medium", crowd: "Medium" },
      story: "A place for group activities. There may be classes happening. I can ask the front desk what is happening today."
    };
  }
  
  return {
    type: "Social Spot",
    color: "#94a3b8", // Grey
    sensory: { noise: "Unknown", light: "Unknown", crowd: "Unknown" },
    story: "A local point of interest."
  };
};

// --- 2. LIVE DATA FETCHING ---
const fetchRealPlaces = async (lat, lng) => {
  // We search for libraries, game shops, parks, and community centers within 5000 meters (3 miles)
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="library"](around:5000,${lat},${lng});
      node["shop"="games"](around:5000,${lat},${lng});
      node["shop"="collector"](around:5000,${lat},${lng});
      node["leisure"="park"](around:5000,${lat},${lng});
      node["amenity"="community_centre"](around:5000,${lat},${lng});
    );
    out body;
  `;

  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    return data.elements.map((el, index) => {
      const profile = inferSensoryProfile(el.tags);
      return {
        id: el.id || index,
        name: el.tags.name || profile.type, // Use generic name if specific one is missing
        position: [el.lat, el.lon],
        ...profile
      };
    }).filter(place => place.name !== "Social Spot"); // Remove generic unnamed spots to keep it clean
  } catch (error) {
    console.error("Map Data Error:", error);
    return [];
  }
};

// Helper to move map view
function MapController({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

const SensoryBadge = ({ type, value }) => {
  let color = "bg-slate-700";
  if (value.includes("Low") || value.includes("Silent") || value.includes("Natural")) color = "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
  if (value.includes("Medium") || value.includes("Variable")) color = "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
  if (value.includes("High") || value.includes("Bright")) color = "bg-red-500/20 text-red-300 border-red-500/50";

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
  const [myLocation, setMyLocation] = useState(DEFAULT_CENTER);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gpsLocked, setGpsLocked] = useState(false);

  // --- ON LOAD: Get GPS & Fetch Data ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setMyLocation([latitude, longitude]);
          setGpsLocked(true);
          
          // Fetch Real Data
          const realSpots = await fetchRealPlaces(latitude, longitude);
          setSpots(realSpots);
          setLoading(false);
        },
        async (error) => {
          console.error("GPS Denied, using default");
          // Fallback fetch for default location
          const realSpots = await fetchRealPlaces(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
          setSpots(realSpots);
          setLoading(false);
        }
      );
    }
  }, []);

  return (
    <div className="w-full h-screen fixed inset-0 z-[50] bg-slate-900 flex flex-col md:flex-row">
      
      {/* SIDEBAR */}
      <div className={`w-full md:w-1/3 h-1/3 md:h-full overflow-y-auto p-6 relative z-20 shadow-2xl border-r ${isLowStim ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/95 border-slate-700 backdrop-blur-md'}`}>
        
        <div className="flex justify-between items-center mb-6">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold"><ArrowLeft size={18}/> Exit Map</button>
            <div className="text-xs text-slate-500 font-mono">
                {gpsLocked ? "GPS ACTIVE" : "GPS OFF"}
            </div>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Loader2 size={48} className="animate-spin mb-4 text-cyan-500"/>
                <p>Scanning local area...</p>
            </div>
        ) : !selectedSpot ? (
            <div className="text-center mt-12 opacity-50">
                <MapPin size={64} className="mx-auto text-slate-600 mb-4" />
                <h2 className="text-xl font-bold text-white">Your Local Safe Village</h2>
                <p className="text-sm text-slate-400 mt-2">
                    We found <strong>{spots.length}</strong> social spots near you.
                    <br/>Click a circle to see details.
                </p>
            </div>
        ) : (
            <div className="animate-in slide-in-from-left duration-300">
                <div className="mb-6">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedSpot.type}</span>
                    <h1 className="text-3xl font-bold text-white leading-tight mb-2">{selectedSpot.name}</h1>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                        <SensoryBadge type="noise" value={selectedSpot.sensory.noise} />
                        <SensoryBadge type="light" value={selectedSpot.sensory.light} />
                        <SensoryBadge type="crowd" value={selectedSpot.sensory.crowd} />
                    </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-5 border-l-4 border-fuchsia-500 mb-4 shadow-lg">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider"><BookOpen size={14} className="text-fuchsia-400"/> Expected Environment</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{selectedSpot.story}</p>
                </div>

                <div className="bg-slate-800 rounded-xl p-5 border-l-4 border-cyan-500 shadow-lg">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider"><Shield size={14} className="text-cyan-400"/> Social Potential</h3>
                    <p className="text-slate-300 text-sm">
                        {selectedSpot.type === 'Game Store' && "High likelihood of meeting peers with similar interests."}
                        {selectedSpot.type === 'Library' && "Good for parallel play or quiet reading groups."}
                        {selectedSpot.type === 'Park' && "Open unstructured play area."}
                        {selectedSpot.type === 'Community Center' && "Structured social activities likely available."}
                    </p>
                </div>
            </div>
        )}
      </div>

      {/* MAP */}
      <div className="w-full md:w-2/3 h-2/3 md:h-full relative z-10 bg-slate-800">
        <MapContainer 
            center={myLocation} 
            zoom={13} 
            scrollWheelZoom={true} 
            style={{ height: "100%", width: "100%" }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={isLowStim 
                    ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                }
            />
            
            {/* User Location */}
            {gpsLocked && (
                <CircleMarker center={myLocation} radius={8} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 1 }}>
                    <Popup>You</Popup>
                </CircleMarker>
            )}

            {/* Live Spots */}
            {spots.map(spot => (
                <CircleMarker 
                    key={spot.id}
                    center={spot.position}
                    radius={10}
                    pathOptions={{ 
                        color: selectedSpot?.id === spot.id ? 'white' : spot.color, 
                        fillColor: spot.color, 
                        fillOpacity: 0.8,
                        weight: selectedSpot?.id === spot.id ? 4 : 0 
                    }}
                    eventHandlers={{
                        click: () => setSelectedSpot(spot),
                    }}
                >
                    <Popup className="text-slate-900 font-bold">{spot.name}</Popup>
                </CircleMarker>
            ))}

            <MapController center={myLocation} />
        </MapContainer>

        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-slate-700 text-xs text-white z-[1000]">
            <div className="font-bold mb-2 text-slate-400 uppercase tracking-wider">Map Legend</div>
            <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-[#a855f7]"></div> Game/Card Shop</div>
            <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-[#22c55e]"></div> Library</div>
            <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-[#eab308]"></div> Park</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div> Community Ctr</div>
        </div>
      </div>
    </div>
  );
}
