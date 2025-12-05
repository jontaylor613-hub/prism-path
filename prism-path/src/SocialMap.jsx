import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { 
  MapPin, Users, Volume2, Sun, Eye, Shield, 
  Navigation, Info, BookOpen, Clock, ArrowLeft 
} from 'lucide-react';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- MOCK DATA: Local Safe Spots ---
const SAFE_SPOTS = [
  {
    id: 1,
    name: "The Dragon's Den Game Store",
    type: "Hobby Shop",
    position: [39.1031, -84.5120], // Example coords (Cincinnati)
    sensory: { noise: "Medium", light: "Low", crowd: "Low" },
    features: ["Quiet Hours (Tue 2-4pm)", "Fidget Friendly"],
    socialStory: "When I walk in, I will smell old paper and cards. The counter is on the left. If I want to play a game, I can ask the person at the desk for a 'Table Pass'. It is okay to just look at the glass cases.",
    buddyActive: 2 // 2 people looking for buddies here
  },
  {
    id: 2,
    name: "Main Street Library",
    type: "Library",
    position: [39.1050, -84.5090],
    sensory: { noise: "Silent", light: "Bright", crowd: "Medium" },
    features: ["Private Study Pods", "Safe Zone Geofence"],
    socialStory: "The library doors slide open automatically. The lights are bright fluorescent. I must use my 'whisper voice'. If I get overwhelmed, the 'Quiet Corner' is in the back right, behind the biographies.",
    buddyActive: 0
  },
  {
    id: 3,
    name: "Riverfront Park Sensory Garden",
    type: "Park",
    position: [39.0980, -84.5150],
    sensory: { noise: "Medium (Traffic)", light: "Natural", crowd: "High (Weekends)" },
    features: ["Tactile Plants", "Enclosed Fence"],
    socialStory: "The park is outside. It might be windy. The ground is soft rubber. I can touch the plants in the raised beds. If I hear a loud boat horn, I can put on my headphones.",
    buddyActive: 5
  }
];

// --- COMPONENTS ---

