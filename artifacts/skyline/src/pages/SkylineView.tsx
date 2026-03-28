import { useListGoals } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Landmark, CheckCircle2, Target, Loader2 } from "lucide-react";
import { useMemo } from "react";

// Hardcoded buildings layout (approximating a skyline)
const BUILDINGS = [
  { width: 60, height: 180, x: 50 },
  { width: 80, height: 320, x: 140 }, // Terminal Tower roughly
  { width: 50, height: 220, x: 250 },
  { width: 110, height: 450, x: 330 }, // Key Tower roughly
  { width: 70, height: 280, x: 470 },
  { width: 90, height: 380, x: 570 }, // 200 Public Square roughly
  { width: 60, height: 190, x: 690 },
  { width: 100, height: 240, x: 780 },
  { width: 55, height: 150, x: 910 },
];

const SVG_WIDTH = 1000;
const SVG_HEIGHT = 500;
const TOTAL_WINDOWS = 300;

export default function SkylineView() {
  const { data, isLoading } = useListGoals();
  const goals = data?.goals || [];

  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const inProgressGoals = goals.length - completedGoals;

  // We want to illuminate a number of windows. If completedGoals > TOTAL_WINDOWS, max out.
  // Otherwise, illuminate exactly `completedGoals` windows.
  // Let's also say `inProgressGoals` occupy windows but are unlit.
  // To distribute windows proportionally among buildings:
  const windowsInfo = useMemo(() => {
    let totalBuildingArea = 0;
    BUILDINGS.forEach((b) => {
      totalBuildingArea += b.width * b.height;
    });

    const windowData: any[] = [];
    let windowIndex = 0;

    BUILDINGS.forEach((b, bIdx) => {
      const proportion = (b.width * b.height) / totalBuildingArea;
      const windowsInThisBuilding = Math.floor(proportion * TOTAL_WINDOWS);
      
      const cols = Math.floor(b.width / 15);
      const rows = Math.ceil(windowsInThisBuilding / cols);
      
      const windowWidth = 6;
      const windowHeight = 10;
      const gapX = (b.width - (cols * windowWidth)) / (cols + 1);
      const gapY = 12;

      let bWindowCount = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (bWindowCount >= windowsInThisBuilding) break;
          
          windowData.push({
            id: windowIndex++,
            bIdx,
            x: b.x + gapX + c * (windowWidth + gapX),
            y: SVG_HEIGHT - b.height + gapY + r * (windowHeight + gapY),
            width: windowWidth,
            height: windowHeight,
          });
          bWindowCount++;
        }
      }
    });

    return windowData;
  }, []);

  const litWindowsCount = Math.min(completedGoals, windowsInfo.length);
  const unlitWindowsCount = Math.min(inProgressGoals, windowsInfo.length - litWindowsCount);

  // Shuffle windows to randomly light them up rather than top-down
  const randomizedWindowIndices = useMemo(() => {
    const indices = Array.from({ length: windowsInfo.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [windowsInfo.length]);

  const litIndices = new Set(randomizedWindowIndices.slice(0, litWindowsCount));
  const inProgressIndices = new Set(randomizedWindowIndices.slice(litWindowsCount, litWindowsCount + unlitWindowsCount));

  const stars = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      cx: Math.random() * SVG_WIDTH,
      cy: Math.random() * (SVG_HEIGHT - 150),
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      delay: Math.random() * 2,
    }));
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0b0b1a] relative overflow-hidden text-white">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a16] via-[#110f24] to-[#1c1236]" />
        <div className="absolute bottom-0 left-0 right-0 h-[60vh] bg-[radial-gradient(ellipse_at_bottom_center,_rgba(110,60,200,0.25)_0%,_transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#160c28] to-transparent" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-12 pb-0">
        
        {/* Header & Stats */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 mb-10"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-2 backdrop-blur-sm shadow-[0_0_30px_rgba(139,92,246,0.15)]">
            <Landmark className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
            The Skyline
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Every completed goal illuminates a window in our collective city. Watch our ambitions come to life.
          </p>

          {isLoading ? (
            <div className="flex justify-center mt-8">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                <Target className="h-5 w-5 text-white/60" />
                <div className="text-left">
                  <div className="text-2xl font-bold font-display">{goals.length}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">Total Goals</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="text-2xl font-bold font-display text-primary">{completedGoals}</div>
                  <div className="text-xs text-primary/70 uppercase tracking-wider font-semibold">Illuminated</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* SVG Visualization */}
        <div className="w-full">
          <svg 
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} 
            className="w-full h-auto drop-shadow-2xl overflow-visible"
            preserveAspectRatio="xMidYMax meet"
          >
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="building-glow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="building-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1a1a2e" />
                <stop offset="100%" stopColor="#0d0d1a" />
              </linearGradient>
            </defs>

            {/* Stars */}
            {stars.map((star) => (
              <motion.circle
                key={star.id}
                cx={star.cx}
                cy={star.cy}
                r={star.r}
                fill="white"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [star.opacity, star.opacity * 2, star.opacity],
                  scale: [1, 1.2, 1] 
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2, 
                  repeat: Infinity, 
                  delay: star.delay 
                }}
              />
            ))}

            {/* Atmosphere glow behind buildings */}
            <rect x="0" y={SVG_HEIGHT - 200} width={SVG_WIDTH} height="200" fill="url(#building-grad)" opacity="0.3" filter="url(#building-glow)" />

            {/* Buildings */}
            {BUILDINGS.map((b, i) => (
              <motion.rect
                key={`b-${i}`}
                x={b.x}
                y={SVG_HEIGHT - b.height}
                width={b.width}
                height={b.height}
                fill="url(#building-grad)"
                stroke="#2a2a4a"
                strokeWidth="1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 + i * 0.08 }}
              />
            ))}

            {/* Windows */}
            {!isLoading && windowsInfo.map((w, i) => {
              const isLit = litIndices.has(w.id);
              const isInProgress = inProgressIndices.has(w.id);
              
              if (!isLit && !isInProgress) return null; // Don't render empty unlit windows to save DOM nodes, or render very dim

              return (
                <motion.rect
                  key={`w-${w.id}`}
                  x={w.x}
                  y={w.y}
                  width={w.width}
                  height={w.height}
                  rx="1"
                  fill={isLit ? "#f59e0b" : "#2d2d4a"}
                  filter={isLit ? "url(#glow)" : undefined}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: 1,
                    fill: isLit ? ["#f59e0b", "#fbbf24", "#f59e0b"] : "#2d2d4a"
                  }}
                  transition={{
                    opacity: { duration: 0.5, delay: 1 + (w.id % 50) * 0.02 },
                    fill: { duration: 3 + Math.random() * 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
                  }}
                />
              );
            })}

            {/* Empty Windows (very dim) */}
            {!isLoading && windowsInfo.map((w) => {
              const isLit = litIndices.has(w.id);
              const isInProgress = inProgressIndices.has(w.id);
              if (isLit || isInProgress) return null;

              return (
                <motion.rect
                  key={`ew-${w.id}`}
                  x={w.x}
                  y={w.y}
                  width={w.width}
                  height={w.height}
                  rx="1"
                  fill="#1a1a2e"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ duration: 0.5, delay: 1 }}
                />
              );
            })}

            {/* Ground */}
            <motion.rect 
              x="0" 
              y={SVG_HEIGHT - 2} 
              width={SVG_WIDTH} 
              height="2" 
              fill="#8b5cf6" 
              opacity="0.5"
              filter="url(#glow)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1.5 }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
