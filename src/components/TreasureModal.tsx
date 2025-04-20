import React from 'react';
import { Treasure } from './GameCanvas';

interface TreasureModalProps {
  treasure: Treasure | null;
  onClose: () => void;
}

const TreasureModal: React.FC<TreasureModalProps> = ({ treasure, onClose }) => {
  if (!treasure) return null;

  const rarityLevels = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  const rarity = rarityLevels[Math.floor(Math.random() * rarityLevels.length)];
  const powerLevel = Math.floor(Math.random() * 100) + 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{treasure.emoji}</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            Mystical Treasure
          </h2>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-700 bg-opacity-50 p-3 rounded-lg">
            <div className="text-gray-400 text-sm">Location</div>
            <div className="text-white font-mono">X: {treasure.x}, Y: {treasure.y}</div>
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
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                ></div>
              </div>
              <div className="text-white font-mono">{powerLevel}/100</div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default TreasureModal;
