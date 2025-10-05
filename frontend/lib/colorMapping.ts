// Kategorilere göre renk aralığı sistemi
export const getColorForValue = (type: string, value: number): string => {
  let numValue = parseFloat(value.toString());

  switch (type) {
    case "LandCover":
      // LandCover için 1-17 arası kategorik renkler
      const landCoverColors = [
        "#2F4F2F", // 1 - Evergreen Needleleaf Forest (koyu yeşil)
        "#228B22", // 2 - Evergreen Broadleaf Forest (orman yeşili)
        "#32CD32", // 3 - Deciduous Needleleaf Forest (lime yeşil)
        "#90EE90", // 4 - Deciduous Broadleaf Forest (açık yeşil)
        "#9ACD32", // 5 - Mixed Forest (sarı yeşil)
        "#DAA520", // 6 - Closed Shrublands (altın)
        "#F4A460", // 7 - Open Shrublands (kum rengi)
        "#DEB887", // 8 - Woody Savannas (buğday rengi)
        "#F5DEB3", // 9 - Savannas (açık buğday)
        "#D2B48C", // 10 - Grasslands (çim rengi)
        "#20B2AA", // 11 - Permanent Wetlands (teal)
        "#FFD700", // 12 - Croplands (altın sarı)
        "#696969", // 13 - Urban and Built-up (koyu gri)
        "#FFE4B5", // 14 - Cropland/Natural Vegetation Mosaics (açık sarı)
        "#F0F8FF", // 15 - Snow and Ice (buz mavisi)
        "#8B4513", // 16 - Barren (kahverengi)
        "#0000FF"  // 17 - Water Bodies (mavi)
      ];
      const index = Math.max(0, Math.min(16, Math.floor(numValue) - 1));
      return landCoverColors[index] || "#808080";

    case "LST":
      // LST için sıcaklık renkleri (-20°C ile +70°C arası)
      if (numValue < -10) return "#000080"; // Çok soğuk - koyu mavi
      if (numValue < 0) return "#4169E1";   // Soğuk - açık mavi
      if (numValue < 10) return "#00FFFF";  // Serin - cyan
      if (numValue < 20) return "#00FF00";   // Ilıman - yeşil
      if (numValue < 30) return "#FFFF00";  // Sıcak - sarı
      if (numValue < 40) return "#FFA500";  // Çok sıcak - turuncu
      if (numValue < 50) return "#FF4500"; // Aşırı sıcak - turuncu kırmızı
      if (numValue < 60) return "#FF0000";  // Çok aşırı sıcak - kırmızı
      return "#8B0000"; // Tehlikeli sıcaklık - koyu kırmızı

    case "NDVI":
      // NDVI için -0.2 ile 1.0 arası renkler
      if (numValue < -0.1) return "#8B0000"; // Çok düşük - koyu kırmızı
      if (numValue < 0) return "#FF4500";     // Düşük - turuncu kırmızı
      if (numValue < 0.1) return "#FFD700";   // Çok düşük bitki - altın
      if (numValue < 0.3) return "#ADFF2F";   // Düşük bitki - sarı yeşil
      if (numValue < 0.5) return "#32CD32";   // Orta bitki - lime yeşil
      if (numValue < 0.7) return "#228B22";   // İyi bitki - orman yeşili
      if (numValue < 0.9) return "#006400";   // Çok iyi bitki - koyu yeşil
      return "#004400"; // Mükemmel bitki örtüsü - çok koyu yeşil

    case "NPP":
      // NPP için yeşil tonları (0 ile yaklaşık 1.0 arası)
      if (numValue < 0.1) return "#8B0000"; // Çok düşük üretkenlik - koyu kırmızı
      if (numValue < 0.2) return "#FF4500"; // Düşük üretkenlik - turuncu kırmızı
      if (numValue < 0.3) return "#FFD700"; // Orta düşük üretkenlik - altın
      if (numValue < 0.4) return "#ADFF2F"; // Orta üretkenlik - sarı yeşil
      if (numValue < 0.6) return "#32CD32"; // İyi üretkenlik - lime yeşil
      if (numValue < 0.8) return "#228B22"; // Çok iyi üretkenlik - orman yeşili
      if (numValue < 1.0) return "#006400"; // Mükemmel üretkenlik - koyu yeşil
      return "#004400"; // Aşırı yüksek üretkenlik - çok koyu yeşil

    case "TreeCover":
      // TreeCover için yeşil tonları (0-100%)
      if (numValue < 10) return "#8B0000";  // Çok düşük - koyu kırmızı
      if (numValue < 25) return "#FF4500";  // Düşük - turuncu kırmızı
      if (numValue < 40) return "#FFD700";  // Orta düşük - altın
      if (numValue < 60) return "#ADFF2F";  // Orta - sarı yeşil
      if (numValue < 80) return "#32CD32";  // İyi - lime yeşil
      if (numValue < 95) return "#228B22";  // Çok iyi - orman yeşil
      return "#006400"; // Mükemmel - koyu yeşil

    case "TreeAnalysis":
      numValue = numValue * 100
      // TreeAnalysis için ağaçlandırma indeksi renkleri (0-100)
      if (numValue < 5) return "#8B0000";   // Çok kötü ağaçlandırma - koyu kırmızı
      if (numValue < 15) return "#FF4500";  // Kötü ağaçlandırma - turuncu kırmızı
      if (numValue < 25) return "#FF8C00";  // Düşük ağaçlandırma - turuncu
      if (numValue < 35) return "#FFD700";  // Orta düşük ağaçlandırma - altın
      if (numValue < 45) return "#ADFF2F";  // Orta ağaçlandırma - sarı yeşil
      if (numValue < 55) return "#32CD32";  // İyi ağaçlandırma - lime yeşil
      if (numValue < 70) return "#228B22";  // Çok iyi ağaçlandırma - orman yeşili
      if (numValue < 85) return "#006400";  // Mükemmel ağaçlandırma - koyu yeşil
      return "#004400"; // Aşırı iyi ağaçlandırma - çok koyu yeşil

    default:
      return "#808080"; // Varsayılan gri
  }
};

