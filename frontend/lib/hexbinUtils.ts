import { hexbin } from 'd3-hexbin';
import { GeoJSONFeature } from '@/types/geojson';

export interface HexbinData {
  x: number;
  y: number;
  value: number;
  count: number;
  coordinates: [number, number][];
}

export interface HexbinResult {
  hexagons: HexbinData[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// GeoJSON features'ları hexbin'e dönüştür
export const createHexbins = (
  features: GeoJSONFeature[],
  hexSize: number = 20
): HexbinResult => {
  
  if (!features || features.length === 0) {
    return {
      hexagons: [],
      bounds: { x: 0, y: 0, width: 0, height: 0 }
    };
  }

  // Koordinatları ve değerleri çıkar
  const points = features
    .filter(feature => 
      feature.geometry.type === "Point" && 
      Array.isArray(feature.geometry.coordinates)
    )
    .map(feature => {
      const coords = feature.geometry.coordinates as number[];
      const value = parseFloat(feature.properties?.value || "0");
      return {
        x: coords[0], // longitude
        y: coords[1], // latitude
        value: value,
        originalCoords: [coords[0], coords[1]] as [number, number]
      };
    });


  if (points.length === 0) {
    return {
      hexagons: [],
      bounds: { x: 0, y: 0, width: 0, height: 0 }
    };
  }

  // Bounds hesapla
  const xValues = points.map(p => p.x);
  const yValues = points.map(p => p.y);
  const bounds = {
    x: Math.min(...xValues),
    y: Math.min(...yValues),
    width: Math.max(...xValues) - Math.min(...xValues),
    height: Math.max(...yValues) - Math.min(...yValues)
  };

  // Hexbin oluştur
  const hexbinGenerator = hexbin<{x: number, y: number, value: number, originalCoords: [number, number]}>()
    .x(d => d.x)
    .y(d => d.y)
    .radius(hexSize);

  const bins = hexbinGenerator(points);

  // Hexbin verilerini işle
  const hexagons: HexbinData[] = bins.map(bin => {
    const values = bin.map(d => d.value);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const coordinates = bin.map(d => d.originalCoords);

    return {
      x: bin.x || 0,
      y: bin.y || 0,
      value: avgValue,
      count: bin.length,
      coordinates: coordinates
    };
  });


  return {
    hexagons,
    bounds
  };
};

// Hexbin için renk hesaplama
export const getHexbinColor = (type: string, value: number, count: number): string => {
  // Temel renk hesaplama (value'ya göre)
  let baseColor = getBaseColorForValue(type, value);
  
  // Count'a göre opacity ayarla (daha fazla nokta = daha opak)
  const opacity = Math.min(0.9, 0.3 + (count / 10) * 0.6);
  
  return addOpacityToColor(baseColor, opacity);
};

// Temel renk hesaplama (colorMapping.ts'den uyarlanmış)
const getBaseColorForValue = (type: string, value: number): string => {
  const numValue = parseFloat(value.toString());
  
  switch (type) {
    case "LandCover":
      const landCoverColors = [
        "#2F4F2F", "#228B22", "#32CD32", "#90EE90", "#9ACD32",
        "#DAA520", "#F4A460", "#DEB887", "#F5DEB3", "#D2B48C",
        "#20B2AA", "#FFD700", "#696969", "#FFE4B5", "#F0F8FF",
        "#8B4513", "#0000FF"
      ];
      const index = Math.max(0, Math.min(16, Math.floor(numValue) - 1));
      return landCoverColors[index] || "#808080";
      
    case "LST":
      if (numValue < -10) return "#000080";
      if (numValue < 0) return "#4169E1";
      if (numValue < 10) return "#00FFFF";
      if (numValue < 20) return "#00FF00";
      if (numValue < 30) return "#FFFF00";
      if (numValue < 40) return "#FFA500";
      if (numValue < 50) return "#FF4500";
      if (numValue < 60) return "#FF0000";
      return "#8B0000";
      
    case "NDVI":
      if (numValue < -0.1) return "#8B0000";
      if (numValue < 0) return "#FF4500";
      if (numValue < 0.1) return "#FFD700";
      if (numValue < 0.3) return "#ADFF2F";
      if (numValue < 0.5) return "#32CD32";
      if (numValue < 0.7) return "#228B22";
      if (numValue < 0.9) return "#006400";
      return "#004400";
      
    case "NPP":
      if (numValue < 0.1) return "#8B0000";
      if (numValue < 0.2) return "#FF4500";
      if (numValue < 0.3) return "#FFD700";
      if (numValue < 0.4) return "#ADFF2F";
      if (numValue < 0.6) return "#32CD32";
      if (numValue < 0.8) return "#228B22";
      if (numValue < 1.0) return "#006400";
      return "#004400";
      
    case "TreeCover":
      if (numValue < 10) return "#8B0000";
      if (numValue < 25) return "#FF4500";
      if (numValue < 40) return "#FFD700";
      if (numValue < 60) return "#ADFF2F";
      if (numValue < 80) return "#32CD32";
      if (numValue < 95) return "#228B22";
      return "#006400";
      
    default:
      return "#808080";
  }
};

// Hex renk koduna opacity ekle
const addOpacityToColor = (hexColor: string, opacity: number): string => {
  // Hex rengi RGB'ye çevir
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Hexbin için radius hesaplama
export const getHexbinRadius = (type: string, count: number): number => {
  // Count'a göre radius hesapla
  const baseRadius = 15;
  const maxRadius = 40;
  const countFactor = Math.min(1, count / 5); // 5+ nokta = maksimum boyut
  
  return baseRadius + (maxRadius - baseRadius) * countFactor;
};
