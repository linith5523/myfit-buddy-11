import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Trash2, Apple, Flame, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays } from "date-fns";

interface NutritionInfo {
  food_name: string;
  serving_size: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  vitamins: {
    vitamin_a_pct: number;
    vitamin_c_pct: number;
    calcium_pct: number;
    iron_pct: number;
  };
}

const mealTypes = [
  { value: "breakfast", label: "🌅 Breakfast" },
  { value: "lunch", label: "🌞 Lunch" },
  { value: "dinner", label: "🌙 Dinner" },
  { value: "snack", label: "🍎 Snack" },
];

const Nutrition = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mealType, setMealType] = useState("snack");
  const [lookupResult, setLookupResult] = useState<NutritionInfo | null>(null);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Fetch daily food logs
  const { data: foodLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["food-logs", dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_logs")
        .select("*")
        .eq("logged_date", dateStr)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // AI food lookup
  const lookupMutation = useMutation({
    mutationFn: async (query: string) => {
      const { data, error } = await supabase.functions.invoke("food-lookup", {
        body: { query },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as NutritionInfo;
    },
    onSuccess: (data) => setLookupResult(data),
    onError: (err: Error) => {
      toast({ title: "Lookup failed", description: err.message, variant: "destructive" });
    },
  });

  // Add food log
  const addMutation = useMutation({
    mutationFn: async (info: NutritionInfo) => {
      const { error } = await supabase.from("food_logs").insert({
        user_id: user!.id,
        food_name: info.food_name,
        serving_size: info.serving_size,
        calories: info.calories,
        protein_g: info.protein_g,
        carbs_g: info.carbs_g,
        fat_g: info.fat_g,
        fiber_g: info.fiber_g,
        sugar_g: info.sugar_g,
        sodium_mg: info.sodium_mg,
        vitamins: info.vitamins,
        meal_type: mealType,
        logged_date: dateStr,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-logs", dateStr] });
      setLookupResult(null);
      setSearchQuery("");
      toast({ title: "Food added to diary!" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to add", description: err.message, variant: "destructive" });
    },
  });

  // Delete food log
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("food_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-logs", dateStr] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) lookupMutation.mutate(searchQuery.trim());
  };

  // Daily totals
  const totals = foodLogs.reduce(
    (acc, log) => ({
      calories: acc.calories + Number(log.calories),
      protein: acc.protein + Number(log.protein_g),
      carbs: acc.carbs + Number(log.carbs_g),
      fat: acc.fat + Number(log.fat_g),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Nutrition</h2>
        <p className="text-muted-foreground text-sm">Track your meals & get nutrition info</p>
      </div>

      {/* Date selector */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate((d) => subDays(d, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium text-sm min-w-[120px] text-center">
          {isToday ? "Today" : format(selectedDate, "MMM d, yyyy")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
          disabled={isToday}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Daily summary */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="text-center">
          <CardContent className="p-3">
            <Flame className="h-4 w-4 mx-auto text-orange-500 mb-1" />
            <p className="text-lg font-bold">{Math.round(totals.calories)}</p>
            <p className="text-[10px] text-muted-foreground">Calories</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <p className="text-lg font-bold text-blue-500">{Math.round(totals.protein)}g</p>
            <p className="text-[10px] text-muted-foreground">Protein</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <p className="text-lg font-bold text-amber-500">{Math.round(totals.carbs)}g</p>
            <p className="text-[10px] text-muted-foreground">Carbs</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <p className="text-lg font-bold text-rose-500">{Math.round(totals.fat)}g</p>
            <p className="text-[10px] text-muted-foreground">Fat</p>
          </CardContent>
        </Card>
      </div>

      {/* Food search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" /> Search Food
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. chicken breast, banana, rice..."
              maxLength={200}
              className="flex-1"
            />
            <Button type="submit" disabled={lookupMutation.isPending || !searchQuery.trim()} size="sm">
              {lookupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look up"}
            </Button>
          </form>

          {/* Lookup result */}
          {lookupResult && (
            <div className="mt-4 space-y-3 rounded-lg border p-4 bg-secondary/30">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{lookupResult.food_name}</h4>
                  <p className="text-xs text-muted-foreground">Serving: {lookupResult.serving_size}</p>
                </div>
                <Badge variant="secondary" className="text-orange-500">
                  {lookupResult.calories} cal
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md bg-background p-2">
                  <p className="font-bold text-blue-500">{lookupResult.protein_g}g</p>
                  <p className="text-muted-foreground">Protein</p>
                </div>
                <div className="rounded-md bg-background p-2">
                  <p className="font-bold text-amber-500">{lookupResult.carbs_g}g</p>
                  <p className="text-muted-foreground">Carbs</p>
                </div>
                <div className="rounded-md bg-background p-2">
                  <p className="font-bold text-rose-500">{lookupResult.fat_g}g</p>
                  <p className="text-muted-foreground">Fat</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Fiber</span><span>{lookupResult.fiber_g}g</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sugar</span><span>{lookupResult.sugar_g}g</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sodium</span><span>{lookupResult.sodium_mg}mg</span></div>
              </div>

              {lookupResult.vitamins && (
                <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Vitamin A</span><span>{lookupResult.vitamins.vitamin_a_pct}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Vitamin C</span><span>{lookupResult.vitamins.vitamin_c_pct}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Calcium</span><span>{lookupResult.vitamins.calcium_pct}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Iron</span><span>{lookupResult.vitamins.iron_pct}%</span></div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypes.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => addMutation.mutate(lookupResult)}
                  disabled={addMutation.isPending}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add to Diary
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Food diary */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Food Diary</h3>
        {logsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : foodLogs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              <Apple className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No food logged {isToday ? "today" : "this day"}. Search above to add!
            </CardContent>
          </Card>
        ) : (
          <>
            {mealTypes.map(({ value, label }) => {
              const items = foodLogs.filter((l) => l.meal_type === value);
              if (items.length === 0) return null;
              return (
                <div key={value} className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  {items.map((log) => (
                    <Card key={log.id} className="group">
                      <CardContent className="flex items-center justify-between p-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{log.food_name}</p>
                          <p className="text-[10px] text-muted-foreground">{log.serving_size}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-orange-500">{Math.round(Number(log.calories))} cal</p>
                            <p className="text-[10px] text-muted-foreground">
                              P:{Math.round(Number(log.protein_g))} C:{Math.round(Number(log.carbs_g))} F:{Math.round(Number(log.fat_g))}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteMutation.mutate(log.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default Nutrition;
