"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import getPoints from "@/lib/getPoints";
import { GeoJSONData } from "@/types/geojson";
interface DaySelectorProps {
  selectedMonth: string;
  selectedDay: string;
  onDayChange: (day: string) => void;
  geojson: GeoJSONData;
  setData: (data: GeoJSONData) => void;
  selectedType: string;
}

export default function DaySelector({
  selectedMonth,
  selectedDay,
  onDayChange,
  geojson,
  setData,
  selectedType,
}: DaySelectorProps) {
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Generate day options based on selected month
  const getDaysInMonth = (month: string) => {
    const daysInMonth = new Date(2024, parseInt(month), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Debounced API call

  // Handle day change with debounce
  const handleDayChange = useCallback(
    (day: string) => {
      onDayChange(day);

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
          const data = await getPoints(day, selectedMonth, selectedType, cleanGeoJSON);
          setData(data);
        }
      }, 500); // 500ms delay

      setScrollTimeout(timeout);
    },
    [onDayChange, scrollTimeout, geojson, selectedType, selectedMonth, setData]
  );

  // Handle slider drag
  const handleSliderClick = (event: React.MouseEvent) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newDay = Math.round(percentage * (days.length - 1)) + 1;
    handleDayChange(newDay.toString());
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
      const daysInMonth = getDaysInMonth(selectedMonth);
      const newDay = Math.round(percentage * (daysInMonth.length - 1)) + 1;
      handleDayChange(newDay.toString());
    },
    [isDragging, selectedMonth, handleDayChange]
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

  const days = getDaysInMonth(selectedMonth);

  return (
    <div className="bg-gradient-to-br from-green-600/30 to-emerald-600/30 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-3 min-w-[140px]">
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-white">Day</h3>
        
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
                width: `${
                  ((parseInt(selectedDay) - 1) / (days.length - 1)) * 100
                }%`,
              }}
            />

            {/* Slider Handle */}
            <div
              className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-green-400 cursor-pointer transition-all duration-300 ${
                isDragging ? "scale-110 shadow-2xl" : "hover:scale-110"
              }`}
              style={{
                left: `calc(${
                  ((parseInt(selectedDay) - 1) / (days.length - 1)) * 100
                }% - 8px)`,
              }}
              onMouseDown={handleMouseDown}
            />
          </div>

          {/* Day Labels */}
          <div className="flex justify-between mt-1 text-xs text-white/70">
            <span>1</span>
            <span className="text-white font-semibold text-xs">{selectedDay}</span>
            <span>{days.length}</span>
          </div>
        </div>

        {/* Current Day Display */}
        <div className="bg-white/20 rounded-lg px-2 py-1 border border-white/30">
          <span className="text-white font-bold text-sm">{selectedDay}</span>
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
