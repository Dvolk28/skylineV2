import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@workspace/replit-auth-web";
import { ArrowRight, Activity, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const { isAuthenticated, login } = useAuth();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Background Image & Overlays */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/cleveland-bg.png`}
          alt="Abstract Cleveland Skyline"
          className="w-full h-full object-cover opacity-40 object-bottom mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center py-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-primary mb-4 backdrop-blur-sm">
              <Zap className="h-4 w-4" />
              <span>Building collective ambition</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-extrabold tracking-tight text-white drop-shadow-2xl">
              Elevate your <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-pulse">
                potential.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Skyline transforms your personal goals into a collective visualization of ambition. Track progress, hit milestones, and watch our digital city grow brighter together.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              {isAuthenticated ? (
                <Link 
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] hover:-translate-y-1"
                >
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <Button 
                  onClick={() => login()}
                  className="w-full sm:w-auto h-14 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] hover:-translate-y-1"
                >
                  Start Building
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              )}
              <Link 
                href="/feed"
                className="w-full sm:w-auto inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:-translate-y-1"
              >
                Explore the Feed
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Features grid */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5 bg-background/50 backdrop-blur-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors group">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2">Track Progress</h3>
              <p className="text-muted-foreground">Log incremental updates to your goals and build a timeline of your achievements.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors group">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2">Public Feed</h3>
              <p className="text-muted-foreground">Share your journey and get inspired by others striving for greatness in your city.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors group">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2">Visual Growth</h3>
              <p className="text-muted-foreground">Your goals literally shape the digital skyline. Complete goals to light up the city.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
