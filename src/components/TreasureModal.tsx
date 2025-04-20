import React, { useState, useEffect } from 'react';
import { Treasure } from './GameCanvas';
import treasureData from '../data/treasureData.json';

interface TreasureModalProps {
  treasure: Treasure | null;
  onClose: () => void;
}

const TreasureModal: React.FC<TreasureModalProps> = ({ treasure, onClose }) => {
  // Animation for the modal - MUST be before any conditional returns
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (treasure) {
      // Delay to trigger animation
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [treasure]);
  
  if (!treasure) return null;

  // Get biome description for the treasure's biome
  const getBiomeDescription = (biome?: string) => {
    if (!biome || !treasureData.biomes[biome as keyof typeof treasureData.biomes]) {
      return "Unknown lands";
    }
    return treasureData.biomes[biome as keyof typeof treasureData.biomes].description;
  };
  
  // Calculate treasure value based on rarity
  const calculateTreasureValue = (rarity?: string) => {
    const valueMap: {[key: string]: number} = {
      'Common': 10,
      'Uncommon': 50,
      'Rare': 200,
      'Epic': 500,
      'Legendary': 1000
    };
    return valueMap[rarity || 'Common'] || 10;
  };
  
  // Determine the age of the treasure (more deterministic now)
  const getTreasureAge = (id?: string) => {
    if (!id) return 100;
    const idNumber = parseInt(id.replace(/\D/g, '') || '1', 10);
    return (idNumber * 97) % 1000 + 50; // Range from 50-1049 years
  };
  
  // Power level determination based on rarity and id
  const getPowerLevel = (rarity?: string, id?: string) => {
    const rarityMultiplier: {[key: string]: number} = {
      'Common': 0.5,
      'Uncommon': 0.7,
      'Rare': 0.8,
      'Epic': 0.9,
      'Legendary': 1.0
    };
    
    if (!id) return 50;
    const idNumber = parseInt(id.replace(/\D/g, '') || '1', 10);
    const baseLevel = (idNumber * 37) % 70 + 30; // 30-99 base level
    return Math.floor(baseLevel * (rarityMultiplier[rarity || 'Common'] || 0.5));
  };
  
  const rarity = treasure.rarity || 'Common';
  const biomeDesc = getBiomeDescription(treasure.biome);
  const value = calculateTreasureValue(rarity);
  const age = getTreasureAge(treasure.id);
  const powerLevel = getPowerLevel(rarity, treasure.id);
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{treasure.emoji}</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            {treasure.name || "Mystical Treasure"}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-700 bg-opacity-50 p-3 rounded-lg">
            <div className="text-gray-400 text-sm">Location</div>
            <div className="text-white font-mono">X: {treasure.x}, Y: {treasure.y}</div>
          </div>

          <div className="bg-gray-700 bg-opacity-50 p-3 rounded-lg">
            <div className="text-gray-400 text-sm">Biome</div>
            <div className="text-white">{treasure.biome ? treasure.biome.charAt(0).toUpperCase() + treasure.biome.slice(1) : "Unknown"}</div>
            <div className="text-gray-300 text-xs mt-1">{biomeDesc}</div>
          </div>
          
          <div className="bg-gray-700 bg-opacity-50 p-3 rounded-lg">
            <div className="text-gray-400 text-sm">Description</div>
            <div className="text-white">{treasure.description || "A mysterious artifact from ancient times."}</div>
          </div>

          <div className="bg-gray-700 bg-opacity-50 p-3 rounded-lg">
            <div className="text-gray-400 text-sm">Rarity</div>
            <div className={`font-bold ${
              rarity === 'Legendary' ? 'text-yellow-400' :
              rarity === 'Epic' ? 'text-purple-400' :
              rarity === 'Rare' ? 'text-blue-400' :
              rarity === 'Uncommon' ? 'text-green-400' :
              'text-gray-400'
            }`}>
              {rarity}
            </div>
          </div>

          <div className="bg-gray-700 bg-opacity-50 p-3 rounded-lg">
            <div className="text-gray-400 text-sm">Power Level</div>
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-600">
                <div
                  style={{ width: `${powerLevel}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    rarity === 'Legendary' ? 'bg-yellow-500' :
                    rarity === 'Epic' ? 'bg-purple-500' :
                    rarity === 'Rare' ? 'bg-blue-500' :
                    rarity === 'Uncommon' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`}
                ></div>
              </div>
              <div className="text-white font-mono">{powerLevel}/100</div>
            </div>
          </div>

          <div className="bg-gray-700 bg-opacity-50 p-3 rounded-lg">
            <div className="text-gray-400 text-sm">Age</div>
            <div className="text-white">{age} years</div>
          </div>

          <div className="bg-gray-700 bg-opacity-50 p-3 rounded-lg">
            <div className="text-gray-400 text-sm">Value</div>
            <div className="text-yellow-300 font-bold">{value} gold coins</div>
          </div>
        </div>

        <div className="mt-6 flex space-x-2">
          <button
            onClick={onClose}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Close
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              // This would be where you'd add the treasure to inventory in a real game
              console.log('Adding to inventory:', treasure);
            }}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors duration-200 ${
              rarity === 'Legendary' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' :
              rarity === 'Epic' ? 'bg-purple-500 hover:bg-purple-600 text-white' :
              rarity === 'Rare' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
              rarity === 'Uncommon' ? 'bg-green-500 hover:bg-green-600 text-white' :
              'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            Collect Treasure
          </button>
        </div>
      </div>
    </div>
  );
};

export default TreasureModal;
