import React, { useRef, useEffect, useState } from "react";
import TreasureModal from "./TreasureModal";

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
}

const GRID_SIZE = 500;
const BASE_TILE_SIZE = 24; // Base size for tiles

// Nature tile colors
const NATURE_COLORS = [
  // Psychedelic color palette
  '#FF61D8', // pink
  '#7A4EFE', // purple
  '#4CD0FF', // cyan
  '#FF8B24', // orange
  '#43F794', // bright green
  '#FFE345', // yellow
];

// Secondary colors for patterns
const PATTERN_COLORS = [
  '#FF3366', // hot pink
  '#33FF99', // neon green
  '#FF9933', // bright orange
  '#3366FF', // bright blue
  '#FF33FF', // magenta
  '#33FFFF', // aqua
];

// Helper to get a tile color with psychedelic patterns
function getTileColor(x: number, y: number, time: number = 0, zoom: number) {
  // More complex pattern for close-up views
  if (zoom <= 10) {
    const baseVal = (x * 73856093 ^ y * 19349663) % NATURE_COLORS.length;
    const patternVal = (x * 19349663 ^ y * 73856093) % PATTERN_COLORS.length;
    
    // Create shifting patterns based on position
    const pattern = Math.sin(x * 0.1 + y * 0.1 + time * 0.001) * 0.5 + 0.5;
    
    // Mix colors based on pattern
    const baseColor = NATURE_COLORS[(baseVal + NATURE_COLORS.length) % NATURE_COLORS.length];
    const patternColor = PATTERN_COLORS[(patternVal + PATTERN_COLORS.length) % PATTERN_COLORS.length];
    
    return pattern > 0.5 ? baseColor : patternColor;
  }
  
  // Simpler colors for zoomed out view
  const val = (x * 73856093 ^ y * 19349663) % NATURE_COLORS.length;
  return NATURE_COLORS[(val + NATURE_COLORS.length) % NATURE_COLORS.length];
}


const GameCanvas: React.FC<GameCanvasProps> = ({ player, treasures, zoom, onMove, onCollectTreasure }) => {
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
    let TILE_SIZE = BASE_TILE_SIZE * (500 / visibleTiles);
    
    // For the closest zoom (10x10), use bigger squares
    if (zoom === 2) {
      TILE_SIZE = BASE_TILE_SIZE * 5; // Make tiles 5 times bigger for closest zoom
    }
    const half = Math.floor(visibleTiles / 2);
    const startX = Math.max(0, player.x - half);
    const startY = Math.max(0, player.y - half);
    const endX = Math.min(GRID_SIZE, startX + visibleTiles);
    const endY = Math.min(GRID_SIZE, startY + visibleTiles);

    // Canvas size
    canvas.width = (endX - startX) * TILE_SIZE;
    canvas.height = (endY - startY) * TILE_SIZE;

    // Draw grid with nature colors
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        ctx.fillStyle = getTileColor(x, y, animationTime, zoom);
        ctx.fillRect(
          (x - startX) * TILE_SIZE,
          (y - startY) * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        );
        ctx.strokeStyle = "#222";
        ctx.strokeRect(
          (x - startX) * TILE_SIZE,
          (y - startY) * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        );
      }
    }

    // Draw treasures with highlight if player is nearby
    treasures.forEach(({ x, y, emoji }) => {
      if (x >= startX && x < endX && y >= startY && y < endY) {
        // Check if player is on this tile
        const isPlayerHere = player.x === x && player.y === y;
        
        // Draw highlight for clickable treasures
        if (isPlayerHere) {
          ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
          ctx.fillRect(
            (x - startX) * TILE_SIZE,
            (y - startY) * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE
          );
        }

        // Draw treasure emoji
        ctx.font = `${TILE_SIZE - 4}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          emoji,
          (x - startX + 0.5) * TILE_SIZE,
          (y - startY + 0.5) * TILE_SIZE
        );

        // Add sparkle effect for clickable treasures
        if (isPlayerHere) {
          ctx.fillStyle = '#FFD700';
          const sparkleSize = TILE_SIZE / 8;
          const centerX = (x - startX + 0.5) * TILE_SIZE;
          const centerY = (y - startY + 0.5) * TILE_SIZE;
          
          // Draw sparkles
          for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const sparkleX = centerX + Math.cos(angle) * (TILE_SIZE / 3);
            const sparkleY = centerY + Math.sin(angle) * (TILE_SIZE / 3);
            
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
        (player.x - startX + 0.5) * TILE_SIZE,
        (player.y - startY + 0.5) * TILE_SIZE,
        TILE_SIZE / 4,
        (player.x - startX + 0.5) * TILE_SIZE,
        (player.y - startY + 0.5) * TILE_SIZE,
        TILE_SIZE
      );
      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.8)');
      gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        (player.x - startX + 0.5) * TILE_SIZE,
        (player.y - startY + 0.5) * TILE_SIZE,
        TILE_SIZE,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw player
      ctx.fillStyle = "#2563eb";
      ctx.beginPath();
      ctx.arc(
        (player.x - startX + 0.5) * TILE_SIZE,
        (player.y - startY + 0.5) * TILE_SIZE,
        TILE_SIZE / 2.5,
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
    if (!player || !onCollectTreasure || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked tile coordinates
    let visibleTiles = 500;
    if (zoom === 100) visibleTiles = 500;
    else if (zoom === 50) visibleTiles = 250;
    else if (zoom === 20) visibleTiles = 100;
    else if (zoom === 10) visibleTiles = 50;

    const tileSize = BASE_TILE_SIZE * (500 / visibleTiles);
    const clickedX = Math.floor(x / tileSize);
    const clickedY = Math.floor(y / tileSize);

    // Find clicked treasure
    const treasure = treasures.find(t => {
      const tileX = t.x % visibleTiles;
      const tileY = t.y % visibleTiles;
      return clickedX === tileX && clickedY === tileY;
    });

    if (treasure) {
      // If player is on the same tile, collect the treasure
      if (treasure.x === player.x && treasure.y === player.y) {
        onCollectTreasure(treasure);
      } 
      // If in close-up view, show treasure details
      else if (zoom <= 10) {
        setSelectedTreasure(treasure);
      }
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
          onClose={() => setSelectedTreasure(null)}
        />
      )}
    </div>
  );
};

export default GameCanvas;
