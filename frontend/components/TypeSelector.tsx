"use client";

interface TypeSelectorProps {
  selectedType: string;
  onTypeChange: (value: string) => void;
}

const DATA_TYPES = [
  { value: "LandCover", label: "Land Cover (1-17)", range: "1-17 (Forest, Grassland, Water, etc.)" },
  { value: "LST", label: "Land Surface Temperature", range: "-20°C to +70°C" },
  { value: "NDVI", label: "NDVI", range: "-0.2 to 1.0" },
  { value: "NPP", label: "Net Primary Productivity", range: "0 to ~1.0 kg⋅C⋅m⁻²⋅yıl⁻¹" },
  { value: "TreeCover", label: "Tree Cover Percentage", range: "0% to 100%" },
  { value: "TreeAnalysis", label: "Tree Analysis Index", range: "0-100 (Ağaçlandırma İndeksi)" },
];

export default function TypeSelector({ selectedType, onTypeChange }: TypeSelectorProps) {
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onTypeChange(e.target.value);
  };
  
  return (
    <div className="bg-gradient-to-br from-green-600/30 to-emerald-600/30 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-3 min-w-[200px]">
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-xs font-bold text-white mb-1">Data Type</h3>
          <select 
            value={selectedType} 
            onChange={handleChange}
            className="w-full bg-white/20 border border-white/30 text-white h-8 text-xs rounded px-2 focus:ring-2 focus:ring-green-400 focus:outline-none"
          >
            {DATA_TYPES.map((type) => (
              <option 
                key={type.value} 
                value={type.value}
                className="bg-gray-800 text-white"
              >
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        {selectedType && (
          <div className="text-xs text-white/80 bg-white/10 rounded p-1">
            <p className="truncate"><strong>{DATA_TYPES.find(t => t.value === selectedType)?.label}</strong></p>
            <p className="text-xs text-white/60">{DATA_TYPES.find(t => t.value === selectedType)?.range}</p>
          </div>
        )}
      </div>
    </div>
  );
}
