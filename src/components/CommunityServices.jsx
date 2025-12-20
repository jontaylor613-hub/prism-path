import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { MapPin, Navigation, Loader2, ArrowLeft, ExternalLink, Phone, Globe } from 'lucide-react';
import { getTheme } from '../utils';

// Default Fallback (Cincinnati) if GPS is denied
const DEFAULT_CENTER = [39.1031, -84.5120];

// Search for support services, advocacy groups, and community resources
const fetchSupportServices = async (lat, lng, radius = 5000) => {
  // Query for support services, community centers, advocacy organizations
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="community_centre"](around:${radius},${lat},${lng});
      node["amenity"="social_facility"](around:${radius},${lat},${lng});
      node["office"="ngo"](around:${radius},${lat},${lng});
      node["office"="association"](around:${radius},${lat},${lng});
      node["amenity"="library"](around:${radius},${lat},${lng});
      node["amenity"="hospital"](around:${radius},${lat},${lng});
      node["amenity"="clinic"](around:${radius},${lat},${lng});
      node["amenity"="counselling"](around:${radius},${lat},${lng});
      node["amenity"="social_centre"](around:${radius},${lat},${lng});
    );
    out body;
  `;

  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.elements.map((el, index) => {
      const name = el.tags.name || 'Support Service';
      const type = el.tags.amenity || el.tags.office || 'Support Service';
      return {
        id: el.id || index,
        name: name,
        type: type,
        position: [el.lat, el.lon],
        phone: el.tags.phone || null,
        website: el.tags.website || null,
        address: el.tags['addr:full'] || el.tags['addr:street'] || null
      };
    }).filter(place => place.name !== 'Support Service');
  } catch (error) {
    console.error("Map Data Error:", error);
    return [];
  }
};

// Calculate distance between two coords (Haversine formula)
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

export default function CommunityServices({ isDark, onBack }) {
  const theme = getTheme(isDark);
  const [selectedService, setSelectedService] = useState(null);
  const [myLocation, setMyLocation] = useState(DEFAULT_CENTER);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Finding local support services...");
  const [gpsLocked, setGpsLocked] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(13);

  // Get user location and fetch services
  useEffect(() => {
    const loadServices = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setMyLocation([latitude, longitude]);
            setGpsLocked(true);
            
            // Try close search first (5km)
            let foundServices = await fetchSupportServices(latitude, longitude, 5000);
            
            // If not enough results, expand search (50km)
            if (foundServices.length < 5) {
              setStatusMessage("Expanding search radius...");
              foundServices = await fetchSupportServices(latitude, longitude, 50000);
              setZoomLevel(10);
            }

            // Sort by distance and take top 20 closest
            foundServices.sort((a, b) => {
              const distA = getDistance(latitude, longitude, a.position[0], a.position[1]);
              const distB = getDistance(latitude, longitude, b.position[0], b.position[1]);
              return distA - distB;
            });

            setServices(foundServices.slice(0, 20));
            setLoading(false);
          },
          async (error) => {
            console.error("GPS Denied");
            const foundServices = await fetchSupportServices(DEFAULT_CENTER[0], DEFAULT_CENTER[1], 5000);
            setServices(foundServices);
            setLoading(false);
          }
        );
      } else {
        // No geolocation support
        const foundServices = await fetchSupportServices(DEFAULT_CENTER[0], DEFAULT_CENTER[1], 5000);
        setServices(foundServices);
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={onBack} 
            className={`flex items-center gap-2 ${theme.textMuted} hover:${theme.text} transition-colors mb-4`}
          >
            <ArrowLeft size={18} /> Back
          </button>
          <h1 className={`text-4xl font-bold ${theme.text} mb-2`}>Local Support Services</h1>
          <p className={`${theme.textMuted} text-lg`}>
            Find local resources, advocacy groups, and support networks near you.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Services List */}
          <div className={`lg:col-span-1 ${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-6`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Loader2 size={48} className="animate-spin mb-4 text-cyan-500"/>
                <p>{statusMessage}</p>
              </div>
            ) : !selectedService ? (
              <div>
                <div className="text-xs text-slate-500 font-mono mb-4">
                  {gpsLocked ? "GPS ACTIVE" : "GPS OFF"}
                </div>
                <h2 className={`text-xl font-bold ${theme.text} mb-4`}>Found {services.length} Services</h2>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {services.map(service => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedService?.id === service.id
                          ? `${theme.inputBg} border-cyan-500`
                          : `${theme.cardBg} ${theme.cardBorder} hover:border-cyan-400`
                      }`}
                    >
                      <div className={`font-bold ${theme.text} mb-1`}>{service.name}</div>
                      <div className={`text-xs ${theme.textMuted} uppercase`}>{service.type}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setSelectedService(null)}
                  className={`mb-4 text-sm ${theme.textMuted} hover:${theme.text} flex items-center gap-2`}
                >
                  <ArrowLeft size={16} /> Back to List
                </button>
                <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-xl p-6`}>
                  <div className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest mb-2`}>
                    {selectedService.type}
                  </div>
                  <h2 className={`text-2xl font-bold ${theme.text} mb-4`}>{selectedService.name}</h2>
                  
                  {selectedService.address && (
                    <div className="mb-4">
                      <div className={`text-sm font-medium ${theme.textMuted} mb-1`}>Address</div>
                      <div className={theme.text}>{selectedService.address}</div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 mt-6">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedService.position[0]},${selectedService.position[1]}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Navigation size={18} /> Get Directions
                    </a>
                    
                    {selectedService.phone && (
                      <a
                        href={`tel:${selectedService.phone}`}
                        className={`w-full ${theme.inputBg} border ${theme.inputBorder} ${theme.text} py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:border-cyan-400 transition-colors`}
                      >
                        <Phone size={18} /> Call
                      </a>
                    )}
                    
                    {selectedService.website && (
                      <a
                        href={selectedService.website}
                        target="_blank"
                        rel="noreferrer"
                        className={`w-full ${theme.inputBg} border ${theme.inputBorder} ${theme.text} py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:border-cyan-400 transition-colors`}
                      >
                        <Globe size={18} /> Visit Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl overflow-hidden`} style={{ height: '600px' }}>
              <MapContainer 
                center={myLocation} 
                zoom={zoomLevel} 
                scrollWheelZoom={true} 
                style={{ height: "100%", width: "100%" }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url={isDark 
                    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  }
                />
                
                {/* User Location */}
                {gpsLocked && (
                  <CircleMarker center={myLocation} radius={8} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 1 }}>
                    <Popup>You are here</Popup>
                  </CircleMarker>
                )}

                {/* Services */}
                {services.map(service => (
                  <CircleMarker 
                    key={service.id}
                    center={service.position}
                    radius={10}
                    pathOptions={{ 
                      color: selectedService?.id === service.id ? 'white' : '#06b6d4', 
                      fillColor: '#06b6d4', 
                      fillOpacity: 0.8,
                      weight: selectedService?.id === service.id ? 4 : 0 
                    }}
                    eventHandlers={{
                      click: () => setSelectedService(service),
                    }}
                  >
                    <Popup className="text-slate-900 font-bold">{service.name}</Popup>
                  </CircleMarker>
                ))}

                <MapController center={myLocation} zoom={zoomLevel} />
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

