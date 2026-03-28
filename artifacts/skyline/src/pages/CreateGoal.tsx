import { useLocation, Redirect } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useCreateGoal } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Building, Target, MapPin, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional().default(""),
  category: z.string().min(1, "Category is required"),
  city: z.string().min(1, "City is required").default("Cleveland"),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateGoal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      city: "Cleveland",
    },
  });

  const createGoal = useCreateGoal({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Foundation laid!",
          description: "Your new goal has been added to the skyline.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/goals/mine"] });
        queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
        setLocation("/dashboard");
      },
      onError: (error) => {
        toast({
          title: "Construction failed",
          description: error.message || "Could not create goal.",
          variant: "destructive",
        });
      },
    },
  });

  function onSubmit(data: FormValues) {
    createGoal.mutate({ data });
  }

  if (authLoading) return null;
  if (!isAuthenticated) return <Redirect href="/" />;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-2xl mx-auto relative z-10">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/dashboard")}
          className="mb-8 text-muted-foreground hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Skyline
        </Button>

        <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white">Construct a Goal</h1>
              <p className="text-muted-foreground">Define your objective and add it to the city.</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Goal Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Launch my startup MVP" 
                        className="bg-black/20 border-white/10 focus-visible:ring-primary/50 text-white placeholder:text-white/20 h-12 rounded-xl"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-black/20 border-white/10 focus-visible:ring-primary/50 text-white h-12 rounded-xl">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Select a category" />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-white/10 text-white">
                          <SelectItem value="Career">Career</SelectItem>
                          <SelectItem value="Health">Health & Fitness</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Personal">Personal Growth</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">City</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            className="bg-black/20 border-white/10 focus-visible:ring-primary/50 text-white h-12 rounded-xl pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What does success look like?" 
                        className="bg-black/20 border-white/10 focus-visible:ring-primary/50 text-white placeholder:text-white/20 min-h-[120px] rounded-xl resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={createGoal.isPending}
                  className="w-full h-14 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all"
                >
                  {createGoal.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Constructing...
                    </>
                  ) : (
                    "Build Goal"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
