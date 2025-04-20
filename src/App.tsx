import React, { useState, useEffect } from "react";
import MetaMaskLogin from "./components/MetaMaskLogin";
import GameCanvas, { Player, Treasure } from "./components/GameCanvas";
import ZoomSlider from "./components/ZoomSlider";

const GRID_SIZE = 500;
const INITIAL_ZOOM = 100; // Start at full map (500x500)
const ZOOM_LEVELS = [100, 50, 20, 10, 2]; // 500x500, 250x250, 100x100, 50x50, 10x10

// Generate random treasures for demo
function generateTreasures(count: number): Treasure[] {
  const emojis = ["💎", "🎁", "🪙", "🌟", "🍀", "🧸", "⚡️", "🔑"];
  const treasures: Treasure[] = [];
  for (let i = 0; i < count; i++) {
    treasures.push({
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
      emoji: emojis[Math.floor(Math.random() * emojis.length)]
    });
  }
  return treasures;
}

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [treasures] = useState<Treasure[]>(generateTreasures(150));
  const [score, setScore] = useState(0);
  const [collectedTreasures, setCollectedTreasures] = useState<Treasure[]>([]);
  const [openedTreasures, setOpenedTreasures] = useState<{[key: string]: boolean}>({});

  // When wallet connects, spawn player at random position
  const handleConnect = (addr: string) => {
    setAddress(addr);
    setPlayer({
      x: Math.floor(GRID_SIZE / 2),
      y: Math.floor(GRID_SIZE / 2),
      address: addr,
    });
  };

  // Handle player movement
  const handleMove = (dx: number, dy: number) => {
    setPlayer((p) =>
      p
        ? {
            ...p,
            x: Math.max(0, Math.min(GRID_SIZE - 1, p.x + dx)),
            y: Math.max(0, Math.min(GRID_SIZE - 1, p.y + dy)),
          }
        : p
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
            MetaMask Treasure Hunt
          </h1>
          <p className="text-gray-400">Find treasures in the magical realm!</p>
        </div>

        {!address ? (
          <div className="flex justify-center">
            <MetaMaskLogin onConnect={handleConnect} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
              <div className="text-gray-300">
                Wallet: <span className="font-mono text-blue-400">{address.slice(0, 6)}...{address.slice(-4)}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-yellow-500 font-bold">
                  Score: {score}
                </div>
                <div className="text-sm text-gray-400">
                  Treasures: {collectedTreasures.length}/{treasures.length}
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-lg overflow-hidden border-2 border-gray-700 shadow-xl">
                <GameCanvas 
                  player={player} 
                  treasures={treasures} 
                  zoom={zoom} 
                  onMove={handleMove}
                  openedTreasures={openedTreasures}
                  onOpenTreasure={(treasure) => {
                    // Mark treasure as opened using a unique key
                    const treasureKey = `${treasure.x}-${treasure.y}`;
                    setOpenedTreasures(prev => ({
                      ...prev,
                      [treasureKey]: true
                    }));
                  }}
                  onCollectTreasure={(treasure) => {
                    setScore(prev => prev + 10);
                    setCollectedTreasures(prev => [...prev, treasure]);
                  }}
                />
              </div>
              <div className="absolute bottom-4 right-4 bg-gray-800 rounded-lg p-2">
                <ZoomSlider zoom={zoom} setZoom={setZoom} />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-400 bg-gray-800 rounded-lg p-4">
              <div>
                <span className="font-bold text-blue-400">Controls:</span> Use WASD or Arrow Keys to move
              </div>
              <div>
                <span className="font-bold text-blue-400">Tip:</span> Adjust zoom to explore different areas
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
