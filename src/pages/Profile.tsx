import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Dumbbell, Calendar } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type WorkoutLog = Tables<"workout_logs">;

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [fitnessLevel, setFitnessLevel] = useState(profile?.fitness_level || "beginner");
  const [fitnessGoal, setFitnessGoal] = useState(profile?.fitness_goal || "general");
  const [units, setUnits] = useState(profile?.preferred_units || "metric");
  const [saving, setSaving] = useState(false);
  const [recentLogs, setRecentLogs] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setFitnessLevel(profile.fitness_level || "beginner");
      setFitnessGoal(profile.fitness_goal || "general");
      setUnits(profile.preferred_units || "metric");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setRecentLogs(data || []));
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        fitness_level: fitnessLevel,
        fitness_goal: fitnessGoal,
        preferred_units: units,
      })
      .eq("user_id", user.id);
    await refreshProfile();
    toast({ title: "Profile updated!" });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Profile</h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" /> Personal Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-secondary" />
          </div>
          <div className="space-y-2">
            <Label>Fitness Level</Label>
            <Select value={fitnessLevel} onValueChange={setFitnessLevel}>
              <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fitness Goal</Label>
            <Select value={fitnessGoal} onValueChange={setFitnessGoal}>
              <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="weight_loss">Weight Loss</SelectItem>
                <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                <SelectItem value="flexibility">Flexibility</SelectItem>
                <SelectItem value="general">General Fitness</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Preferred Units</Label>
            <Select value={units} onValueChange={setUnits}>
              <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (kg)</SelectItem>
                <SelectItem value="imperial">Imperial (lbs)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full gradient-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Workout History */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-accent" /> Workout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workouts logged yet.</p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-lg bg-secondary p-3">
                  <div>
                    <p className="text-sm font-medium">{new Date(log.created_at).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.duration_seconds ? `${Math.round(log.duration_seconds / 60)} min` : "—"} · {log.calories_estimate || 0} cal
                    </p>
                  </div>
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
