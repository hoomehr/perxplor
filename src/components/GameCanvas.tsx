import React, { useRef, useEffect, useState } from "react";
import TreasureModal from "./TreasureModal";
import treasureData from "../data/treasureData.json";

// For debugging
const DEBUG = true;

export interface Player {
  x: number;
  y: number;
  address: string;
}

export interface Treasure {
  x: number;
  y: number;
  col?: number;
  row?: number;
  emoji: string;
  id?: string;
  name?: string;
  description?: string;
  rarity?: string;
  biome?: string;
  visibility?: 'all' | 'detail';
}

interface GameCanvasProps {
  player: Player | null;
  treasures: Treasure[];
  zoom: number;
  onMove: (dx: number, dy: number) => void;
  onCollectTreasure?: (treasure: Treasure) => void;
  onOpenTreasure?: (treasure: Treasure) => void;
  openedTreasures: {[key: string]: boolean};
}

const GRID_SIZE = 500;
const BASE_TILE_SIZE = 24; // Base size for tiles

// Realistic biome colors based on our data
const BIOME_COLORS: {[key: string]: string} = {
  forest: '#1B5E20',      // Dark green
  desert: '#FBC02D',      // Sandy yellow
  mountain: '#795548',    // Brown
  water: '#1976D2',       // Blue
  plains: '#8BC34A',      // Light green
  beach: '#FFD54F',       // Light sand
  grassland: '#7CB342',   // Mid green
  swamp: '#4E342E',       // Dark brown
};

// Noise variation colors for natural look
const VARIATION_COLORS: {[key: string]: string[]} = {
  forest: ['#1B5E20', '#2E7D32', '#388E3C', '#43A047', '#4CAF50'],
  desert: ['#FBC02D', '#F9A825', '#F57F17', '#FFB300', '#FFCA28'],
  mountain: ['#795548', '#6D4C41', '#5D4037', '#8D6E63', '#A1887F'],
  water: ['#1976D2', '#1565C0', '#0D47A1', '#2196F3', '#42A5F5'],
  plains: ['#8BC34A', '#7CB342', '#689F38', '#9CCC65', '#AED581'],
  beach: ['#FFD54F', '#FFCA28', '#FFC107', '#FFE082', '#FFECB3'],
  grassland: ['#7CB342', '#689F38', '#558B2F', '#8BC34A', '#9CCC65'],
  swamp: ['#4E342E', '#5D4037', '#6D4C41', '#3E2723', '#4E342E']
};

// Biome distribution map - deterministic based on coordinates
const BIOME_SIZES = {
  continentSize: 150,    // Size of main land masses
  mountainSize: 50,      // Size of mountain ranges
  forestSize: 40,        // Size of forests
  desertSize: 60,        // Size of deserts
  lakeSize: 30,          // Size of lakes
  swampSize: 25          // Size of swamps
};

// Helper to get a tile color with realistic biome patterns
function getTileColor(x: number, y: number, time: number = 0, zoom: number) {
  // Create a deterministic seed based on coordinates
  const seed = (x * 73856093 ^ y * 19349663);
  
  // Use Perlin-like noise function (simplified) for realistic terrain generation
  const noise1 = Math.sin(x * 0.05) * Math.cos(y * 0.05);
  const noise2 = Math.sin(x * 0.02 + y * 0.03) * Math.cos(y * 0.01 - x * 0.04);
  const noise3 = Math.sin(x * 0.01 - y * 0.02) * Math.cos(y * 0.03 + x * 0.01);
  
  // Combine noise functions for more natural patterns
  const combinedNoise = (noise1 + noise2 + noise3) / 3;
  
  // Determine biome type based on noise and position
  // Water for large areas that are very negative in noise
  if (combinedNoise < -0.4) {
    // Deep water areas
    const depthVariation = Math.abs(seed % 5);
    return VARIATION_COLORS['water'][depthVariation];
  }
  
  // Mountains for very positive noise values
  if (combinedNoise > 0.5) {
    const heightVariation = Math.abs(seed % 5);
    return VARIATION_COLORS['mountain'][heightVariation];
  }
  
  // Desert in one quadrant of the map
  if (x > GRID_SIZE * 0.6 && y < GRID_SIZE * 0.4 && combinedNoise > -0.2) {
    const sandVariation = Math.abs(seed % 5);
    return VARIATION_COLORS['desert'][sandVariation];
  }
  
  // Forest in another quadrant
  if (x < GRID_SIZE * 0.4 && y < GRID_SIZE * 0.4 && combinedNoise > -0.2) {
    const forestVariation = Math.abs(seed % 5);
    return VARIATION_COLORS['forest'][forestVariation];
  }
  
  // Swamp in lower left
  if (x < GRID_SIZE * 0.3 && y > GRID_SIZE * 0.7 && combinedNoise > -0.3 && combinedNoise < 0.2) {
    const swampVariation = Math.abs(seed % 5);
    return VARIATION_COLORS['swamp'][swampVariation];
  }
  
  // Beach near water
  if (combinedNoise >= -0.4 && combinedNoise < -0.25) {
    const beachVariation = Math.abs(seed % 5);
    return VARIATION_COLORS['beach'][beachVariation];
  }
  
  // Plains in middle ranges of noise
  if (combinedNoise >= -0.25 && combinedNoise < 0.1) {
    const plainsVariation = Math.abs(seed % 5);
    return VARIATION_COLORS['plains'][plainsVariation];
  }
  
  // Grassland for the rest
  const grassVariation = Math.abs(seed % 5);
  return VARIATION_COLORS['grassland'][grassVariation];
}


