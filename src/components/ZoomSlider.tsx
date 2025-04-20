import React from "react";

interface ZoomSliderProps {
  zoom: number;
  setZoom: (zoom: number) => void;
} 

const ZoomSlider: React.FC<ZoomSliderProps> = ({ zoom, setZoom }) => {
  const zoomLevels = [
    { value: 100, label: 'Full Map', size: '500×500' },
    { value: 50, label: 'Large', size: '250×250' },
    { value: 20, label: 'Medium', size: '100×100' },
    { value: 10, label: 'Close', size: '50×50' },
    { value: 2, label: 'Detail', size: '10×10' },
  ];

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="text-xs font-medium text-gray-300 mb-1">Zoom Level</div>
      <div className="flex items-center space-x-2">
        {zoomLevels.map(level => (
          <button
            key={level.value}
            onClick={() => setZoom(level.value)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
              zoom === level.value
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={level.size}
          >
            {level.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ZoomSlider;
