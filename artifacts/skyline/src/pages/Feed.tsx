import { useState } from "react";
import { Link } from "wouter";
import { useListGoals } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Search, MapPin, Target, CheckCircle2, Clock, Loader2, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Feed() {
  const [cityFilter, setCityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data, isLoading } = useListGoals({
    query: {
      queryKey: ["/api/goals", { city: cityFilter, category: categoryFilter !== "all" ? categoryFilter : undefined }]
    },
    request: {
      // The generated hook normally accepts params, passing via custom fetch or interceptors
      // W're managing state manually to simulate standard query param changes
    }
  });

  const goals = data?.goals || [];

  // Client-side filtering as fallback if API doesn't handle it
  const filteredGoals = goals.filter(g => {
    const matchCity = !cityFilter || g.city.toLowerCase().includes(cityFilter.toLowerCase());
    const matchCat = categoryFilter === "all" || g.category === categoryFilter;
    return matchCity && matchCat;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="bg-white/[0.02] border-b border-white/5 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-10">
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-white">Global Skyline</h1>
            <p className="text-lg text-muted-foreground">
              Explore the collective ambitions being built across cities everywhere.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-card border border-white/10 p-2 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search by city (e.g. Cleveland)" 
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="pl-10 bg-transparent border-0 focus-visible:ring-0 text-white h-12 text-base placeholder:text-muted-foreground"
              />
            </div>
            <div className="h-12 w-px bg-white/10 hidden sm:block"></div>
            <div className="w-full sm:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-transparent border-0 focus-visible:ring-0 text-white h-12">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10 text-white">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Career">Career</SelectItem>
                  <SelectItem value="Health">Health & Fitness</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Personal">Personal Growth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/5 mb-4">
              <Target className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">No goals found</h3>
            <p className="text-muted-foreground">Try adjusting your filters to discover more.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={goal.id}
              >
                <Link href={`/goal/${goal.id}`} className="block group">
                  <div className={`h-full p-6 rounded-2xl border transition-all duration-300 ${
                    goal.status === 'completed' 
                      ? 'bg-card border-primary/20 shadow-[0_0_20px_rgba(139,92,246,0.05)] hover:border-primary/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:-translate-y-1' 
                      : 'bg-card border-white/5 hover:border-white/20 hover:bg-white/[0.02] hover:-translate-y-1'
                  }`}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-white/10 overflow-hidden">
                          {goal.authorImage ? (
                            <img src={goal.authorImage} alt={goal.authorName || 'Author'} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground font-bold">
                              {goal.authorName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-white/80">{goal.authorName || 'Anonymous'}</span>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        goal.status === 'completed' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-muted-foreground'
                      }`}>
                        {goal.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {goal.status === 'completed' ? 'Completed' : 'Building'}
                      </span>
                    </div>

                    <h3 className="text-xl font-display font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {goal.title}
                    </h3>
                    
                    {goal.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                        {goal.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium mt-auto">
                      <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-md text-white/80">
                        <Target className="h-3 w-3 text-muted-foreground" />
                        {goal.category}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-md text-white/80">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {goal.city}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
