import { Link } from "wouter";
import type { Goal } from "@workspace/api-client-react";
import { MapPin, Trophy, Target, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export function BuildingCard({ goal, index = 0 }: { goal: Goal; index?: number }) {
  const isCompleted = goal.status === "completed";
  
  // Deterministic properties based on goal ID to maintain "building" shapes
  const heights = ['h-64', 'h-72', 'h-80', 'h-96', 'h-[28rem]', 'h-[32rem]'];
  const heightClass = heights[goal.id % heights.length];
  
  // Deterministic window lighting pattern
  const getWindowPattern = (id: number, windows: number) => {
    return Array.from({ length: windows }).map((_, i) => {
      // Create a pseudo-random boolean based on ID and index
      return ((id * 13 + i * 7) % 100) > 60;
    });
  };

  const windowPattern = getWindowPattern(goal.id, 24);

  return (
    <Link 
      href={`/goal/${goal.id}`}
      className={`group relative flex flex-col justify-end w-48 sm:w-56 lg:w-64 rounded-t-2xl border-t-2 border-l border-r transition-all duration-500 hover:-translate-y-4 cursor-pointer overflow-hidden ${heightClass} ${
        isCompleted 
          ? 'border-primary/60 bg-gradient-to-t from-background via-primary/10 to-primary/5 animate-glow-pulse shadow-[0_-10px_40px_-15px_rgba(139,92,246,0.4)]' 
          : 'border-white/10 bg-gradient-to-t from-background via-white/[0.02] to-transparent hover:border-white/20 hover:bg-white/[0.05]'
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute inset-0 z-0">
        {/* Abstract Windows */}
        <div className="h-full w-full p-4 grid grid-cols-4 gap-2 content-start pt-16">
          {windowPattern.map((lit, i) => (
            <div 
              key={i} 
              className={`h-6 rounded-sm transition-all duration-700 ${
                isCompleted 
                  ? 'bg-primary/80 shadow-[0_0_12px_rgba(139,92,246,0.8)]' 
                  : (lit ? 'bg-white/30 shadow-[0_0_8px_rgba(255,255,255,0.2)]' : 'bg-black/50 border border-white/5')
              }`} 
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 p-5 bg-background/80 backdrop-blur-md border-t border-white/10 flex flex-col gap-3 group-hover:bg-background/95 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-lg leading-tight line-clamp-2 text-white">
            {goal.title}
          </h3>
          {isCompleted ? (
            <div className="p-1.5 rounded-full bg-primary/20 text-primary shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.5)]">
              <Trophy className="h-4 w-4" />
            </div>
          ) : (
            <div className="p-1.5 rounded-full bg-white/10 text-muted-foreground shrink-0">
              <Target className="h-4 w-4" />
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="inline-flex items-center gap-1 text-primary-foreground bg-primary/20 px-2 py-0.5 rounded-full">
            {goal.category}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {goal.city}
          </span>
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>Started {format(new Date(goal.createdAt), 'MMM d')}</span>
          <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
        </div>
      </div>
    </Link>
  );
}
