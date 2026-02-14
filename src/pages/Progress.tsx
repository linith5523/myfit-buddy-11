import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Dumbbell, Flame, TrendingUp, Weight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type WorkoutLog = Tables<"workout_logs">;

const Progress = () => {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setLogs(data || []);
        setTotalWorkouts(data?.length || 0);
      });
  }, [user]);

  // Weekly aggregation for chart
  const weeklyData = (() => {
    const weeks: Record<string, { week: string; workouts: number; volume: number; calories: number }> = {};
    logs.forEach((log) => {
      const d = new Date(log.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split("T")[0];
      if (!weeks[key]) weeks[key] = { week: key, workouts: 0, volume: 0, calories: 0 };
      weeks[key].workouts++;
      weeks[key].volume += Number(log.total_volume) || 0;
      weeks[key].calories += log.calories_estimate || 0;
    });
    return Object.values(weeks).slice(-8);
  })();

  const totalVolume = logs.reduce((sum, l) => sum + (Number(l.total_volume) || 0), 0);
  const totalCalories = logs.reduce((sum, l) => sum + (l.calories_estimate || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Progress</h2>
        <p className="text-sm text-muted-foreground">Track your fitness journey over time</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center p-4">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span className="mt-1 font-display text-xl font-bold">{totalWorkouts}</span>
            <span className="text-xs text-muted-foreground">Total Workouts</span>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center p-4">
            <Weight className="h-5 w-5 text-accent" />
            <span className="mt-1 font-display text-xl font-bold">{Math.round(totalVolume).toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Total Volume (kg)</span>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center p-4">
            <Flame className="h-5 w-5 text-accent" />
            <span className="mt-1 font-display text-xl font-bold">{totalCalories.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Calories Burned</span>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center p-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="mt-1 font-display text-xl font-bold">{profile?.longest_streak || 0}</span>
            <span className="text-xs text-muted-foreground">Best Streak</span>
          </CardContent>
        </Card>
      </div>

      {weeklyData.length > 0 ? (
        <>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="font-display text-base">Weekly Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData}>
                  <XAxis dataKey="week" tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "hsl(220 18% 10%)", border: "1px solid hsl(220 13% 18%)", borderRadius: 8 }} />
                  <Bar dataKey="workouts" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="font-display text-base">Volume Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyData}>
                  <XAxis dataKey="week" tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "hsl(220 18% 10%)", border: "1px solid hsl(220 13% 18%)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="volume" stroke="hsl(25 95% 53%)" strokeWidth={2} dot={{ fill: "hsl(25 95% 53%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Complete workouts to see your progress charts!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Progress;
