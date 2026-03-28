import { useState, useMemo, useRef } from "react";
import { useListGoals } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, CheckCircle2, Target, Loader2, Clock } from "lucide-react";

// SVG viewport
const W = 1400;
const H = 580;

// Window tile dimensions
const WIN_W = 7;
const WIN_H = 10;
const WIN_GAP_X = 6;
const WIN_GAP_Y = 7;

interface WindowDef {
  id: number;
  x: number;
  y: number;
}

interface Goal {
  id: number;
  title: string;
  status: string;
  authorName?: string | null;
  authorImage?: string | null;
}

interface TooltipState {
  mouseX: number;
  mouseY: number;
  goal: Goal;
}

// Generate a uniform grid of windows within a rectangular area
function makeWindows(ax: number, ay: number, aw: number, ah: number, startId: number): WindowDef[] {
  const wins: WindowDef[] = [];
  const cols = Math.max(1, Math.floor((aw + WIN_GAP_X) / (WIN_W + WIN_GAP_X)));
  const rows = Math.max(1, Math.floor((ah + WIN_GAP_Y) / (WIN_H + WIN_GAP_Y)));
  const totalW = cols * WIN_W + (cols - 1) * WIN_GAP_X;
  const totalH = rows * WIN_H + (rows - 1) * WIN_GAP_Y;
  const ox = ax + (aw - totalW) / 2;
  const oy = ay + (ah - totalH) / 2;
  let id = startId;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      wins.push({ id: id++, x: ox + c * (WIN_W + WIN_GAP_X), y: oy + r * (WIN_H + WIN_GAP_Y) });
    }
  }
  return wins;
}

// ---------------------------------------------------------------------------
// Cleveland skyline building data
// Each entry yields SVG elements + window area
// All y-coordinates are in SVG space (origin top-left, ground = H)
// ---------------------------------------------------------------------------

// Returns { svgParts: JSX-renderable config, windows: WindowDef[], totalWindows }
// We keep it as plain data for memo-ability

interface BuildingData {
  key: string;
  // Main rectangle body
  rect: { x: number; y: number; w: number; h: number };
  // Optional extra polygon points (absolute SVG coords) for distinctive tops
  topPolygon?: string;
  // Area for windows (stays inside main rect / slightly inset)
  windowArea: { x: number; y: number; w: number; h: number };
}

