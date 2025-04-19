import React, { useRef, useEffect } from "react";

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
const TILE_SIZE = 24; // px, for rendering

// Nature tile colors
const NATURE_COLORS = [
  "#2d5a1f", // dark green - deep grass
  "#3b7a2a", // green - grass
  "#4a8b35", // light green - grass
  "#6b4f27", // brown - dirt
  "#1a75c7", // dark blue - deep water
  "#2196f3", // blue - water
];

// Helper to get a tile color (simple hash for demo)
function getTileColor(x: number, y: number) {
  // Deterministic pseudo-random
  const val = (x * 73856093 ^ y * 19349663) % NATURE_COLORS.length;
  return NATURE_COLORS[(val + NATURE_COLORS.length) % NATURE_COLORS.length];
}


const GameCanvas: React.FC<GameCanvasProps> = ({ player, treasures, zoom, onMove, onCollectTreasure }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !player) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fixed visible area based on zoom scale
    let visibleTiles = 100;
    if (zoom === 100) visibleTiles = 500;
    else if (zoom === 20) visibleTiles = 100;
    else if (zoom === 2) visibleTiles = 10;
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
        ctx.fillStyle = getTileColor(x, y);
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

    // Draw treasures
    treasures.forEach(({ x, y, emoji }) => {
      if (x >= startX && x < endX && y >= startY && y < endY) {
        ctx.font = `${TILE_SIZE - 4}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          emoji,
          (x - startX + 0.5) * TILE_SIZE,
          (y - startY + 0.5) * TILE_SIZE
        );
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

  // Keyboard movement
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!player) return;
      if (["ArrowUp", "w"].includes(e.key)) onMove(0, -1);
      else if (["ArrowDown", "s"].includes(e.key)) onMove(0, 1);
      else if (["ArrowLeft", "a"].includes(e.key)) onMove(-1, 0);
      else if (["ArrowRight", "d"].includes(e.key)) onMove(1, 0);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [player, onMove]);

  return (
    <div className="flex flex-col items-center mt-4">
      <div className="bg-black rounded-lg shadow-2xl border-4 border-gray-800 p-2">
        <canvas
          ref={canvasRef}
          className="block bg-black rounded-lg border-2 border-gray-700 shadow-xl"
          style={{ maxWidth: '80vw', maxHeight: '70vh', background: '#000' }}
        />
      </div>
    </div>
  );
};

export default GameCanvas;
