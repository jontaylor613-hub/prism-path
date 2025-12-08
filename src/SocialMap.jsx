import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { 
  MapPin, Users, Volume2, Sun, Shield, 
  BookOpen, ArrowLeft, Loader2, Navigation 
} from 'lucide-react';

// Default Fallback (Cincinnati) if GPS is denied
const DEFAULT_CENTER = [39.1031, -84.5120];

// --- 1. EXPANDED SENSORY LOGIC ---
const inferSensoryProfile = (tags) => {
  const type = tags.amenity || tags.shop || tags.leisure || tags.tourism || "unknown";
  
  if (type === 'library') {
    return {
      type: "Library",
      color: "#22c55e", // Green
      sensory: { noise: "Silent", light: "Bright", crowd: "Low" },
      story: "Libraries are quiet safe zones. I can find a private desk to read."
    };
  }
  if (type === 'games' || type === 'toys' || type === 'collector') {
    return {
      type: "Game Store",
      color: "#a855f7", // Purple
      sensory: { noise: "High", light: "Dim", crowd: "High" },
      story: "A place for fun. It might be loud with gamers. Good for meeting friends."
    };
  }
  if (type === 'park' || type === 'garden' || type === 'playground') {
    return {
      type: "Park",
      color: "#eab308", // Yellow
      sensory: { noise: "Variable", light: "Natural", crowd: "Medium" },
      story: "Open outdoor space. Good for running or finding a quiet bench."
    };
  }
  if (type === 'community_centre' || type === 'social_centre') {
    return {
      type: "Community Center",
      color: "#3b82f6", // Blue
      sensory: { noise: "Medium", light: "Medium", crowd: "Medium" },
      story: "A hub for activities. Ask the front desk about quiet rooms."
    };
  }
  if (type === 'museum') {
    return {
      type: "Museum",
      color: "#f97316", // Orange
      sensory: { noise: "Low", light: "Dim", crowd: "Variable" },
      story: "A place to look and learn. No touching unless signs say yes."
    };
  }
  if (type === 'cinema') {
    return {
      type: "Cinema",
      color: "#ec4899", // Pink
      sensory: { noise: "Loud", light: "Dark", crowd: "High" },
      story: "Dark room with loud sounds. I can bring headphones or ask for a sensory showing."
    };
  }
  if (type === 'bowling_alley') {
    return {
      type: "Bowling",
      color: "#ef4444", // Red
      sensory: { noise: "Very Loud", light: "Bright", crowd: "High" },
      story: "Loud crashing sounds and music. Wear ear protection if needed."
    };
  }
  
  return {
    type: "Social Spot",
    color: "#94a3b8", // Grey
    sensory: { noise: "Unknown", light: "Unknown", crowd: "Unknown" },
    story: "A local point of interest."
  };
};

