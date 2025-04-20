import React, { useState } from 'react';
import { Treasure } from './GameCanvas';
import TreasureModal from './TreasureModal';

interface CollectedTreasuresListProps {
  treasures: Treasure[];
  onClose: () => void;
}

const CollectedTreasuresList: React.FC<CollectedTreasuresListProps> = ({ treasures, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedTreasure, setSelectedTreasure] = useState<Treasure | null>(null);

  // Sort treasures by rarity (Legendary -> Common)
  const sortedTreasures = [...treasures].sort((a, b) => {
    const rarityOrder: { [key: string]: number } = {
      'Legendary': 0,
      'Epic': 1,
      'Rare': 2,
      'Uncommon': 3,
      'Common': 4
    };
    
    const rarityA = a.rarity || 'Common';
    const rarityB = b.rarity || 'Common';
    
    return rarityOrder[rarityA] - rarityOrder[rarityB];
  });

  // Get the total value of all treasures
  const getTotalValue = () => {
    const valueMap: {[key: string]: number} = {
      'Common': 10,
      'Uncommon': 50,
      'Rare': 200,
      'Epic': 500,
      'Legendary': 1000
    };
    
    return treasures.reduce((total, treasure) => {
      const rarity = treasure.rarity || 'Common';
      return total + (valueMap[rarity] || 10);
    }, 0);
  };

  // Get color class for rarity
  const getRarityColorClass = (rarity?: string) => {
    switch(rarity) {
      case 'Legendary': return 'text-yellow-400';
      case 'Epic': return 'text-purple-400';
      case 'Rare': return 'text-blue-400';
      case 'Uncommon': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            Your Treasure Collection
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Total treasures: <span className="text-white">{treasures.length}</span>
          </div>
          <div className="text-sm text-gray-400">
            Total value: <span className="text-yellow-400 font-bold">{getTotalValue()} gold coins</span>
          </div>
        </div>

        {treasures.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No treasures collected yet. Explore the map to find some!
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {sortedTreasures.map((treasure, index) => (
              <div 
                key={`${treasure.id || index}-${treasure.x}-${treasure.y}`}
                className="bg-gray-700 bg-opacity-50 p-3 rounded-lg mb-2 flex items-center cursor-pointer hover:bg-gray-600 transition-colors"
                onClick={() => setSelectedTreasure(treasure)}
              >
                <div className="text-3xl mr-3">{treasure.emoji}</div>
                <div className="flex-1">
                  <div className="font-bold text-white">{treasure.name || "Mysterious Treasure"}</div>
                  <div className="text-sm text-gray-300 truncate">{treasure.description || "An ancient artifact"}</div>
                  <div className="text-xs flex justify-between mt-1">
                    <span className={`${getRarityColorClass(treasure.rarity)}`}>
                      {treasure.rarity || "Common"}
                    </span>
                    <span className="text-gray-400">
                      Location: {treasure.x}, {treasure.y}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>

      {/* Treasure Modal */}
      {selectedTreasure && (
        <TreasureModal
          treasure={selectedTreasure}
          onClose={() => setSelectedTreasure(null)}
        />
      )}
    </div>
  );
};

export default CollectedTreasuresList;
