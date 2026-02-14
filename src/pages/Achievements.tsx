import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, Flame, Dumbbell, Target, Zap, Award, Medal } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Achievement = Tables<"achievements">;

const allBadges = [
  { key: "first_workout", name: "First Step", description: "Complete your first workout", icon: Star },
  { key: "streak_3", name: "On Fire", description: "Achieve a 3-day streak", icon: Flame },
  { key: "streak_7", name: "Week Warrior", description: "Achieve a 7-day streak", icon: Flame },
  { key: "streak_30", name: "Monthly Machine", description: "Achieve a 30-day streak", icon: Trophy },
  { key: "workouts_10", name: "Getting Serious", description: "Complete 10 workouts", icon: Dumbbell },
  { key: "workouts_50", name: "Half Century", description: "Complete 50 workouts", icon: Target },
  { key: "workouts_100", name: "Centurion", description: "Complete 100 workouts", icon: Award },
  { key: "level_5", name: "Rising Star", description: "Reach level 5", icon: Zap },
  { key: "level_10", name: "Elite Athlete", description: "Reach level 10", icon: Medal },
];

const Achievements = () => {
  const { user, profile } = useAuth();
  const [unlocked, setUnlocked] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("achievements").select("*").eq("user_id", user.id).then(({ data }) => setUnlocked(data || []));
  }, [user]);

  const unlockedKeys = new Set(unlocked.map((a) => a.badge_key));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Achievements</h2>
        <p className="text-sm text-muted-foreground">
          {unlocked.length} / {allBadges.length} badges unlocked
        </p>
      </div>

      {/* Level card */}
      <Card className="border-border bg-card">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow">
            <Zap className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-display text-lg font-bold">Level {profile?.level || 1}</p>
            <p className="text-sm text-muted-foreground">{profile?.xp || 0} total XP</p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full gradient-primary"
                style={{ width: `${(profile?.xp || 0) % 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {allBadges.map((badge) => {
          const isUnlocked = unlockedKeys.has(badge.key);
          const Icon = badge.icon;
          return (
            <Card
              key={badge.key}
              className={`border-border transition-all ${isUnlocked ? "bg-card shadow-glow" : "bg-card opacity-50"}`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    isUnlocked ? "gradient-primary" : "bg-secondary"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isUnlocked ? "text-primary-foreground" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-display font-semibold">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;