// --- 2. SMART SEARCH ENGINE (AUTO-EXPANDING) ---
const fetchRealPlaces = async (lat, lng, radius = 5000) => {
  // Query looks for multiple types at once
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="library"](around:${radius},${lat},${lng});
      node["shop"="games"](around:${radius},${lat},${lng});
      node["leisure"="park"](around:${radius},${lat},${lng});
      node["amenity"="community_centre"](around:${radius},${lat},${lng});
      node["tourism"="museum"](around:${radius},${lat},${lng});
      node["amenity"="cinema"](around:${radius},${lat},${lng});
      node["leisure"="bowling_alley"](around:${radius},${lat},${lng});
    );
    out body;
  `;

  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.elements.map((el, index) => ({
      id: el.id || index,
      name: el.tags.name || inferSensoryProfile(el.tags).type,
      position: [el.lat, el.lon],
      ...inferSensoryProfile(el.tags)
    })).filter(place => place.name !== "Social Spot");
  } catch (error) {
    console.error("Map Data Error:", error);
    return [];
  }
};

// Calculate distance between two coords (Haversine formula) to sort by "closest"
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

// Helper to move map view
function MapController({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const SensoryBadge = ({ type, value }) => {
  let color = "bg-slate-700";
  if (value.includes("Low") || value.includes("Silent") || value.includes("Natural")) color = "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
  if (value.includes("Medium") || value.includes("Variable")) color = "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
  if (value.includes("High") || value.includes("Bright") || value.includes("Loud") || value.includes("Traffic")) color = "bg-red-500/20 text-red-300 border-red-500/50";

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
  const [statusMessage, setStatusMessage] = useState("Scanning local area...");
  const [gpsLocked, setGpsLocked] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(13);

  // --- ON LOAD: Smart Search ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setMyLocation([latitude, longitude]);
          setGpsLocked(true);
          
          // 1. Try Close Search (5km / 3 miles)
          let foundSpots = await fetchRealPlaces(latitude, longitude, 5000);
          
          // 2. If not enough results, Expand Search (50km / 30 miles)
          if (foundSpots.length < 5) {
            setStatusMessage("Expanding search radius...");
            foundSpots = await fetchRealPlaces(latitude, longitude, 50000);
            setZoomLevel(10); // Zoom out to show further spots
          }

          // 3. Sort by Distance and Take Top 20 Closest
          foundSpots.sort((a, b) => {
            const distA = getDistance(latitude, longitude, a.position[0], a.position[1]);
            const distB = getDistance(latitude, longitude, b.position[0], b.position[1]);
            return distA - distB;
          });

          setSpots(foundSpots.slice(0, 20)); // Keep closest 20
          setLoading(false);
        },
        async (error) => {
          console.error("GPS Denied");
          const foundSpots = await fetchRealPlaces(DEFAULT_CENTER[0], DEFAULT_CENTER[1], 5000);
          setSpots(foundSpots);
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
                <p>{statusMessage}</p>
            </div>
        ) : !selectedSpot ? (
            <div className="text-center mt-12 opacity-50">
                <MapPin size={64} className="mx-auto text-slate-600 mb-4" />
                <h2 className="text-xl font-bold text-white">Your Local Safe Village</h2>
                <p className="text-sm text-slate-400 mt-2">
                    We found <strong>{spots.length}</strong> social spots near you.
                    <br/>Click a circle to see details.
                </p>
                {/* List the closest 3 spots as text links for accessibility */}
                <div className="mt-8 text-left space-y-2">
                    <p className="text-xs font-bold uppercase text-slate-500 mb-2">Closest Options:</p>
                    {spots.slice(0, 3).map(spot => (
                        <button key={spot.id} onClick={() => setSelectedSpot(spot)} className="block w-full text-left p-3 bg-slate-800 rounded border border-slate-700 hover:border-cyan-500 transition-colors">
                            <span className="font-bold text-slate-200">{spot.name}</span>
                            <span className="text-xs text-slate-400 block">{spot.type}</span>
                        </button>
                    ))}
                </div>
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

                <div className="bg-slate-800 rounded-xl p-5 border-l-4 border-cyan-500 shadow-lg mb-4">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider"><Shield size={14} className="text-cyan-400"/> Social Potential</h3>
                    <p className="text-slate-300 text-sm">
                        Good place to practice social skills in a {selectedSpot.sensory.noise === "Silent" ? "quiet" : "structured"} setting.
                    </p>
                </div>

                {/* GOOGLE MAPS LINK */}
                <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedSpot.position[0]},${selectedSpot.position[1]}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <Navigation size={18}/> Get Directions
                </a>
            </div>
        )}
      </div>

      {/* MAP */}
      <div className="w-full md:w-2/3 h-2/3 md:h-full relative z-10 bg-slate-800">
        <MapContainer 
            center={myLocation} 
            zoom={zoomLevel} 
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
                    <Popup>You are here</Popup>
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

            <MapController center={myLocation} zoom={zoomLevel} />
        </MapContainer>

        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-slate-700 text-xs text-white z-[1000]">
            <div className="font-bold mb-2 text-slate-400 uppercase tracking-wider">Map Legend</div>
            <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-[#a855f7]"></div> Game/Card Shop</div>
            <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-[#22c55e]"></div> Library</div>
            <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-[#eab308]"></div> Park</div>
            <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-[#f97316]"></div> Museum</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ec4899]"></div> Cinema</div>
        </div>
      </div>
    </div>
  );
}