const SensoryBadge = ({ type, value }) => {
  let color = "bg-slate-700";
  if (value.includes("Low") || value.includes("Silent")) color = "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
  if (value.includes("Medium")) color = "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
  if (value.includes("High") || value.includes("Bright")) color = "bg-red-500/20 text-red-300 border-red-500/50";

  return (
    <span className={`text-xs px-2 py-1 rounded border ${color} flex items-center gap-1`}>
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
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'story'

  return (
    <div className="w-full h-[calc(100vh-100px)] relative flex flex-col md:flex-row">
      
      {/* SIDEBAR / OVERLAY */}
      <div className={`w-full md:w-1/3 h-1/2 md:h-full overflow-y-auto p-6 z-10 shadow-2xl flex flex-col border-r ${isLowStim ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/95 border-slate-700 backdrop-blur-md'}`}>
        <div className="mb-6 flex justify-between items-center">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ArrowLeft size={16}/> Back</button>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${buddyBeacon ? 'text-green-400 animate-pulse' : 'text-slate-500'}`}>Buddy Beacon</span>
                <button 
                    onClick={() => setBuddyBeacon(!buddyBeacon)}
                    className={`w-10 h-6 rounded-full p-1 transition-colors ${buddyBeacon ? 'bg-green-500' : 'bg-slate-700'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${buddyBeacon ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
            </div>
        </div>

        {!selectedSpot ? (
            <div className="text-center mt-10">
                <MapPin size={48} className="mx-auto text-slate-600 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">The Safe Village</h2>
                <p className="text-slate-400">Select a location on the map to see its Sensory Rating and Social Story.</p>
                {buddyBeacon && (
                    <div className="mt-6 bg-green-500/10 border border-green-500/30 p-4 rounded-xl text-green-300 text-sm">
                        <Users className="inline-block mr-2 mb-1" size={16}/>
                        <strong>Beacon Active:</strong> Other families can see you are looking for a meetup nearby for the next 60 mins.
                    </div>
                )}
            </div>
        ) : (
            <div className="animate-in slide-in-from-left duration-300">
                <button onClick={() => setSelectedSpot(null)} className="text-xs text-slate-400 hover:text-white mb-4">← Clear Selection</button>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedSpot.name}</h2>
                <span className="text-fuchsia-400 text-sm font-bold uppercase tracking-wider">{selectedSpot.type}</span>
                
                {/* TABS */}
                <div className="flex gap-4 border-b border-slate-700 mt-6 mb-6">
                    <button 
                        onClick={() => setViewMode('map')}
                        className={`pb-2 text-sm font-bold transition-colors ${viewMode === 'map' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}
                    >
                        Sensory Details
                    </button>
                    <button 
                        onClick={() => setViewMode('story')}
                        className={`pb-2 text-sm font-bold transition-colors ${viewMode === 'story' ? 'text-fuchsia-400 border-b-2 border-fuchsia-400' : 'text-slate-500 hover:text-white'}`}
                    >
                        Social Story
                    </button>
                </div>

                {viewMode === 'map' ? (
                    <div className="space-y-6">
                        {/* Sensory Ratings */}
                        <div>
                            <h3 className="text-slate-300 text-sm font-bold mb-3 flex items-center gap-2"><Eye size={14}/> Sensory Heat Map</h3>
                            <div className="flex flex-wrap gap-2">
                                <SensoryBadge type="noise" value={selectedSpot.sensory.noise} />
                                <SensoryBadge type="light" value={selectedSpot.sensory.light} />
                                <SensoryBadge type="crowd" value={selectedSpot.sensory.crowd} />
                            </div>
                        </div>

                        {/* Features */}
                        <div>
                            <h3 className="text-slate-300 text-sm font-bold mb-3 flex items-center gap-2"><Shield size={14}/> Safe Features</h3>
                            <ul className="space-y-2">
                                {selectedSpot.features.map(f => (
                                    <li key={f} className="text-slate-400 text-sm flex items-center gap-2">
                                        <Check className="text-green-500" size={14}/> {f}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Buddy Status */}
                        {selectedSpot.buddyActive > 0 && (
                            <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl flex items-center gap-3">
                                <div className="bg-indigo-500 w-2 h-2 rounded-full animate-pulse"></div>
                                <span className="text-indigo-300 text-sm"><strong>{selectedSpot.buddyActive} Families</strong> are here looking for buddies right now.</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-slate-800 p-4 rounded-xl border-l-4 border-fuchsia-500">
                            <h3 className="text-white font-bold mb-2 flex items-center gap-2"><BookOpen size={16}/> Before You Go</h3>
                            <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">{selectedSpot.socialStory}</p>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-xl border-l-4 border-cyan-500">
                            <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Navigation size={16}/> Arrival Plan</h3>
                            <ul className="list-decimal pl-5 space-y-2 text-slate-300 text-sm">
                                <li>Park in the side lot (less traffic).</li>
                                <li>Enter through the double glass doors.</li>
                                <li>The information desk is straight ahead.</li>
                                <li>Find a quiet spot before starting activity.</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* MAP AREA */}
      <div className="w-full md:w-2/3 h-1/2 md:h-full bg-slate-800 relative z-0">
        <MapContainer center={[39.1031, -84.5120]} zoom={14} scrollWheelZoom={true} className="w-full h-full grayscale-[50%] invert-[90%]">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {SAFE_SPOTS.map(spot => (
                <Marker 
                    key={spot.id} 
                    position={spot.position}
                    eventHandlers={{
                        click: () => {
                            setSelectedSpot(spot);
                            setViewMode('map');
                        },
                    }}
                />
            ))}
        </MapContainer>
        
        {/* Map Overlay Badge */}
        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-600 px-3 py-1 rounded text-xs text-white z-[1000] pointer-events-none">
            Showing Safe Spots
        </div>
      </div>
    </div>
  );
}
