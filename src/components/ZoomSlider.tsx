import React from "react";

interface ZoomSliderProps {
  zoom: number;
  setZoom: (zoom: number) => void;
} 

const ZoomSlider: React.FC<ZoomSliderProps> = ({ zoom, setZoom }) => {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="text-xs font-medium text-gray-300 mb-1">Zoom Level</div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setZoom(100)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
            zoom === 100
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Far
        </button>
        <button
          onClick={() => setZoom(20)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
            zoom === 20
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Mid
        </button>
        <button
          onClick={() => setZoom(2)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
            zoom === 2
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Near
        </button>
      </div>
    </div>
  );
};

export default ZoomSlider;
