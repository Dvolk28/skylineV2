import { useRoute } from "wouter";
import { 
  useGetGoal, 
  useListGoalUpdates, 
  useUpdateGoal, 
  useCreateGoalUpdate 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  MapPin, 
  Target, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Loader2, 
  Send 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { motion } from "framer-motion";

export default function GoalDetail() {
  const [, params] = useRoute("/goal/:id");
  const goalId = parseInt(params?.id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [updateContent, setUpdateContent] = useState("");

  const { data: goalData, isLoading: goalLoading } = useGetGoal(goalId, {
    query: { enabled: !!goalId }
  });

  const { data: updatesData, isLoading: updatesLoading } = useListGoalUpdates(goalId, {
    query: { enabled: !!goalId }
  });

  const updateGoal = useUpdateGoal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Status updated", description: "Your goal status has been changed." });
        queryClient.invalidateQueries({ queryKey: [`/api/goals/${goalId}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/goals/mine"] });
      }
    }
  });

  const createUpdate = useCreateGoalUpdate({
    mutation: {
      onSuccess: () => {
        setUpdateContent("");
        toast({ title: "Update posted", description: "Your progress has been recorded." });
        queryClient.invalidateQueries({ queryKey: [`/api/goals/${goalId}/updates`] });
      }
    }
  });

  if (goalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!goalData?.goal) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col">
        <h2 className="text-2xl font-display font-bold mb-2">Goal not found</h2>
        <p className="text-muted-foreground">The structure you're looking for doesn't exist.</p>
      </div>
    );
  }

  const { goal } = goalData;
  const isCompleted = goal.status === 'completed';
  const updates = updatesData?.updates || [];

  const handleToggleStatus = () => {
    updateGoal.mutate({ 
      id: goalId, 
      data: { status: isCompleted ? 'in_progress' : 'completed' } 
    });
  };

  const handlePostUpdate = () => {
    if (!updateContent.trim()) return;
    createUpdate.mutate({
      id: goalId,
      data: { content: updateContent.trim() }
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pb-20">
      {/* Header Banner */}
      <div className={`relative overflow-hidden border-b transition-colors duration-700 ${isCompleted ? 'border-primary/30 bg-primary/5' : 'border-white/5 bg-white/[0.02]'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="max-w-3xl mx-auto flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium ${isCompleted ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-white/10 text-white/80 border border-white/10'}`}>
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  {isCompleted ? 'Completed' : 'In Progress'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  {goal.category}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {goal.city}
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-white tracking-tight">
                {goal.title}
              </h1>
              
              {goal.description && (
                <p className="text-lg text-white/70 leading-relaxed max-w-2xl">
                  {goal.description}
                </p>
              )}
              
              <div className="pt-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/10 overflow-hidden border border-white/20">
                  {goal.authorImage ? (
                    <img src={goal.authorImage} alt={goal.authorName || 'Author'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground font-bold">
                      {goal.authorName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="text-sm">
                  <p className="text-white font-medium">{goal.authorName || 'Anonymous Builder'}</p>
                  <p className="text-muted-foreground">Created {format(new Date(goal.createdAt), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </div>

            <div className="md:shrink-0 pt-2">
              <Button 
                onClick={handleToggleStatus}
                disabled={updateGoal.isPending}
                size="lg"
                className={`w-full md:w-auto rounded-xl shadow-lg transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5'
                }`}
              >
                {updateGoal.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : 
                 isCompleted ? <Circle className="h-5 w-5 mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                {isCompleted ? 'Reopen Goal' : 'Mark Completed'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-white mb-8">Timeline</h2>
          
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-white/10 before:to-transparent">
            {updatesLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>
            ) : updates.length === 0 ? (
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] text-muted-foreground p-4">
                  No progress updates yet. Start building your timeline!
                </div>
              </div>
            ) : (
              updates.map((update, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={update.id} 
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary/20 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  </div>
                  
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl bg-card border border-white/5 shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-white">{update.authorName}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(update.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-white/80 whitespace-pre-wrap">{update.content}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="mt-12 bg-card/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative z-20">
            <h3 className="font-display font-bold text-lg text-white mb-4">Post an Update</h3>
            <div className="space-y-4">
              <Textarea 
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
                placeholder="What did you accomplish today?"
                className="bg-black/20 border-white/10 focus-visible:ring-primary/50 min-h-[100px] resize-none text-white placeholder:text-white/20 rounded-xl"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handlePostUpdate}
                  disabled={createUpdate.isPending || !updateContent.trim()}
                  className="rounded-xl px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {createUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Log Progress
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
