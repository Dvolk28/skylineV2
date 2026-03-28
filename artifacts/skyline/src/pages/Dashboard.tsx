import { Link, Redirect } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useListMyGoals } from "@workspace/api-client-react";
import { BuildingCard } from "@/components/goals/BuildingCard";
import { Plus, Building2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const { data, isLoading: goalsLoading } = useListMyGoals({
    query: {
      enabled: isAuthenticated
    }
  });

  if (authLoading) return null;
  if (!isAuthenticated) return <Redirect href="/" />;

  const goals = data?.goals || [];
  const completedCount = goals.filter(g => g.status === 'completed').length;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Dashboard Header */}
      <div className="border-b border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-2"
            >
              <h1 className="text-4xl font-display font-bold text-white">Your Skyline</h1>
              <p className="text-muted-foreground text-lg">
                You've built {goals.length} structures and fully illuminated {completedCount}.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link 
                href="/create-goal"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                Construct New Goal
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Skyline Visualization Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col justify-end pb-0">
        {/* Atmosphere/Sky */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0" />
        
        {goalsLoading ? (
          <div className="flex-1 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center z-10 text-center px-4">
            <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Building2 className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-2xl font-display font-bold text-white mb-2">Empty Lot</h3>
            <p className="text-muted-foreground max-w-sm mb-8">
              Your skyline is currently empty. Start building your future by creating your first goal.
            </p>
            <Link 
              href="/create-goal"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/10 px-6 text-sm font-semibold text-white transition-all hover:bg-white/20 hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Break Ground
            </Link>
          </div>
        ) : (
          <div className="relative z-10 w-full overflow-x-auto pb-0 hide-scrollbar border-b border-white/20 shadow-[0_4px_30px_rgba(139,92,246,0.1)]">
            <div className="flex flex-row items-end justify-start sm:justify-center gap-2 sm:gap-4 lg:gap-6 min-w-max px-8">
              {goals.map((goal, i) => (
                <BuildingCard key={goal.id} goal={goal} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
