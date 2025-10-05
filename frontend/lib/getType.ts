function getType(type: string) {
  
  // Null/undefined kontrolü
  if (!type) {
    return "unknown";
  }
  
  // String trim
  const trimmedType = type.trim();
  
  switch (trimmedType) {
    case "LandCover":
      return "LandCover";
    case "LST":
      return "LST";
    case "NDVI":
      return "NDVI";
    case "NPP":
      return "NPP";
    case "TreeCover":
      return "TreeCover";
    case "TreeAnalysis":
      return "TreeAnalysis";
    default:
      return "unknown";
  }
}

export default getType;
