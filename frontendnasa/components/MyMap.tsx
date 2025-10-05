"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { GeoJSONData, GeoJSONFeature } from "@/types/geojson";
import {
  getColorForValue,
  getRadiusForValue,
  getHoverInfo,
} from "@/lib/colorMapping";

// AI Analysis Result Types
interface AgaçlandirmaOnerisi {
  oncelik_seviyesi: string;
  hedef_alan: string;
  onerilen_turler_veya_yaklasim: string;
  gerekce_ve_aciklama: string;
  tahmini_maliyet_etkisi: string;
}

interface AnalizOzeti {
  bolge_adi: string;
  ortalama_potansiyel: string;
  hakim_potansiyel_seviyesi: string;
  en_yuksek_potansiyel_alani: string;
  en_dusuk_potansiyel_alani: string;
  yuksek_potansiyel_orani: string;
}

interface AIAnalysisResult {
  analiz_ozeti: AnalizOzeti;
  agaclandirma_onerileri: AgaçlandirmaOnerisi[];
  ek_risk_ve_notlar: string[];
}
// import AIMarker from "./AIMarker";

// Shadcn/UI Components
import PolygonDrawer from "./PolygonDrawer";
import DaySelector from "./DaySelector";
import MonthSelector from "./MonthSelector";
import HeroSection from "./HeroSection";
import TypeSelector from "./TypeSelector";
// Main Map Component
export default function MyMap() {
  // Separate states for user polygons and API data
  const [userPolygons, setUserPolygons] = useState<GeoJSONData>({
    type: "FeatureCollection",
    features: [],
  });
  
  const [apiData, setApiData] = useState<GeoJSONData>({
    type: "FeatureCollection",
    features: [],
  });
  
  // Combined geojson for rendering
  const [geojson, setGeojson] = useState<GeoJSONData>({
    type: "FeatureCollection",
    features: [],
  });

  const [selectedMonth, setSelectedMonth] = useState<string>("1");
  const [selectedDay, setSelectedDay] = useState<string>("1");
  const [selectedType, setSelectedType] = useState<string>("NDVI");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AIAnalysisResult | null>(null);

  // Auto-clear status message
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage("");
      }, 3000); // Clear after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Combine user polygons and API data
  useEffect(() => {
    setGeojson({
      type: "FeatureCollection",
      features: [...userPolygons.features, ...apiData.features],
    });
  }, [userPolygons, apiData]);


  const DEFAULT_COORDINATES: [number, number] = [40.7667, 29.9167];
  const DEFAULT_ZOOM = 13;

  // Handle month/day change
  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    setSelectedDay("1"); // Reset day when month changes
    // Clear API data when month changes, keep user polygons
    setApiData({
      type: "FeatureCollection",
      features: [],
    });
  };

  const handleDayChange = (value: string) => {
    setSelectedDay(value);
    // Clear API data when day changes, keep user polygons
    setApiData({
      type: "FeatureCollection",
      features: [],
    });
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);

    // Show status message when category is selected
    const typeNames = {
      LandCover: "Land Cover",
      LST: "Land Surface Temperature",
      NDVI: "Vegetation Index",
      NPP: "Net Primary Productivity",
      TreeCover: "Tree Cover",
    };
    setStatusMessage(
      `${typeNames[value as keyof typeof typeNames] || value} selected`
    );

    // Clear API data when type changes, keep user polygons
    setApiData({
      type: "FeatureCollection",
      features: [],
    });
  };

  // Function to clear API data (points)
  const clearCircles = () => {
    setApiData({
      type: "FeatureCollection",
      features: [],
    });
  };



  // AI Analysis functions - No screenshot needed, just coordinates and data

  const handleAIAnalysis = async () => {
    // AI analysis is now available for all data types

    // Check for any data (user polygons or API data)
    const hasUserPolygons = userPolygons?.features?.length > 0;
    const hasApiData = apiData?.features?.length > 0;

    if (!hasUserPolygons && !hasApiData) {
      setStatusMessage("No data to analyze - please draw a polygon or select a date");
      return;
    }

    // Check data point limit (100 points maximum)
    const totalDataPoints = (userPolygons?.features?.length || 0) + (apiData?.features?.length || 0);
    if (totalDataPoints > 100) {
      setStatusMessage(`Too many data points (${totalDataPoints}/100). Please reduce data or select a smaller area.`);
      return;
    }

    setIsLoading(true);
    setStatusMessage("Preparing data for AI analysis...");

    try {
      console.log("Starting AI Analysis...");

      // Get user polygons and API data coordinates
      const userPolygonFeatures = userPolygons.features;
      const apiPointFeatures = apiData.features;

      // If no data, we can't analyze
      if (userPolygonFeatures.length === 0 && apiPointFeatures.length === 0) {
        setStatusMessage("No valid data found for analysis");
        setIsLoading(false);
        return;
      }

      console.log("Preparing analysis data...");
      setStatusMessage("Sending to AI...");

      const analysisData = {
        selectedType: selectedType,
        date: `2024-${selectedMonth.padStart(2, "0")}-${selectedDay.padStart(
          2,
          "0"
        )}`,
        userPolygonCoordinates: userPolygonFeatures.map((feature) => ({
          type: feature.geometry.type,
          coordinates: feature.geometry.coordinates,
        })),
        apiPointCoordinates: apiPointFeatures.map((feature) => ({
          type: feature.geometry.type,
          coordinates: feature.geometry.coordinates,
          properties: feature.properties,
        })),
        metadata: {
          dataType: selectedType,
          analysisDate: new Date().toISOString(),
          userPolygonCount: userPolygonFeatures.length,
          apiPointCount: apiPointFeatures.length,
        },
      };

      console.log("Analysis data being sent:", analysisData);

      // Send to your LLM endpoint
      const baseEndpoint = process.env.NEXT_PUBLIC_BASE_ENDPOINT;
      if (!baseEndpoint) {
        throw new Error("API endpoint not configured");
      }

      const response = await fetch(`${baseEndpoint}/advice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(analysisData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("AI Analysis Response:", result);
        setAiAnalysisResult(result);
        setStatusMessage("AI analysis completed successfully!");
      } else {
        // Handle different error types
        let errorMessage = "";
        
        if (response.status === 404) {
          errorMessage = "AI Analysis service not found. Please check your endpoint configuration.";
        } else if (response.status === 500) {
          errorMessage = "AI Analysis service is currently unavailable. Please try again later.";
        } else if (response.status === 401) {
          errorMessage = "Authentication failed. Please check your API credentials.";
        } else if (response.status === 403) {
          errorMessage = "Access denied. Please check your API permissions.";
        } else {
          errorMessage = `AI Analysis failed with status ${response.status}. Please try again.`;
        }
        
        console.error("API Error:", response.status, errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("AI analysis failed:", error);
      
      // Handle different types of errors
      let userFriendlyMessage = "";
      
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          userFriendlyMessage = "Network error: Unable to connect to AI service. Please check your internet connection.";
        } else if (error.message.includes("API endpoint not configured")) {
          userFriendlyMessage = "Configuration error: AI Analysis endpoint is not configured.";
        } else if (error.message.includes("AI Analysis service not found")) {
          userFriendlyMessage = "Service unavailable: AI Analysis endpoint not found.";
        } else if (error.message.includes("AI Analysis service is currently unavailable")) {
          userFriendlyMessage = "Service error: AI Analysis service is temporarily down.";
        } else if (error.message.includes("Authentication failed")) {
          userFriendlyMessage = "Authentication error: Please check your API credentials.";
        } else if (error.message.includes("Access denied")) {
          userFriendlyMessage = "Permission error: Access to AI Analysis service denied.";
        } else {
          userFriendlyMessage = `AI Analysis failed: ${error.message}`;
        }
      } else {
        userFriendlyMessage = "AI Analysis failed: An unexpected error occurred. Please try again.";
      }
      
      setStatusMessage(userFriendlyMessage);
      setAiAnalysisResult(null); // Clear any previous results
    } finally {
      setIsLoading(false);
    }
  };

  // Data update function - Update API data only
  const handleDataUpdate = (newData: GeoJSONData) => {
    setApiData(newData);

    // Status message based on data status
    const pointFeatures = newData.features.filter(
      (feature) => feature.geometry.type === "Point"
    );
    if (pointFeatures.length > 0) {
      setStatusMessage(`${pointFeatures.length} data points found`);
    } else {
      setStatusMessage("No data found");
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full min-h-screen">
      {/* Hero Section - Initial Opening */}
      <HeroSection />

      {/* Map Section - After Scroll */}
      <section className="w-full h-screen relative">
        {/* Full Screen Map */}
        <MapContainer
          key="main-map"
          center={DEFAULT_COORDINATES}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          zoomControl={false}
          className="w-full h-full"
          maxZoom={15}
          minZoom={13}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {geojson.features.map((feature: GeoJSONFeature, index: number) => {
            // Draw circles from API-returned GeoJSON
            if (
              feature.geometry.type === "Point" &&
              Array.isArray(feature.geometry.coordinates)
            ) {
              const coords = feature.geometry.coordinates as number[];
              const value = parseFloat(feature.properties?.value || "0");

              // Calculate color and radius based on selected type
              const color = getColorForValue(selectedType, value);
              const radius = getRadiusForValue(selectedType, value);
              const hoverInfo = getHoverInfo(selectedType, value);

              return (
                <Circle
                  key={index}
                  center={[coords[1], coords[0]]}
                  radius={radius}
                  fillColor={color}
                  fillOpacity={0.7}
                  color={color}
                  weight={2}
                  eventHandlers={{
                    mouseover: (e) => {
                      const circle = e.target;
                      circle
                        .bindPopup(hoverInfo, {
                          closeButton: false,
                          autoClose: false,
                          closeOnClick: false,
                          className: "custom-popup",
                        })
                        .openPopup();
                    },
                    mouseout: (e) => {
                      const circle = e.target;
                      circle.closePopup();
                    },
                  }}
                />
              );
            }
            return null;
          })}

          {/* Polygon Drawer */}
          <PolygonDrawer
            setData={handleDataUpdate}
            setUserPolygons={setUserPolygons}
            userPolygons={userPolygons}
            Dates={{ selectedDay, selectedMonth }}
            selectedType={selectedType}
            clearCircles={clearCircles}
            onLoadingStart={() => {
              setIsLoading(true);
              setStatusMessage("Fetching data...");
            }}
          />

          {/* AI Analysis Marker - Removed for now */}
        </MapContainer>

        {/* Floating Header with Controls */}
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <div className="bg-gradient-to-r from-green-600/60 to-emerald-600/45 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">GreenRadar</h1>
                <p className="text-sm text-white font-medium">
                  Data-Driven Green Space Management
                </p>
              </div>

              <div className="flex items-center gap-3">

                {/* AI Analysis Button - Show for all types */}
                  <button
                    onClick={handleAIAnalysis}
                  disabled={isLoading || ((userPolygons?.features?.length || 0) + (apiData?.features?.length || 0)) > 100}
                  className={`group relative px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform border border-white/20 ${
                    isLoading 
                      ? "bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed scale-100" 
                      : ((userPolygons?.features?.length || 0) + (apiData?.features?.length || 0)) > 100
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 cursor-not-allowed scale-100"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-105"
                  } text-white`}
                  title={
                    isLoading 
                      ? "Analyzing..." 
                      : ((userPolygons?.features?.length || 0) + (apiData?.features?.length || 0)) > 100
                      ? `Too many data points (${(userPolygons?.features?.length || 0) + (apiData?.features?.length || 0)}/100)`
                      : (userPolygons?.features?.length > 0 || apiData?.features?.length > 0) 
                           ? "Analyze data with AI" 
                      : "AI Analysis - No data available"
                  }
                  >
                    <div className="flex items-center gap-2">
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
                          <path d="M19 15L20.09 17.26L23 18L20.09 18.74L19 21L17.91 18.74L15 18L17.91 17.26L19 15Z" />
                          <path d="M5 15L6.09 17.26L9 18L6.09 18.74L5 21L3.91 18.74L1 18L3.91 17.26L5 15Z" />
                        </svg>
                      )}
                      <span className="text-sm font-medium">
                        {isLoading 
                          ? "Analyzing..." 
                          : ((userPolygons?.features?.length || 0) + (apiData?.features?.length || 0)) > 100
                          ? `AI Analysis (${(userPolygons?.features?.length || 0) + (apiData?.features?.length || 0)}/100)`
                          : (userPolygons?.features?.length > 0 || apiData?.features?.length > 0) 
                          ? "AI Analysis" 
                          : "AI Analysis (No Data)"
                        }
                      </span>
                    </div>
                  </button>

                {/* Status Message */}
                {statusMessage && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                    {isLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <span className="text-sm text-white font-medium">
                      {statusMessage}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Footer */}
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <div className="bg-gradient-to-r from-green-600/30 to-emerald-600/30 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-4">
            {/* Desktop Layout */}
            <div className="hidden lg:flex flex-row gap-4 items-center justify-between">
              {/* Left Section - Type Selector */}
              <div className="flex-shrink-0">
                <TypeSelector
                  selectedType={selectedType}
                  onTypeChange={handleTypeChange}
                />
              </div>

              {/* Center Section - Date Selectors */}
              <div className="flex flex-row gap-4 items-center">
                <MonthSelector
                  geojson={geojson}
                  setData={handleDataUpdate}
                  selectedDay={selectedDay}
                  selectedMonth={selectedMonth}
                  onMonthChange={handleMonthChange}
                  selectedType={selectedType}
                />

                <DaySelector
                  geojson={geojson}
                  setData={handleDataUpdate}
                  selectedMonth={selectedMonth}
                  selectedDay={selectedDay}
                  onDayChange={handleDayChange}
                  selectedType={selectedType}
                />
              </div>

              {/* Right Section - Date Display */}
              <div className="flex-shrink-0">
                <div className="bg-white/20 rounded-lg px-3 py-2">
                  <span className="text-white font-medium text-sm">
                    Day {selectedDay}, Month {selectedMonth} 2024
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden flex flex-col gap-4">
              {/* Type Selector - Full Width */}
              <div className="w-full">
                <TypeSelector
                  selectedType={selectedType}
                  onTypeChange={handleTypeChange}
                />
              </div>

              {/* Date Selectors - Side by Side */}
              <div className="flex flex-row gap-3">
                <div className="flex-1">
                  <MonthSelector
                    geojson={geojson}
                    setData={handleDataUpdate}
                    selectedDay={selectedDay}
                    selectedMonth={selectedMonth}
                    onMonthChange={handleMonthChange}
                    selectedType={selectedType}
                  />
                </div>
                <div className="flex-1">
                  <DaySelector
                    geojson={geojson}
                    setData={handleDataUpdate}
                    selectedMonth={selectedMonth}
                    selectedDay={selectedDay}
                    onDayChange={handleDayChange}
                    selectedType={selectedType}
                  />
                </div>
              </div>

              {/* Date Display - Centered */}
              <div className="flex justify-center">
                <div className="bg-white/20 rounded-lg px-3 py-2">
                  <span className="text-white font-medium text-sm">
                    Day {selectedDay}, Month {selectedMonth} 2024
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Analysis Results Modal */}
      {aiAnalysisResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-3xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">AI Analysis Results</h2>
                    <p className="text-green-100 text-sm">Green space potential analysis</p>
                  </div>
                </div>
                <button
                  onClick={() => setAiAnalysisResult(null)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">

              {/* Analiz Özeti */}
              {aiAnalysisResult.analiz_ozeti && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Analysis Summary</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-700">Region</span>
                      </div>
                      <p className="text-gray-800 font-semibold">{aiAnalysisResult.analiz_ozeti.bolge_adi}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700">Average Potential</span>
                      </div>
                      <p className="text-gray-800 font-semibold">{aiAnalysisResult.analiz_ozeti.ortalama_potansiyel}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-purple-700">Dominant Level</span>
                      </div>
                      <p className="text-gray-800 font-semibold">{aiAnalysisResult.analiz_ozeti.hakim_potansiyel_seviyesi}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm font-medium text-orange-700">Highest Area</span>
                      </div>
                      <p className="text-gray-800 text-sm">{aiAnalysisResult.analiz_ozeti.en_yuksek_potansiyel_alani}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-red-700">Lowest Area</span>
                      </div>
                      <p className="text-gray-800 text-sm">{aiAnalysisResult.analiz_ozeti.en_dusuk_potansiyel_alani}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-sm font-medium text-emerald-700">High Potential Ratio</span>
                      </div>
                      <p className="text-gray-800 font-semibold">{aiAnalysisResult.analiz_ozeti.yuksek_potansiyel_orani}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ağaçlandırma Önerileri */}
              {aiAnalysisResult.agaclandirma_onerileri && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Afforestation Recommendations</h3>
                  </div>
                  
                  <div className="space-y-6">
                    {aiAnalysisResult.agaclandirma_onerileri.map((oneri: AgaçlandirmaOnerisi, index: number) => (
                      <div key={index} className={`relative overflow-hidden rounded-2xl shadow-lg border-2 ${
                        oneri.oncelik_seviyesi === 'YÜKSEK' ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' :
                        oneri.oncelik_seviyesi === 'ORTA' ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' :
                        'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                      }`}>
                        {/* Priority Badge */}
                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${
                          oneri.oncelik_seviyesi === 'YÜKSEK' ? 'bg-red-500 text-white' :
                          oneri.oncelik_seviyesi === 'ORTA' ? 'bg-yellow-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {oneri.oncelik_seviyesi}
                        </div>
                        
                        <div className="p-6">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              oneri.oncelik_seviyesi === 'YÜKSEK' ? 'bg-red-200' :
                              oneri.oncelik_seviyesi === 'ORTA' ? 'bg-yellow-200' :
                              'bg-gray-200'
                            }`}>
                              <svg className={`w-6 h-6 ${
                                oneri.oncelik_seviyesi === 'YÜKSEK' ? 'text-red-600' :
                                oneri.oncelik_seviyesi === 'ORTA' ? 'text-yellow-600' :
                                'text-gray-600'
                              }`} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-gray-800 mb-2">{oneri.hedef_alan}</h4>
                              
                              <div className="space-y-3">
                                <div className="bg-white/60 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Recommended Species</span>
                                  </div>
                                  <p className="text-gray-800 text-sm">{oneri.onerilen_turler_veya_yaklasim}</p>
                                </div>
                                
                                <div className="bg-white/60 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Description</span>
                                  </div>
                                  <p className="text-gray-800 text-sm">{oneri.gerekce_ve_aciklama}</p>
                                </div>
                                
                                <div className="bg-white/60 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">Cost Impact</span>
                                  </div>
                                  <p className="text-gray-800 text-sm font-medium">{oneri.tahmini_maliyet_etkisi}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ek Risk ve Notlar */}
              {aiAnalysisResult.ek_risk_ve_notlar && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Additional Risks and Notes</h3>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                    <div className="space-y-4">
                      {aiAnalysisResult.ek_risk_ve_notlar.map((not: string, index: number) => (
                        <div key={index} className="flex items-start gap-3 bg-white/60 rounded-lg p-4">
                          <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </div>
                          <p className="text-gray-800 text-sm leading-relaxed">{not}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
