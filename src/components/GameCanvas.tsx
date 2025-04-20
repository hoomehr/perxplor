import React, { useRef, useEffect, useState } from "react";
import TreasureModal from "./TreasureModal";

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
  emoji: string;
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

// Trippy vibrant Persian carpet color palette
const PRIMARY_COLORS = [
  '#FF1493', // deep pink
  '#9400D3', // dark violet
  '#00BFFF', // deep sky blue
  '#FF4500', // orange red
  '#32CD32', // lime green
  '#8A2BE2', // blue violet
];

// Secondary colors for patterns
const PATTERN_COLORS = [
  '#FFFF00', // yellow
  '#00FFFF', // cyan
  '#FF00FF', // magenta
  '#7FFF00', // chartreuse
  '#FF1493', // deep pink
  '#00FA9A', // medium spring green
];

// Pattern types for Persian carpet
const PATTERN_TYPES = [
  'diamond',
  'floral',
  'geometric',
  'medallion',
  'border',
  'allover'
];

// Helper to get a tile color with Persian carpet patterns
function getTileColor(x: number, y: number, time: number = 0, zoom: number) {
  // Create a deterministic seed based on coordinates
  const seed = (x * 73856093 ^ y * 19349663);
  
  // Get pattern type based on region
  const regionSize = 10;
  const regionX = Math.floor(x / regionSize);
  const regionY = Math.floor(y / regionSize);
  const regionSeed = (regionX * 73856093 ^ regionY * 19349663);
  const patternType = PATTERN_TYPES[Math.abs(regionSeed) % PATTERN_TYPES.length];
  
  // More detailed patterns for close-up views
  if (zoom <= 10) {
    // Determine if this is a border tile
    const isBorder = (x % regionSize === 0 || y % regionSize === 0 || 
                     x % regionSize === regionSize - 1 || y % regionSize === regionSize - 1);
    
    // Determine if this is a medallion center
    const isCenter = (x % regionSize === Math.floor(regionSize / 2) && 
                     y % regionSize === Math.floor(regionSize / 2));
    
    // Create geometric patterns
    const isAlternating = ((x + y) % 2 === 0);
    const isQuadrant = ((x % 3) + (y % 3)) % 3 === 0;
    
    // Select colors based on pattern type and position
    let colorIndex;
    
    if (patternType === 'border' && isBorder) {
      colorIndex = Math.abs(seed) % PATTERN_COLORS.length;
      return PATTERN_COLORS[colorIndex];
    } else if (patternType === 'medallion' && (isCenter || (Math.abs(x % regionSize - regionSize/2) + Math.abs(y % regionSize - regionSize/2) <= 2))) {
      colorIndex = Math.abs(seed) % PATTERN_COLORS.length;
      return PATTERN_COLORS[colorIndex];
    } else if (patternType === 'diamond' && isAlternating) {
      colorIndex = Math.abs(seed) % PATTERN_COLORS.length;
      return PATTERN_COLORS[colorIndex];
    } else if (patternType === 'geometric' && isQuadrant) {
      colorIndex = Math.abs(seed) % PATTERN_COLORS.length;
      return PATTERN_COLORS[colorIndex];
    } else if (patternType === 'floral' && ((x * y) % 5 === 0)) {
      colorIndex = Math.abs(seed) % PATTERN_COLORS.length;
      return PATTERN_COLORS[colorIndex];
    } else {
      colorIndex = Math.abs(seed) % PRIMARY_COLORS.length;
      return PRIMARY_COLORS[colorIndex];
    }
  }
  
  // Simpler colors for zoomed out view - still Persian carpet themed
  const val = Math.abs(seed) % PRIMARY_COLORS.length;
  return PRIMARY_COLORS[val];
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

    // Draw treasures with highlight if player is nearby
    treasures.forEach(({ x, y, emoji }) => {
      if (x >= startX && x < endX && y >= startY && y < endY) {
        // Create unique key for this treasure
        const treasureKey = `${x}-${y}`;

        // Check if player is on this tile
        const isPlayerHere = player.x === x && player.y === y;

        // Check if treasure has been opened
        const isOpened = openedTreasures[treasureKey];

        // Make treasure clickable in close-up views
        const isClickable = (zoom <= 10) && !isOpened;

        // Draw highlight for clickable treasures
        if (isPlayerHere || isClickable) {
          ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
          ctx.fillRect(
            (x - startX) * tileSize,
            (y - startY) * tileSize,
            tileSize,
            tileSize
          );
        }

        // Draw treasure emoji
        ctx.font = `${tileSize - 4}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          emoji,
          (x - startX + 0.5) * tileSize,
          (y - startY + 0.5) * tileSize
        );

        // Add sparkle effect for clickable treasures
        if (isPlayerHere || isClickable) {
          ctx.fillStyle = isPlayerHere ? '#FFD700' : '#4CD0FF';
          const sparkleSize = tileSize / 8;
          const centerX = (x - startX + 0.5) * tileSize;
          const centerY = (y - startY + 0.5) * tileSize;

          // Draw sparkles
          for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const sparkleX = centerX + Math.cos(angle) * (tileSize / 3);
            const sparkleY = centerY + Math.sin(angle) * (tileSize / 3);

            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    });

    // Check for treasure collection
    if (onCollectTreasure) {
      const playerPos = { x: player.x, y: player.y };
      treasures.forEach(treasure => {
        if (treasure.x === playerPos.x && treasure.y === playerPos.y) {
          onCollectTreasure(treasure);
        }
      });
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

  // Handle canvas click for treasure collection and details
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
    if (DEBUG) console.log('View start coordinates:', { startX, startY });

    // Enable for more detailed debugging
    if (DEBUG) {
      // Log all treasures for debugging
      console.log('All treasures:', treasures);

      // Log visible treasures
      const visibleTreasures = treasures.filter(t =>
        t.x >= startX && t.x < startX + visibleTiles &&
        t.y >= startY && t.y < startY + visibleTiles
      );
      console.log('Visible treasures:', visibleTreasures);
    }

    // Find clicked treasure - adjust for viewport offset
    const clickedTreasure = treasures.find(t => {
      // Check if treasure is in the visible area
      if (t.x >= startX && t.x < startX + visibleTiles &&
        t.y >= startY && t.y < startY + visibleTiles) {
        // Convert to canvas coordinates
        const canvasX = t.x - startX;
        const canvasY = t.y - startY;
        const isMatch = clickedX === canvasX && clickedY === canvasY;
        if (isMatch && DEBUG) {
          console.log('Found matching treasure:', t);
        }
        return isMatch;
      }
      return false;
    });

    if (clickedTreasure) {
      const treasureKey = `${clickedTreasure.x}-${clickedTreasure.y}`;

      if (DEBUG) {
        console.log('Treasure clicked:', clickedTreasure);
        console.log('Player position:', player);
        console.log('Is same position:', clickedTreasure.x === player.x && clickedTreasure.y === player.y);
        console.log('Zoom level:', zoom);
        console.log('Already opened:', openedTreasures[treasureKey]);
      }
      
      // Always show the modal when a treasure is clicked
      setSelectedTreasure(clickedTreasure);
      
      // If player is on the same tile, collect the treasure
      if (clickedTreasure.x === player.x && clickedTreasure.y === player.y && onCollectTreasure) {
        if (DEBUG) console.log('Collecting treasure');
        onCollectTreasure(clickedTreasure);
      } 
      // If in close-up view and not already opened, mark as opened
      else if (zoom <= 10 && onOpenTreasure && !openedTreasures[treasureKey]) {
        if (DEBUG) console.log('Opening treasure details');
        onOpenTreasure(clickedTreasure);
      }
    } else if (DEBUG) {
      console.log('No treasure found at clicked position');
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
