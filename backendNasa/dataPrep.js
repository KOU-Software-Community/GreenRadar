// dataPrep.js
// Güncellenme: 04/10/2025

import fs from "fs";
import csv from "csv-parser";
import * as turf from "@turf/turf";

export const collectData = (targetDate, polygon, type) => {
  return new Promise((resolve, reject) => {
    let path;
    let typeKey = type;

    try {
      switch (type) {
        case "LST":
          path = "./datas/all_LST_data.csv";
          typeKey = "LST_Celsius";
          break;
        case "NPP":
          path = "./datas/all_NPP_data.csv";
          typeKey = "NPP_kgCm2perYear";
          break;
        case "LandCover":
          path = "./datas/all_LandCover_data.csv";
          typeKey = "LandCover_Type";
          break;
        case "NDVI":
          path = "./datas/all_NDVI_data.csv";
          typeKey = "NDVI_Value";
          break;
        case "TreeCover":
          path = "./datas/all_TreeCover_data.csv";
          typeKey = "TreeCover_Percent";
          targetDate = new Date().toISOString();
          break;
        case "TreeAnalysis":
          path = "./datas/tree_analysis.csv";
          typeKey = "suitability_score";
          targetDate = new Date().toISOString();
          break;
        default:
          return reject(new Error(`Geçersiz type: ${type}`));
      }
    } catch (err) {
      return reject(err);
    }

    if (!fs.existsSync(path)) {
      return reject(new Error(`Veri dosyası bulunamadı: ${path}`));
    }

    // Tarih işlemlerini düzelt
    const target = new Date(targetDate);
    if (isNaN(target.getTime())) {
      return reject(new Error(`Geçersiz tarih formatı: ${targetDate}`));
    }

    const insidePoints = [];

    const stream = fs.createReadStream(path).pipe(csv());

    stream.on("data", (row) => {
      try {
        const lon = parseFloat(row.longitude);
        const lat = parseFloat(row.latitude);
        if (isNaN(lon) || isNaN(lat)) return;

        // Geliştirilmiş değer ayrıştırma
        let val;
        if (typeKey === "LandCover_Type") {
          val = row[typeKey];
          if (!val || val.trim() === "") return;
        } else {
          const rawValue = row[typeKey];
          
          if (typeof rawValue === 'string') {
            const cleanedValue = rawValue.trim();
            
            if (cleanedValue === '' || cleanedValue === '-' || cleanedValue === 'NULL' || cleanedValue === 'null') {
              return;
            }
            
            val = parseFloat(cleanedValue);
          } else {
            val = parseFloat(rawValue);
          }

          if (isNaN(val)) {
            console.warn(`⚠️ Geçersiz sayısal değer: ${rawValue}, koordinat: [${lon}, ${lat}]`);
            return;
          }
          
          // SADECE TreeCover için 0 değerlerini filtrele
          if (type === "TreeCover" && val === 0) {
            console.warn(`⚠️ TreeCover 0 değeri filtrelendi, koordinat: [${lon}, ${lat}]`);
            return;
          }
          // Diğer tipler için 0 değerlerini koru
        }

        // Tarih kontrolünü düzelt
        const rowDate = new Date(row.date);
        if (isNaN(rowDate.getTime())) {
          console.warn(`⚠️ Geçersiz satır tarihi: ${row.date}, koordinat: [${lon}, ${lat}]`);
          return;
        }

        const point = turf.point([lon, lat]);
        let geom;

        if (polygon.type === "FeatureCollection") {
          geom = polygon.features[0].geometry;
        } else if (polygon.type === "Feature") {
          geom = polygon.geometry;
        } else {
          geom = polygon;
        }

        if (!turf.booleanPointInPolygon(point, geom)) return;

        insidePoints.push({
          id: row.id || null,
          date: rowDate, // Date objesi olarak sakla
          dateString: row.date, // Orijinal string de sakla
          coordinates: [lon, lat],
          value: val,
        });
      } catch (e) {
        console.warn("Satır atlandı:", e.message);
      }
    });

    stream.on("end", () => {
      try {
        if (insidePoints.length === 0) {
          console.warn("⚠️ Poligon içinde nokta bulunamadı.");
          return resolve(turf.featureCollection([]));
        }

        console.log(`📊 Toplam ${insidePoints.length} nokta bulundu`);
        
        // Tarih bilgilerini debug et
        const dates = insidePoints.map(p => p.dateString);
        const uniqueDates = [...new Set(dates)];
        console.log(`📅 Bulunan benzersiz tarihler: ${uniqueDates.slice(0, 10).join(', ')}${uniqueDates.length > 10 ? '...' : ''}`);
        console.log(`🎯 Hedef tarih: ${targetDate}`);

        // KOORDİNAT BAZLI EN YAKIN TARİH BULMA
        // Önce koordinatları grupla
        const pointsByCoord = new Map();
        
        insidePoints.forEach(point => {
          const coordKey = point.coordinates.join(',');
          if (!pointsByCoord.has(coordKey)) {
            pointsByCoord.set(coordKey, []);
          }
          pointsByCoord.get(coordKey).push(point);
        });

        // Her koordinat için hedef tarihe en yakın noktayı bul
        const bestPoints = [];
        
        for (const [coordKey, points] of pointsByCoord) {
          let bestPoint = points[0];
          let minTimeDiff = Math.abs(target - bestPoint.date);
          
          for (const point of points) {
            const timeDiff = Math.abs(target - point.date);
            if (timeDiff < minTimeDiff) {
              minTimeDiff = timeDiff;
              bestPoint = point;
            }
          }
          
          bestPoints.push(bestPoint);
        }

        console.log(`✅ Koordinat bazlı filtreleme sonrası: ${bestPoints.length} nokta`);

        // Tarihe göre sırala (isteğe bağlı)
        bestPoints.sort((a, b) => a.date - b.date);

        // Son kontroller
        const values = bestPoints.map(p => p.value);
        
        // 0 değerlerini say (sadece bilgi için)
        const zeroCount = values.filter(v => v === 0).length;
        if (zeroCount > 0) {
          if (type === "TreeCover") {
            console.error(`❌ HATA: Hala ${zeroCount} adet 0 değeri bulunuyor!`);
          } else {
            console.log(`📝 ${zeroCount} adet 0 değeri korunuyor (${type} verisi)`);
          }
        }
        
        console.log(`📈 Son değer aralığı: ${Math.min(...values)} - ${Math.max(...values)}`);
        console.log(`🗓️ Kullanılan tarih aralığı: ${bestPoints[0]?.dateString} - ${bestPoints[bestPoints.length - 1]?.dateString}`);

        const featureCollection = turf.featureCollection(
          bestPoints.map((p) =>
            turf.point(p.coordinates, {
              id: p.id,
              date: p.dateString, // Orijinal string tarihi kullan
              type: typeKey,
              value: p.value,
              timeDiff: Math.abs(target - p.date), // Debug için zaman farkı
            })
          )
        );

        resolve(featureCollection);
      } catch (err) {
        reject(err);
      }
    });

    stream.on("error", (err) => {
      reject(new Error(`CSV okuma hatası: ${err.message}`));
    });
  });
};




export function flattenData(data) {
  return data.apiPointCoordinates.map((feature) => {
    const [lon, lat] = feature.coordinates;
    return {
      enlem: lat,
      boylam: lon,
      potansiyel: feature.properties?.value ?? null,
    };
  });
}