const GameCanvas: React.FC<GameCanvasProps> = ({ 
  player, 
  treasures, 
  zoom, 
  onMove, 
  onCollectTreasure,
  onOpenTreasure,
  openedTreasures
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTreasure, setSelectedTreasure] = useState<Treasure | null>(null);
  const [animationTime, setAnimationTime] = useState<number>(0);
  const requestRef = useRef<number | undefined>(undefined);

  // Animation loop for psychedelic effects
  useEffect(() => {
    if (zoom > 10) return; // Only animate in close-up views
    
    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      setAnimationTime(Date.now() - startTime);
      requestRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !player) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fixed visible area based on zoom scale
    let visibleTiles = 500;
    if (zoom === 100) visibleTiles = 500;
    else if (zoom === 50) visibleTiles = 250;
    else if (zoom === 20) visibleTiles = 100;
    else if (zoom === 10) visibleTiles = 50;
    else if (zoom === 2) visibleTiles = 10;

    // Calculate tile size based on zoom level to maintain canvas size
    let tileSize = BASE_TILE_SIZE * (500 / visibleTiles);
    if (zoom === 2) {
      tileSize = BASE_TILE_SIZE * 5; // Make tiles 5 times bigger for closest zoom
    }
    const half = Math.floor(visibleTiles / 2);
    const startX = Math.max(0, player.x - half);
    const startY = Math.max(0, player.y - half);
    const endX = Math.min(GRID_SIZE, startX + visibleTiles);
    const endY = Math.min(GRID_SIZE, startY + visibleTiles);

    // Canvas size
    canvas.width = (endX - startX) * tileSize;
    canvas.height = (endY - startY) * tileSize;

    // Draw grid with nature colors
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        ctx.fillStyle = getTileColor(x, y, animationTime, zoom);
        ctx.fillRect(
          (x - startX) * tileSize,
          (y - startY) * tileSize,
          tileSize,
          tileSize
        );
        ctx.strokeStyle = "#222";
        ctx.strokeRect(
          (x - startX) * tileSize,
          (y - startY) * tileSize,
          tileSize,
          tileSize
        );
      }
    }

    // Draw treasures with highlight and make them more visible
    treasures.forEach((treasure) => {
      const { x, y, emoji, visibility } = treasure;
      
      // Only show treasures that are in the visible area
      if (x >= startX && x < endX && y >= startY && y < endY) {
        // Create unique key for this treasure
        const treasureKey = `${x}-${y}`;

        // Check if player is on this tile
        const isPlayerHere = player.x === x && player.y === y;

        // Check if treasure has been opened
        const isOpened = openedTreasures[treasureKey];

        // Always show treasures
        const shouldShowTreasure = true;
        
        // Only draw treasures that should be visible at this zoom level
        if (shouldShowTreasure) {
          // Check if player is on this tile - this is the only case we highlight
          const isClickable = (zoom <= 10) && !isOpened;
          
          // Only highlight the treasure if player is on it
          if (isPlayerHere) {
            // Simple subtle highlight for player location
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fillRect(
              (x - startX) * tileSize,
              (y - startY) * tileSize,
              tileSize,
              tileSize
            );
          }

          // Draw treasure emoji (appropriate size)
          const fontSize = Math.max(tileSize * 0.8, 14); // Ensure readable size
          ctx.font = `${fontSize}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            emoji,
            (x - startX + 0.5) * tileSize,
            (y - startY + 0.5) * tileSize
          );
        }
      }
    });

    // Check for treasure collection and open modal when player is on a treasure
    const playerPos = { x: player.x, y: player.y };
    const treasureAtPlayerPos = treasures.find(treasure => 
      treasure.x === playerPos.x && treasure.y === playerPos.y
    );
    
    // Automatically open treasure modal when player is on a treasure
    if (treasureAtPlayerPos) {
      setSelectedTreasure(treasureAtPlayerPos);
      
      // Also trigger the collection if that callback exists
      if (onCollectTreasure) {
        onCollectTreasure(treasureAtPlayerPos);
      }
    }

    // Draw player with glow effect
    if (player.x >= startX && player.x < endX && player.y >= startY && player.y < endY) {
      // Add glow effect
      const gradient = ctx.createRadialGradient(
        (player.x - startX + 0.5) * tileSize,
        (player.y - startY + 0.5) * tileSize,
        tileSize / 4,
        (player.x - startX + 0.5) * tileSize,
        (player.y - startY + 0.5) * tileSize,
        tileSize
      );
      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.8)');
      gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        (player.x - startX + 0.5) * tileSize,
        (player.y - startY + 0.5) * tileSize,
        tileSize,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw player
      ctx.fillStyle = "#2563eb";
      ctx.beginPath();
      ctx.arc(
        (player.x - startX + 0.5) * tileSize,
        (player.y - startY + 0.5) * tileSize,
        tileSize / 2.5,
        0,
        2 * Math.PI
      );
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.stroke();
    }
  }, [player, treasures, zoom]);

  // Handle canvas click for movement instead of treasure collection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (DEBUG) console.log('Canvas clicked!');
    if (!player || !canvasRef.current) {
      if (DEBUG) console.log('Missing player or canvas ref');
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (DEBUG) console.log('Click position:', { x, y });

    // Find clicked tile coordinates
    let visibleTiles = 500;
    if (zoom === 100) visibleTiles = 500;
    else if (zoom === 50) visibleTiles = 250;
    else if (zoom === 20) visibleTiles = 100;
    else if (zoom === 10) visibleTiles = 50;
    else if (zoom === 2) visibleTiles = 10;

    // Calculate tile size based on zoom level
    let tileSize = BASE_TILE_SIZE * (500 / visibleTiles);
    if (zoom === 2) {
      tileSize = BASE_TILE_SIZE * 5; // Bigger tiles for closest zoom
    }

    const clickedX = Math.floor(x / tileSize);
    const clickedY = Math.floor(y / tileSize);
    if (DEBUG) console.log('Clicked tile coordinates:', { clickedX, clickedY });

    // Calculate visible area for proper coordinates
    const half = Math.floor(visibleTiles / 2);
    const startX = Math.max(0, player.x - half);
    const startY = Math.max(0, player.y - half);
    
    // Convert canvas coordinates to world coordinates
    const targetX = startX + clickedX;
    const targetY = startY + clickedY;
    
    // Determine direction to move (simple approach - move one step in the most needed direction)
    const dx = Math.sign(targetX - player.x); // -1, 0, or 1
    const dy = Math.sign(targetY - player.y); // -1, 0, or 1
    
    // Apply move in one axis at a time
    if (dx !== 0) {
      onMove(dx, 0);
    } else if (dy !== 0) {
      onMove(0, dy);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!player) return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          onMove(0, -1);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          onMove(0, 1);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          onMove(-1, 0);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          onMove(1, 0);
          break;
        case " ":
        case "Enter":
          // Collect treasure when space or enter is pressed
          if (onCollectTreasure) {
            const treasure = treasures.find(t => t.x === player.x && t.y === player.y);
            if (treasure) {
              // Create a unique key for this treasure
              const treasureKey = `${treasure.x}-${treasure.y}`;
              
              // Only collect if player is on the treasure
              onCollectTreasure(treasure);
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [player, onMove, onCollectTreasure, treasures]);

  return (
    <div className="flex flex-col items-center mt-4">
      <div className="bg-black rounded-lg shadow-2xl border-4 border-gray-800 p-2">
        <canvas
          ref={canvasRef}
          className="bg-gray-800 cursor-pointer"
          onClick={handleCanvasClick}
          style={{ maxWidth: '80vw', maxHeight: '70vh', background: '#000' }}
        />
      </div>
      {selectedTreasure && (
        <TreasureModal
          treasure={selectedTreasure}
          onClose={() => {
            if (DEBUG) console.log('Closing treasure modal');
            setSelectedTreasure(null);
          }}
        />
      )}
    </div>
  );
};

export default GameCanvas;