// Ground = H = 580
const BUILDINGS: BuildingData[] = [
  // ---- Far-left small buildings ----
  {
    key: "fl1",
    rect: { x: 0, y: 480, w: 38, h: 100 },
    windowArea: { x: 4, y: 484, w: 30, h: 92 },
  },
  {
    key: "fl2",
    rect: { x: 44, y: 450, w: 48, h: 130 },
    windowArea: { x: 48, y: 454, w: 40, h: 122 },
  },
  {
    key: "fl3",
    rect: { x: 98, y: 462, w: 38, h: 118 },
    windowArea: { x: 102, y: 466, w: 30, h: 110 },
  },

  // ---- Mid-left buildings stepping up ----
  {
    key: "ml1",
    rect: { x: 142, y: 400, w: 55, h: 180 },
    windowArea: { x: 146, y: 404, w: 47, h: 172 },
  },
  {
    key: "ml2",
    rect: { x: 202, y: 358, w: 60, h: 222 },
    windowArea: { x: 206, y: 362, w: 52, h: 214 },
  },

  // ---- 200 Public Square / BP Tower — stepped Art Deco ----
  // Base step
  {
    key: "bp-base",
    rect: { x: 266, y: 430, w: 82, h: 150 },
    windowArea: { x: 270, y: 434, w: 74, h: 142 },
  },
  // Middle section
  {
    key: "bp-mid",
    rect: { x: 278, y: 340, w: 58, h: 92 },
    windowArea: { x: 282, y: 344, w: 50, h: 84 },
  },
  // Upper section
  {
    key: "bp-top",
    rect: { x: 288, y: 298, w: 38, h: 44 },
    topPolygon: "288,298 307,278 326,298",
    windowArea: { x: 292, y: 302, w: 30, h: 36 },
  },

  // ---- Terminal Tower — iconic gothic spire ----
  // Wide base wings (like the real one has wide base)
  {
    key: "tt-base-l",
    rect: { x: 332, y: 430, w: 22, h: 150 },
    windowArea: { x: 335, y: 434, w: 16, h: 142 },
  },
  {
    key: "tt-base-r",
    rect: { x: 414, y: 430, w: 22, h: 150 },
    windowArea: { x: 417, y: 434, w: 16, h: 142 },
  },
  // Main tower body
  {
    key: "tt-body",
    rect: { x: 348, y: 275, w: 72, h: 305 },
    windowArea: { x: 352, y: 279, w: 64, h: 297 },
  },
  // Tower neck (narrow before spire)
  {
    key: "tt-neck",
    rect: { x: 367, y: 238, w: 34, h: 38 },
    windowArea: { x: 370, y: 242, w: 28, h: 30 },
  },
  // Spire (thin polygon)
  {
    key: "tt-spire",
    rect: { x: 380, y: 175, w: 8, h: 64 },
    topPolygon: "380,175 384,135 388,175",
    windowArea: { x: 381, y: 178, w: 6, h: 56 },
  },

  // ---- Key Tower — tallest, pyramid cap ----
  // Main body
  {
    key: "kt-body",
    rect: { x: 436, y: 195, w: 96, h: 385 },
    windowArea: { x: 440, y: 199, w: 88, h: 377 },
  },
  // Pyramid cap
  {
    key: "kt-cap",
    rect: { x: 436, y: 155, w: 96, h: 42 },
    topPolygon: "436,155 484,110 532,155",
    windowArea: { x: 440, y: 159, w: 88, h: 34 },
  },

  // ---- Post-Key Tower buildings ----
  {
    key: "pk1",
    rect: { x: 540, y: 310, w: 68, h: 270 },
    windowArea: { x: 544, y: 314, w: 60, h: 262 },
  },
  {
    key: "pk2",
    rect: { x: 614, y: 342, w: 58, h: 238 },
    windowArea: { x: 618, y: 346, w: 50, h: 230 },
  },

  // ---- 55 Public Square ----
  {
    key: "55ps",
    rect: { x: 678, y: 372, w: 62, h: 208 },
    windowArea: { x: 682, y: 376, w: 54, h: 200 },
  },

  // ---- Right-side buildings stepping down ----
  {
    key: "r1",
    rect: { x: 746, y: 400, w: 52, h: 180 },
    windowArea: { x: 750, y: 404, w: 44, h: 172 },
  },
  {
    key: "r2",
    rect: { x: 804, y: 428, w: 48, h: 152 },
    windowArea: { x: 808, y: 432, w: 40, h: 144 },
  },
  {
    key: "r3",
    rect: { x: 858, y: 450, w: 58, h: 130 },
    windowArea: { x: 862, y: 454, w: 50, h: 122 },
  },
  {
    key: "r4",
    rect: { x: 922, y: 468, w: 44, h: 112 },
    windowArea: { x: 926, y: 472, w: 36, h: 104 },
  },
  {
    key: "r5",
    rect: { x: 972, y: 484, w: 50, h: 96 },
    windowArea: { x: 976, y: 488, w: 42, h: 88 },
  },
  {
    key: "r6",
    rect: { x: 1028, y: 498, w: 38, h: 82 },
    windowArea: { x: 1032, y: 502, w: 30, h: 74 },
  },
  {
    key: "r7",
    rect: { x: 1072, y: 510, w: 30, h: 70 },
    windowArea: { x: 1075, y: 514, w: 24, h: 62 },
  },
  {
    key: "r8",
    rect: { x: 1108, y: 522, w: 36, h: 58 },
    windowArea: { x: 1111, y: 526, w: 30, h: 50 },
  },
];