// Radius hesaplama (value'ya göre) - Daha büyük radius'lar
export const getRadiusForValue = (type: string, value: number): number => {
  return 350;
};

// Hover bilgisi için değer formatı
export const getHoverInfo = (type: string, value: number): string => {
  const numValue = parseFloat(value.toString());

  if (type === "LandCover") {
    const landCoverTypes = [
      "Evergreen needleleaf forests",
      "Evergreen broadleaf forests",
      "Deciduous needleleaf forests",
      "Deciduous broadleaf forests",
      "Mixed forests",
      "Closed shrublands",
      "Open shrublands",
      "Woody savannas",
      "Savannas",
      "Grasslands",
      "Permanent wetlands",
      "Croplands",
      "Urban and built-up lands",
      "Cropland/natural vegetation mosaics",
      "Snow and ice",
      "Barren",
      "Water bodies"
    ];

    const index = Math.max(0, Math.min(16, Math.floor(numValue) - 1));
    const typeName = landCoverTypes[index] || "Unknown";

    return `${Math.floor(numValue)} - ${typeName}`;
  }

  // Diğer tipler için sadece değer
  switch (type) {
    case "LST":
      return `${numValue.toFixed(1)}°C`;
    case "NDVI":
      return numValue.toFixed(3);
    case "NPP":
      return `${numValue.toFixed(2)} kg⋅C⋅m⁻²⋅yıl⁻¹`;
    case "TreeCover":
      return `${(numValue).toFixed(2)}%`;
    case "TreeAnalysis":
      return `${numValue.toFixed(1)} (Ağaçlandırma İndeksi)`;
    default:
      return numValue.toString();
  }
};
