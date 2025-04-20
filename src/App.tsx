import React, { useState, useEffect } from "react";
import WalletLogin from "./components/MetaMaskLogin";
import GameCanvas, { Player, Treasure } from "./components/GameCanvas";
import ZoomSlider from "./components/ZoomSlider";
import CollectedTreasuresList from "./components/CollectedTreasuresList";
import ProfileBanner from "./components/ProfileBanner";
import treasureData from "./data/treasureData.json";
import { userService, User } from "./services/UserService";

const GRID_SIZE = 500;
const INITIAL_ZOOM = 100; // Start at full map (500x500)
const ZOOM_LEVELS = [100, 50, 20, 10, 2]; // 500x500, 250x250, 100x100, 50x50, 10x10

// Load treasures from our database
function loadTreasuresFromData(): Treasure[] {
  return treasureData.treasures.map(t => ({
    id: t.id,
    x: t.x,
    y: t.y,
    emoji: t.emoji,
    name: t.name,
    description: t.description,
    rarity: t.rarity,
    biome: t.biome
  }));
}

// Calculate treasure value based on rarity
function calculateTreasureValue(rarity: string): number {
  const valueMap: {[key: string]: number} = {
    'Common': 10,
    'Uncommon': 50,
    'Rare': 200,
    'Epic': 500,
    'Legendary': 1000
  };
  return valueMap[rarity] || 10; // Default to 10 if rarity not found
}

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'metamask' | 'phantom' | 'email' | 'other'>('other');
  const [player, setPlayer] = useState<Player | null>(null);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [treasures] = useState<Treasure[]>(loadTreasuresFromData());
  const [score, setScore] = useState(0);
  const [collectedTreasures, setCollectedTreasures] = useState<Treasure[]>([]);
  const [openedTreasures, setOpenedTreasures] = useState<{[key: string]: boolean}>({});
  const [showTreasuresList, setShowTreasuresList] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load user data from persistence
  useEffect(() => {
    if (address) {
      // Try to load user data
      const userData = userService.getUserById(address);
      console.log('Loading user data:', userData);
      
      if (userData) {
        // Restore user data
        setCurrentUser(userData);
        setCollectedTreasures(userData.treasures || []);
        setScore(userData.score || 0);
        
        // Mark all treasures as opened
        const opened: {[key: string]: boolean} = {};
        userData.treasures.forEach(t => {
          const key = `${t.x}-${t.y}`;
          opened[key] = true;
        });
        setOpenedTreasures(opened);
      } else {
        // Create new user
        const newUser = userService.saveUser({
          id: address,
          walletAddress: walletType !== 'email' ? address : undefined,
          email: walletType === 'email' ? address.replace('email:', '') : undefined,
          walletType,
          treasures: [],
          score: 0
        });
        setCurrentUser(newUser);
      }
    }
  }, [address, walletType]);
  
  // When wallet connects, spawn player at random position
  const handleConnect = (addr: string, type: 'metamask' | 'phantom' | 'email' | 'other') => {
    try {
      setIsLoading(true);
      console.log(`Connected with ${type} wallet: ${addr}`);
      
      // Set address and wallet type
      setAddress(addr);
      setWalletType(type);
      
      // Create player at center of map
      setPlayer({
        x: Math.floor(GRID_SIZE / 2),
        y: Math.floor(GRID_SIZE / 2),
        address: addr,
      });
      
      // Loading complete
      setIsLoading(false);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setIsLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    // Clear local state
    setAddress(null);
    setWalletType('other');
    setPlayer(null);
    setScore(0);
    setCollectedTreasures([]);
    setOpenedTreasures({});
    setCurrentUser(null);
    setShowTreasuresList(false);
    
    // Log the logout action
    console.log('User logged out');
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
            <WalletLogin onConnect={handleConnect} />
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-4 text-blue-500">Loading game data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ProfileBanner 
              address={address || ''}
              walletType={walletType}
              score={score} 
              onLogout={handleLogout}
              onShowTreasuresList={() => setShowTreasuresList(true)}
              collectedTreasures={collectedTreasures}
            />
            <div className="relative">
              <div className="rounded-lg shadow-xl">
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
                    console.log(`Opened treasure at ${treasure.x},${treasure.y}`);
                  }}
                  onCollectTreasure={(treasure) => {
                    const treasureKey = `${treasure.x}-${treasure.y}`;
                    
                    // Only collect treasure once
                    if (!openedTreasures[treasureKey]) {
                      // Calculate treasure value
                      const treasureValue = calculateTreasureValue(treasure.rarity || 'Common');
                      
                      // Update local state
                      setScore(prev => prev + treasureValue);
                      setCollectedTreasures(prev => [...prev, treasure]);
                      
                      // Mark as opened
                      setOpenedTreasures(prev => ({
                        ...prev,
                        [treasureKey]: true
                      }));
                      
                      // Save to user's persistence
                      if (address) {
                        const updatedUser = userService.addTreasureToUser(address, treasure);
                        if (updatedUser) {
                          setCurrentUser(updatedUser);
                        }
                      }
                      
                      console.log(`Collected treasure: ${treasure.name} at ${treasure.x},${treasure.y}`);
                    }
                  }}
                />
              </div>
              <div className="absolute bottom-4 right-4 bg-gray-800 rounded-lg p-2">
                <ZoomSlider zoom={zoom} setZoom={setZoom} />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-400 bg-gray-800 rounded-lg p-4">
              <div>
                <span className="font-bold text-blue-400">Controls:</span> Use WASD or Arrow Keys to move, or click to move towards a location
              </div>
              <div>
                <span className="font-bold text-blue-400">Tip:</span> Walk on treasures to collect them
              </div>
            </div>
            
            {/* Collected Treasures List Modal */}
            {showTreasuresList && (
              <CollectedTreasuresList 
                treasures={collectedTreasures}
                onClose={() => setShowTreasuresList(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