export default function SkylineView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const { data, isLoading } = useListGoals();
  const goals: Goal[] = (data?.goals || []) as Goal[];

  const completedGoals = goals.filter((g) => g.status === "completed");
  const inProgressGoals = goals.filter((g) => g.status === "in_progress");

  // Generate all window positions across all buildings
  const allWindows = useMemo(() => {
    let id = 0;
    const wins: WindowDef[] = [];
    for (const b of BUILDINGS) {
      const { x, y, w, h } = b.windowArea;
      wins.push(...makeWindows(x, y, w, h, id));
      id = wins.length;
    }
    return wins;
  }, []);

  // Stable shuffle (same seed each render) so windows don't jump around
  const shuffledIndices = useMemo(() => {
    const indices = allWindows.map((_, i) => i);
    // Simple deterministic shuffle using goal IDs as seed
    let seed = goals.reduce((acc, g) => acc + g.id, 42);
    for (let i = indices.length - 1; i > 0; i--) {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(seed) % (i + 1);
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [allWindows, goals.length]);

  // Map windows → goals
  const windowGoalMap = useMemo(() => {
    const map = new Map<number, Goal>();
    // Completed goals get the first N lit slots
    completedGoals.forEach((goal, i) => {
      if (i < shuffledIndices.length) {
        map.set(shuffledIndices[i], goal);
      }
    });
    // In-progress goals get the next M slots (but dim)
    inProgressGoals.forEach((goal, i) => {
      const idx = completedGoals.length + i;
      if (idx < shuffledIndices.length) {
        map.set(shuffledIndices[idx], goal);
      }
    });
    return map;
  }, [completedGoals, inProgressGoals, shuffledIndices]);

  const litSet = useMemo(() => {
    const s = new Set<number>();
    completedGoals.forEach((_, i) => {
      if (i < shuffledIndices.length) s.add(shuffledIndices[i]);
    });
    return s;
  }, [completedGoals, shuffledIndices]);

  const inProgressSet = useMemo(() => {
    const s = new Set<number>();
    inProgressGoals.forEach((_, i) => {
      const idx = completedGoals.length + i;
      if (idx < shuffledIndices.length) s.add(shuffledIndices[idx]);
    });
    return s;
  }, [inProgressGoals, completedGoals, shuffledIndices]);

  const stars = useMemo(() => (
    Array.from({ length: 45 }).map((_, i) => {
      const seed = i * 7919 + 1;
      const cx = ((seed * 1664525 + 1013904223) & 0xffff) / 0xffff * W;
      const cy = ((seed * 22695477 + 1) & 0xffff) / 0xffff * (H - 200);
      return { id: i, cx, cy, r: (i % 3 === 0 ? 1.5 : 1), opacity: 0.2 + (i % 5) * 0.08 };
    })
  ), []);

  const handleWindowEnter = (winIdx: number, e: React.MouseEvent) => {
    const goal = windowGoalMap.get(winIdx);
    if (!goal) return;
    setTooltip({ mouseX: e.clientX, mouseY: e.clientY, goal });
  };

  const handleWindowMove = (e: React.MouseEvent) => {
    if (tooltip) setTooltip((t) => t ? { ...t, mouseX: e.clientX, mouseY: e.clientY } : null);
  };

  const handleWindowLeave = () => setTooltip(null);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#080814] relative overflow-hidden text-white">
      {/* Sky gradient */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#06060f] via-[#0d0b22] to-[#1a0e35]" />
        <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,_rgba(120,60,220,0.22)_0%,_transparent_100%)]" />
      </div>

      <div className="relative z-10 pt-10 pb-0 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-[0_0_24px_rgba(139,92,246,0.18)]">
            <Landmark className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-b from-white to-white/65 bg-clip-text text-transparent mb-3">
            The Skyline
          </h1>
          <p className="text-base text-white/55 max-w-xl mx-auto">
            Every completed goal illuminates a window. Watch Cleveland come alive.
          </p>

          {/* Stats */}
          {!isLoading && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                <Target className="h-4 w-4 text-white/50" />
                <span className="font-display font-bold text-xl">{goals.length}</span>
                <span className="text-xs text-white/45 uppercase tracking-widest font-semibold">Total</span>
              </div>
              <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-amber-400/10 border border-amber-400/25 backdrop-blur-md shadow-[0_0_12px_rgba(251,191,36,0.08)]">
                <CheckCircle2 className="h-4 w-4 text-amber-400" />
                <span className="font-display font-bold text-xl text-amber-400">{completedGoals.length}</span>
                <span className="text-xs text-amber-400/60 uppercase tracking-widest font-semibold">Lit</span>
              </div>
              <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                <Clock className="h-4 w-4 text-white/50" />
                <span className="font-display font-bold text-xl">{inProgressGoals.length}</span>
                <span className="text-xs text-white/45 uppercase tracking-widest font-semibold">Building</span>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center mt-6">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          )}
        </motion.div>

        {/* SVG Skyline */}
        <motion.div
          className="w-full relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto"
            preserveAspectRatio="xMidYMax meet"
            onMouseMove={handleWindowMove}
          >
            <defs>
              {/* Amber glow for lit windows */}
              <filter id="win-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              {/* Soft building gradient */}
              <linearGradient id="bld-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e1b38" />
                <stop offset="100%" stopColor="#0e0c1e" />
              </linearGradient>
              {/* Dark gradient for spire-like features */}
              <linearGradient id="spire-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#16132e" />
                <stop offset="100%" stopColor="#1e1b38" />
              </linearGradient>
              {/* Purple city-glow on the ground */}
              <radialGradient id="ground-glow" cx="50%" cy="100%" r="60%">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Stars */}
            {stars.map((s) => (
              <motion.circle
                key={s.id}
                cx={s.cx}
                cy={s.cy}
                r={s.r}
                fill="white"
                initial={{ opacity: 0 }}
                animate={{ opacity: [s.opacity, s.opacity * 1.8, s.opacity] }}
                transition={{ duration: 2.5 + (s.id % 4), repeat: Infinity, delay: (s.id % 10) * 0.3 }}
              />
            ))}

            {/* Ground glow */}
            <rect x="0" y={H - 120} width={W} height="120" fill="url(#ground-glow)" />

            {/* ---- Building shapes ---- */}
            {BUILDINGS.map((b, i) => (
              <motion.g
                key={b.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.05 + i * 0.025 }}
              >
                {/* Main rectangular body */}
                <rect
                  x={b.rect.x}
                  y={b.rect.y}
                  width={b.rect.w}
                  height={b.rect.h}
                  fill="url(#bld-grad)"
                  stroke="#252240"
                  strokeWidth="0.8"
                />
                {/* Distinctive top polygon (spire, pyramid, step) */}
                {b.topPolygon && (
                  <polygon
                    points={b.topPolygon}
                    fill="url(#spire-grad)"
                    stroke="#252240"
                    strokeWidth="0.8"
                  />
                )}
              </motion.g>
            ))}

            {/* ---- Windows ---- */}
            {!isLoading && allWindows.map((w) => {
              const isLit = litSet.has(w.id);
              const isInProg = inProgressSet.has(w.id);
              const hasGoal = windowGoalMap.has(w.id);

              return (
                <rect
                  key={`w-${w.id}`}
                  x={w.x}
                  y={w.y}
                  width={WIN_W}
                  height={WIN_H}
                  rx="1"
                  fill={isLit ? "#f59e0b" : isInProg ? "#3d3558" : "#16132e"}
                  opacity={isLit ? 1 : isInProg ? 0.7 : 0.45}
                  filter={isLit ? "url(#win-glow)" : undefined}
                  style={{ cursor: hasGoal ? "pointer" : "default" }}
                  onMouseEnter={hasGoal ? (e) => handleWindowEnter(w.id, e) : undefined}
                  onMouseLeave={hasGoal ? handleWindowLeave : undefined}
                />
              );
            })}

            {/* Ground line */}
            <rect x="0" y={H - 2} width={W} height="2" fill="#7c3aed" opacity="0.6" />
          </svg>

          {/* ---- Hover Tooltip (HTML overlay) ---- */}
          <AnimatePresence>
            {tooltip && (
              <TooltipCard tooltip={tooltip} svgRef={svgRef} />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// Tooltip rendered as fixed HTML overlay
function TooltipCard({
  tooltip,
  svgRef,
}: {
  tooltip: TooltipState;
  svgRef: React.RefObject<SVGSVGElement | null>;
}) {
  const svgRect = svgRef.current?.getBoundingClientRect();
  if (!svgRect) return null;

  // Position relative to the SVG container div
  const x = tooltip.mouseX - svgRect.left + 12;
  const y = tooltip.mouseY - svgRect.top - 70;

  const isCompleted = tooltip.goal.status === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.96 }}
      transition={{ duration: 0.12 }}
      className="absolute z-50 pointer-events-none"
      style={{ left: x, top: Math.max(8, y) }}
    >
      <div className="bg-[#1a1630] border border-white/15 rounded-xl px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur-md max-w-[240px]">
        <div className="flex items-center gap-2 mb-1.5">
          {tooltip.goal.authorImage ? (
            <img
              src={tooltip.goal.authorImage}
              alt=""
              className="h-5 w-5 rounded-full border border-white/20 shrink-0"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-primary/30 border border-primary/40 flex items-center justify-center shrink-0">
              <span className="text-[8px] font-bold text-primary">
                {tooltip.goal.authorName?.charAt(0).toUpperCase() ?? "?"}
              </span>
            </div>
          )}
          <span className="text-xs text-white/60 font-medium truncate">
            {tooltip.goal.authorName ?? "Anonymous"}
          </span>
          <span
            className={`ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
              isCompleted
                ? "bg-amber-400/20 text-amber-400"
                : "bg-white/10 text-white/50"
            }`}
          >
            {isCompleted ? "✓ Done" : "In Progress"}
          </span>
        </div>
        <p className="text-sm font-semibold text-white leading-snug line-clamp-2">
          {tooltip.goal.title}
        </p>
      </div>
    </motion.div>
  );
}
