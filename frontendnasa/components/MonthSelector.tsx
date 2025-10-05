"use client";

import getPoints from "@/lib/getPoints";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { GeoJSONData } from "@/types/geojson";

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  geojson: GeoJSONData;
  setData: (data: GeoJSONData) => void;
  selectedDay: string;
  selectedType: string;
}

export default function MonthSelector({
  selectedMonth,
  onMonthChange,
  geojson,
  setData,
  selectedDay,
  selectedType,
}: MonthSelectorProps) {
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Month options
  const monthOptions = useMemo(() => [
    { value: "1", label: "Ocak" },
    { value: "2", label: "Şubat" },
    { value: "3", label: "Mart" },
    { value: "4", label: "Nisan" },
    { value: "5", label: "Mayıs" },
    { value: "6", label: "Haziran" },
    { value: "7", label: "Temmuz" },
    { value: "8", label: "Ağustos" },
    { value: "9", label: "Eylül" },
    { value: "10", label: "Ekim" },
    { value: "11", label: "Kasım" },
    { value: "12", label: "Aralık" },
  ], []);

      

  // Handle month change with debounce
  const handleMonthChange = useCallback(
    async (month: string) => {
      onMonthChange(month);

      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Set new timeout for API call
      const timeout = setTimeout(async () => {
        // Sadece Polygon feature'ları filtrele
        const polygonFeatures = geojson.features.filter((feature) => 
          feature.geometry.type === "Polygon"
        );
        
        if (polygonFeatures.length > 0) {
          const cleanGeoJSON: GeoJSONData = {
            type: "FeatureCollection",
            features: polygonFeatures
          };
          const data = await getPoints(selectedDay, month, selectedType, cleanGeoJSON);
          setData(data);
        }
      }, 500); // 500ms delay

      setScrollTimeout(timeout);
    },
    [onMonthChange, scrollTimeout, geojson, selectedType, selectedDay, setData]
  );

  // Handle slider drag
  const handleSliderClick = (event: React.MouseEvent) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newMonthIndex = Math.round(percentage * (monthOptions.length - 1));
    handleMonthChange(monthOptions[newMonthIndex].value);
  };

  // Handle mouse drag
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const newMonthIndex = Math.round(percentage * (monthOptions.length - 1));
      handleMonthChange(monthOptions[newMonthIndex].value);
    },
    [isDragging, handleMonthChange, monthOptions]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [scrollTimeout]);

  // Mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  const currentMonthIndex = monthOptions.findIndex(
    (month) => month.value === selectedMonth
  );

  return (
    <div className="bg-gradient-to-br from-green-600/30 to-emerald-600/30 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-3 min-w-[160px]">
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-white">Month</h3>
        
        {/* Slider Container */}
        <div className="relative">
          <div
            ref={sliderRef}
            className="relative h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer"
            onClick={handleSliderClick}
          >
            {/* Active Track */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all duration-300"
              style={{
                width: `${(currentMonthIndex / (monthOptions.length - 1)) * 100}%`,
              }}
            />

            {/* Slider Handle */}
            <div
              className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-green-400 cursor-pointer transition-all duration-300 ${
                isDragging ? "scale-110 shadow-2xl" : "hover:scale-110"
              }`}
              style={{
                left: `calc(${
                  (currentMonthIndex / (monthOptions.length - 1)) * 100
                }% - 8px)`,
              }}
              onMouseDown={handleMouseDown}
            />
          </div>

          {/* Month Labels */}
          <div className="flex justify-between mt-1 text-xs text-white/70">
            <span>Oca</span>
            <span className="text-white font-semibold text-xs">
              {monthOptions[currentMonthIndex]?.label}
            </span>
            <span>Ara</span>
          </div>
        </div>

        {/* Current Month Display */}
        <div className="bg-white/20 rounded-lg px-2 py-1 border border-white/30">
          <span className="text-white font-bold text-sm">
            {monthOptions[currentMonthIndex]?.label}
          </span>
        </div>

        {/* Loading indicator */}
        {isDragging && (
          <div className="flex items-center gap-1 justify-center">
            <div className="w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
            <div
              className="w-1 h-1 bg-white/60 rounded-full animate-pulse"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-1 h-1 bg-white/60 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
