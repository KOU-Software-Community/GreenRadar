import axios from "axios";
import getType from "./getType";
import { GeoJSONData } from "@/types/geojson";

const getPoints = async (
  day: string,
  month: string,
  type: string,
  geojson: GeoJSONData
) => {
  try {
    // Tarih formatını düzelt
    const date = `2024-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const apiType = getType(type);
    

    // POST request olarak düzelt ve GeoJSON'u body'de gönder
    const baseEndpoint = process.env.NEXT_PUBLIC_BASE_ENDPOINT || "http://localhost:5000";
    const url = `${baseEndpoint}/${apiType}/${date}`;
    
    
    const response = await axios.post(
      url,
      geojson,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    // Hata durumunda boş GeoJSON döndür
    return {
      type: "FeatureCollection",
      features: [],
    };
  }
};

export default getPoints;
