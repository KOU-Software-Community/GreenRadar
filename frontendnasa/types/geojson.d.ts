export interface GeoJSONFeature {
  type: "Feature";
  properties: {
    id?: number;
    name?: string;
    radius?: number;
    color?: string;
    borderColor?: string;
    weight?: number;
    [key: string]: any;
  };
  geometry: {
    type: "Point" | "Polygon" | "LineString";
    coordinates: number[] | number[][] | number[][][];
  };
}

export interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export interface DrawingState {
  points: [number, number][];
  markers: any[];
  polyline: any;
  polygons: any[];
  firstMarker: any;
  lastClickTime?: number;
}
