import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Minus, Navigation2 } from "lucide-react";

declare global {
  interface Window {
    L: any;
  }
}

export function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Fetch buildings data
  const { data: buildings = [] } = useQuery({
    queryKey: ["/api/buildings"],
    queryFn: async () => {
      const response = await fetch("/api/buildings", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch buildings");
      return response.json();
    },
  });

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Default campus coordinates (you can adjust these)
    const campusCenter: [number, number] = [40.7589, -73.9851]; // Example: NYC coordinates
    
    // Initialize the map
    const map = window.L.map(mapRef.current, {
      center: campusCenter,
      zoom: 16,
      zoomControl: false,
    });

    // Add tile layer
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstance.current = map;

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(userCoords);
          
          // Add user location marker
          const userIcon = window.L.divIcon({
            className: 'user-location-marker',
            html: '<div class="w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          
          window.L.marker(userCoords, { icon: userIcon })
            .addTo(map)
            .bindPopup("Your Location");
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // Use campus center as fallback
          setUserLocation(campusCenter);
        }
      );
    }

    // Add building markers when buildings data is available
    if (buildings.length > 0) {
      buildings.forEach((building: any) => {
        const buildingCoords: [number, number] = [
          parseFloat(building.latitude),
          parseFloat(building.longitude),
        ];

        const buildingIcon = window.L.divIcon({
          className: 'building-marker',
          html: `
            <div class="bg-primary text-white p-2 rounded-lg shadow-lg cursor-pointer hover:scale-105 transition-transform text-center min-w-16">
              <div class="text-xs font-medium">${building.code}</div>
              <div class="text-xs opacity-90">${building.type}</div>
            </div>
          `,
          iconSize: [64, 40],
          iconAnchor: [32, 40],
        });

        window.L.marker(buildingCoords, { icon: buildingIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-medium text-slate-800">${building.name}</h3>
              <p class="text-sm text-slate-600 mt-1">${building.description || "Campus building"}</p>
              <div class="mt-2 space-y-1">
                <p class="text-xs text-slate-500">Type: ${building.type}</p>
                ${building.amenities?.length > 0 ? 
                  `<p class="text-xs text-slate-500">Amenities: ${building.amenities.join(", ")}</p>` : ""
                }
              </div>
            </div>
          `);
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [buildings]);

  const zoomIn = () => {
    if (mapInstance.current) {
      mapInstance.current.zoomIn();
    }
  };

  const zoomOut = () => {
    if (mapInstance.current) {
      mapInstance.current.zoomOut();
    }
  };

  const centerOnUser = () => {
    if (mapInstance.current && userLocation) {
      mapInstance.current.setView(userLocation, 18);
    }
  };

  return (
    <div className="flex-1 relative">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <Card className="overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-none border-b"
            onClick={zoomIn}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-none"
            onClick={zoomOut}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </Card>
        
        <Button
          variant="outline"
          size="sm"
          className="bg-white shadow-lg border-slate-200"
          onClick={centerOnUser}
        >
          <Navigation2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Map Legend */}
      <Card className="absolute bottom-4 left-4 z-10 p-4 max-w-xs">
        <h4 className="font-semibold text-slate-800 mb-3 text-sm">Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span className="text-slate-700">Academic Buildings</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-slate-700">Amenities</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-slate-700">Your Location</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-slate-700">Next Class</span>
          </div>
        </div>
      </Card>

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full bg-green-100" />
      
      <style jsx global>{`
        .user-location-marker {
          background: transparent !important;
          border: none !important;
        }
        .building-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
        .leaflet-popup-content {
          margin: 0;
        }
      `}</style>
    </div>
  );
}
