"use client";

import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import getPoints from "@/lib/getPoints";
import { GeoJSONData, DrawingState, GeoJSONFeature } from "@/types/geojson";

export default function PolygonDrawer({
  setData,
  setUserPolygons,
  userPolygons,
  Dates,
  selectedType,
  clearCircles,
  onLoadingStart,
}: {
  setData: (geojson: GeoJSONData) => void;
  setUserPolygons: (geojson: GeoJSONData) => void;
  userPolygons: GeoJSONData;
  Dates: {
    selectedDay: string;
    selectedMonth: string;
  };
  selectedType: string;
  clearCircles: () => void;
  onLoadingStart?: () => void;
}) {
  const map = useMap();
  const [isDrawing, setIsDrawing] = useState(false);
  const [geojson, setGeojson] = useState<GeoJSONData | null>(null);
  const [copied, setCopied] = useState(false);
  const lastRequestRef = useRef<string>("");

  async function fetchData(day: string, month: string, geojsonData?: GeoJSONData) {
    // Start loading
    if (onLoadingStart) {
      onLoadingStart();
    }
    
    const dataToSend = geojsonData || geojson;
    
    
    // Safety checks
    if (!dataToSend || !dataToSend.features || dataToSend.features.length === 0) {
      return;
    }
    
    // If geojsonData parameter exists, these are already filtered polygons
    // If not, filter polygons from current geojson
    let polygonFeatures;
    if (geojsonData) {
      // Already filtered polygons
      polygonFeatures = dataToSend.features;
    } else {
      // Filter polygons from current geojson
      polygonFeatures = dataToSend.features.filter(feature => feature.geometry.type === "Polygon");
    }
    
    if (polygonFeatures.length === 0) {
      return;
    }
    
    // Check if polygon features are valid
    const validPolygons = polygonFeatures.filter(feature => 
      feature.geometry && 
      feature.geometry.coordinates && 
      Array.isArray(feature.geometry.coordinates) &&
      feature.geometry.coordinates.length > 0
    );
    
    if (validPolygons.length === 0) {
      return;
    }
    
    const polygonOnlyGeoJSON: GeoJSONData = {
      type: "FeatureCollection",
      features: validPolygons
    };
    
    
    try {
      const data = await getPoints(day, month, selectedType, polygonOnlyGeoJSON);
      setData(data);
    } catch (error) {
      console.error("❌ Failed to fetch data:", error);
    }
  }

  const drawingStateRef = useRef<DrawingState>({
    points: [],
    markers: [],
    polyline: null,
    polygons: [],
    firstMarker: null,
    lastClickTime: undefined,
  });

  useEffect(() => {
    if (!map) return;

    // Map click handler
    const handleMapClick = (e: any) => {
      const state = drawingStateRef.current;
      if (!isDrawing) return;

      // Prevent double clicks
      if (state.lastClickTime && Date.now() - state.lastClickTime < 300) {
        return;
      }
      state.lastClickTime = Date.now();

      const latlng = e.latlng;

      // Check if clicking near first marker to close polygon
      if (state.firstMarker && state.points.length >= 3) {
        const firstPoint = state.firstMarker.getLatLng();
        const distance = map.distance(latlng, firstPoint);

        if (distance < 15) {
          completePolygon();
          return;
        }
      }

      // Add point
      state.points.push([latlng.lat, latlng.lng]);

      // Create marker
      const marker = (window as any).L.circleMarker(latlng, {
        radius: 6,
        fillColor: "#16a34a", // Green color
        color: "#fff",
        weight: 2,
        fillOpacity: 1,
      }).addTo(map);

      state.markers.push(marker);

      // Make first marker distinctive and clickable
      if (state.points.length === 1) {
        state.firstMarker = marker;
        marker.setStyle({
          fillColor: "#ff0000",
          radius: 8,
        });

        marker.on("click", (e: any) => {
          (window as any).L.DomEvent.stopPropagation(e);
          if (isDrawing && state.points.length >= 3) {
            completePolygon();
          }
        });

        marker.bringToFront();
      }

      // Update polyline
      if (state.polyline) {
        map.removeLayer(state.polyline);
      }

      if (state.points.length > 1) {
        state.polyline = (window as any).L.polyline(state.points, {
          color: "#16a34a", // Green color
          weight: 2,
          dashArray: "5, 5",
        }).addTo(map);
      }
    };

    map.on("click", handleMapClick);

    // ESC to cancel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawing) {
        stopDrawing();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      map.off("click", handleMapClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [map, isDrawing]);

  // Auto-request when selectedType, month and day change
  useEffect(() => {
    
    // Safety checks - only check polygons
    if (!geojson || !geojson.features || geojson.features.length === 0) {
      return;
    }
    
    // Ignore API responses (Point geometry features)
    const hasApiResponse = geojson.features.some(feature => 
      feature.geometry.type === "Point" && 
      feature.properties && 
      feature.properties.type
    );
    
    if (hasApiResponse) {
      return;
    }
    
    // Sadece Polygon geometry'li feature'lar varsa request at
    const polygonFeatures = geojson.features.filter(feature => feature.geometry.type === "Polygon");
    if (polygonFeatures.length === 0) {
      return;
    }
    
    // Prevent sending the same request again
    const requestKey = `${selectedType}-${Dates.selectedDay}-${Dates.selectedMonth}`;
    if (lastRequestRef.current === requestKey) {
      return;
    }
    
    lastRequestRef.current = requestKey;
    
    // Create clean GeoJSON containing only polygons
    const cleanGeoJSON = {
      type: "FeatureCollection" as const,
      features: polygonFeatures
    };
    
    fetchData(Dates.selectedDay, Dates.selectedMonth, cleanGeoJSON);
  }, [selectedType, Dates.selectedDay, Dates.selectedMonth]); // all dependencies

  const startDrawing = () => {
    clearAll();
    clearCircles(); // Clear old circles
    
    // Reset click timing
    drawingStateRef.current.lastClickTime = undefined;
    
    setIsDrawing(true);
    if (map) {
      map.getContainer().style.cursor = "crosshair";
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const state = drawingStateRef.current;

    if (map) {
      map.getContainer().style.cursor = "";

      if (state.polyline) {
        map.removeLayer(state.polyline);
        state.polyline = null;
      }
      state.markers.forEach((m) => map.removeLayer(m));
      state.markers = [];
      state.points = [];
      state.firstMarker = null;
    }
  };

  const completePolygon = () => {
    const state = drawingStateRef.current;

    if (state.points.length >= 3 && map && (window as any).L) {
      const polygon = (window as any).L.polygon(state.points, {
        color: "#16a34a", // Green color
        fillColor: "#c6f5d7",
        fillOpacity: 0.3,
      }).addTo(map);

      state.polygons.push(polygon);
      // polygon.bindPopup(`Polygon with ${state.points.length} points`);

      updateGeoJSON();
    }

    stopDrawing();
  };

  const updateGeoJSON = () => {
    const state = drawingStateRef.current;
    const features: GeoJSONFeature[] = state.polygons.map(
      (polygon: any, idx: number) => {
        const coords = polygon
          .getLatLngs()[0]
          .map((ll: any) => [ll.lng, ll.lat]);
        coords.push(coords[0]);

        return {
          type: "Feature" as const,
          properties: {
            id: idx + 1,
            name: `Polygon ${idx + 1}`,
          },
          geometry: {
            type: "Polygon" as const,
            coordinates: [coords],
          },
        };
      }
    );

    const geojsonData: GeoJSONData = {
      type: "FeatureCollection",
      features: features,
    };

    setGeojson(geojsonData);
    setUserPolygons(geojsonData);

    // Automatically make API call after polygon is drawn
    if (features.length > 0) {
      fetchData(Dates.selectedDay, Dates.selectedMonth, geojsonData);
    }
  };

  const clearAll = () => {
    stopDrawing();
    const state = drawingStateRef.current;

    if (map) {
      state.polygons.forEach((p: any) => map.removeLayer(p));
      state.polygons = [];
    }
    setGeojson(null);
    setUserPolygons({ type: "FeatureCollection", features: [] });
    clearCircles(); // Also clear circles
  };

  const copyToClipboard = () => {
    if (geojson) {
      navigator.clipboard
        .writeText(JSON.stringify(geojson, null, 2))
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          alert("Failed to copy to clipboard");
        });
    }
  };

  return (
    <div className="absolute top-24 right-4 z-[1000] flex flex-col gap-2">
      <div className="bg-gradient-to-br from-green-600/30 to-emerald-600/30 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-3 mt-6">
        <button
          onClick={startDrawing}
          className={`w-full px-4 py-2 rounded-lg cursor-pointer text-sm font-medium transition-all duration-200 ${
            isDrawing
              ? "bg-white/30 text-white border-2 border-white/50 shadow-lg"
              : "bg-white/20 border-2 border-white/30 text-white hover:bg-white/30 hover:border-white/50"
          }`}
        >
          {isDrawing ? "Drawing..." : "Start Drawing"}
        </button>
        <button
          onClick={clearAll}
          className="w-full mt-2 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium bg-white/20 border-2 border-white/30 text-white hover:bg-white/30 hover:border-white/50 transition-all duration-200"
        >
          Clear All
        </button>
      </div>

      {/* Instructions */}
      <div className="max-md:hidden bg-gradient-to-br from-green-600/30 to-emerald-600/30 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-3 max-w-[250px]">
        <h3 className="text-sm font-bold mb-2 mt-0 text-white">Instructions</h3>
        <p className="text-xs my-1 text-white font-medium">
          1. Click &quot;Start Drawing&quot;
        </p>
        <p className="text-xs my-1 text-white font-medium">
          2. Click on map to add points
        </p>
        <p className="text-xs my-1 text-white font-medium">
          3. Click the <strong>first point</strong> (red) to complete
        </p>
        <p className="text-xs my-1 text-white font-medium">
          4. Or press ESC to cancel
        </p>
      </div>

      {/* GeoJSON Output */}
      {geojson && (
        <div className="bg-gradient-to-br from-green-600/30 to-emerald-600/30 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-3 max-w-[300px] max-h-[200px] overflow-y-auto no-scrollbar">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold m-0 text-white">GeoJSON Output</h3>
            <button
              onClick={copyToClipboard}
              className="bg-white/30 text-white px-3 py-1 rounded-lg cursor-pointer text-xs hover:bg-white/40 transition-all duration-200 font-medium border border-white/30"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="m-0 text-xs bg-white/30 p-2 rounded-lg overflow-x-auto text-white font-medium">
            {JSON.stringify(geojson, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
