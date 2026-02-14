import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Flame, Dumbbell, TrendingUp, Zap, Calendar, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Program = Tables<"programs">;
type WorkoutLog = Tables<"workout_logs">;

const Dashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);
  const [weeklyCount, setWeeklyCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: progs }, { data: logs }] = await Promise.all([
        supabase.from("programs").select("*").limit(3),
        supabase
          .from("workout_logs")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      setPrograms(progs || []);
      setRecentLogs(logs || []);

      // Weekly count
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count } = await supabase
        .from("workout_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("created_at", weekAgo.toISOString());
      setWeeklyCount(count || 0);
    };
    if (user) fetchData();
  }, [user]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const motivationalMessages = [
    "Every rep counts. Let's crush it! 💪",
    "Consistency beats perfection. Show up today!",
    "You're stronger than you think. Let's go! 🔥",
    "Champions train even when they don't feel like it.",
  ];

  const randomMotivation = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  const levelProgress = profile ? (profile.xp % 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold">
          {greeting()}, <span className="text-gradient-primary">{profile?.display_name || "Athlete"}</span>
        </h2>
        <p className="text-sm text-muted-foreground">{randomMotivation}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center p-4">
            <Flame className="h-6 w-6 text-accent" />
            <span className="mt-1 font-display text-2xl font-bold">{profile?.current_streak || 0}</span>
            <span className="text-xs text-muted-foreground">Day Streak</span>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center p-4">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="mt-1 font-display text-2xl font-bold">{weeklyCount}</span>
            <span className="text-xs text-muted-foreground">This Week</span>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center p-4">
            <Zap className="h-6 w-6 text-accent" />
            <span className="mt-1 font-display text-2xl font-bold">Lv.{profile?.level || 1}</span>
            <span className="text-xs text-muted-foreground">{profile?.xp || 0} XP</span>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center p-4">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="mt-1 font-display text-2xl font-bold">{profile?.longest_streak || 0}</span>
            <span className="text-xs text-muted-foreground">Best Streak</span>
          </CardContent>
        </Card>
      </div>

      {/* XP Progress */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Level {profile?.level || 1} Progress</span>
            <span className="text-muted-foreground">{levelProgress}/100 XP</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full gradient-primary transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick start programs */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Start a Workout</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate("/programs")} className="text-primary">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3">
          {programs.map((program) => (
            <Card
              key={program.id}
              className="cursor-pointer border-border bg-card transition-all hover:border-primary/50 hover:shadow-glow"
              onClick={() => navigate(`/programs/${program.id}`)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <h4 className="font-display font-semibold">{program.title}</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {program.difficulty} · {program.duration_weeks} weeks · {program.category}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Dumbbell className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h3 className="mb-3 font-display text-lg font-semibold">Recent Activity</h3>
        {recentLogs.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-center">
              <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No workouts yet. Start your first one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <Card key={log.id} className="border-border bg-card">
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">Workout completed</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString()} ·{" "}
                      {log.duration_seconds ? `${Math.round(log.duration_seconds / 60)}min` : "—"} ·{" "}
                      {log.calories_estimate || 0} cal
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Dumbbell className="h-4 w-4 text-primary" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
