import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, SkipForward, Timer, Trophy } from "lucide-react";
import ExerciseIllustration from "@/components/ExerciseIllustration";
import type { Tables } from "@/integrations/supabase/types";

type Exercise = Tables<"exercises">;
type Workout = Tables<"workouts">;

const WorkoutSession = () => {
  const { id } = useParams<{ id: string }>();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [resting, setResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const startTime = useRef(Date.now());
  const restInterval = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("workouts").select("*").eq("id", id).maybeSingle(),
      supabase.from("exercises").select("*").eq("workout_id", id).order("order_index"),
    ]).then(([{ data: wk }, { data: exs }]) => {
      setWorkout(wk);
      setExercises(exs || []);
    });
  }, [id]);

  const currentExercise = exercises[currentIdx];

  const startRest = (seconds: number) => {
    setResting(true);
    setRestTime(seconds);
    restInterval.current = setInterval(() => {
      setRestTime((t) => {
        if (t <= 1) {
          clearInterval(restInterval.current);
          setResting(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const completeExercise = () => {
    if (!currentExercise) return;
    setCompleted((prev) => ({ ...prev, [currentExercise.id]: true }));
    if (currentIdx < exercises.length - 1) {
      startRest(currentExercise.rest_seconds || 60);
      setCurrentIdx((i) => i + 1);
    } else {
      finishWorkout();
    }
  };

  const skipExercise = () => {
    if (currentIdx < exercises.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = async () => {
    setSessionDone(true);
    const durationSeconds = Math.round((Date.now() - startTime.current) / 1000);
    const completedCount = Object.keys(completed).length + 1; // +1 for current
    const caloriesEstimate = Math.round(durationSeconds / 60 * 6); // rough estimate

    const totalVolume = exercises.reduce((sum, ex) => {
      const w = parseFloat(weights[ex.id] || String(ex.weight_kg || 0));
      return sum + (completed[ex.id] ? (ex.sets || 3) * (ex.reps || 10) * w : 0);
    }, 0);

    const { data: log } = await supabase
      .from("workout_logs")
      .insert({
        user_id: user!.id,
        workout_id: workout?.id,
        program_id: workout?.program_id,
        duration_seconds: durationSeconds,
        total_volume: totalVolume,
        calories_estimate: caloriesEstimate,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (log) {
      const exerciseLogs = exercises
        .filter((ex) => completed[ex.id])
        .map((ex) => ({
          workout_log_id: log.id,
          exercise_id: ex.id,
          exercise_name: ex.name,
          sets_completed: ex.sets || 3,
          reps_completed: ex.reps || 10,
          weight_used: parseFloat(weights[ex.id] || String(ex.weight_kg || 0)) || null,
          completed: true,
        }));
      if (exerciseLogs.length > 0) {
        await supabase.from("exercise_logs").insert(exerciseLogs);
      }
    }

    // Add XP
    await supabase
      .from("profiles")
      .update({ xp: (await supabase.from("profiles").select("xp").eq("user_id", user!.id).single()).data?.xp! + 25 })
      .eq("user_id", user!.id);

    // Check-in for streak
    await supabase.from("daily_checkins").upsert(
      { user_id: user!.id, checkin_date: new Date().toISOString().split("T")[0] },
      { onConflict: "user_id,checkin_date" }
    );

    await refreshProfile();
    toast({ title: "Workout Complete! 🎉", description: `You earned 25 XP!` });
  };

  if (!workout || exercises.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (sessionDone) {
    const durationMin = Math.round((Date.now() - startTime.current) / 60000);
    const completedCount = Object.keys(completed).length;
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-primary shadow-glow">
          <Trophy className="h-10 w-10 text-primary-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold">Workout Complete!</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-display text-2xl font-bold text-primary">{durationMin}</p>
            <p className="text-xs text-muted-foreground">Minutes</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-accent">{completedCount}</p>
            <p className="text-xs text-muted-foreground">Exercises</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-primary">+25</p>
            <p className="text-xs text-muted-foreground">XP Earned</p>
          </div>
        </div>
        <Button className="gradient-primary" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Exit
        </button>
        <span className="text-sm text-muted-foreground">
          {currentIdx + 1} / {exercises.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full gradient-primary transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / exercises.length) * 100}%` }}
        />
      </div>

      {resting ? (
        <div className="flex flex-col items-center space-y-4 py-12">
          <Timer className="h-12 w-12 text-primary animate-pulse-glow" />
          <p className="font-display text-4xl font-bold">{restTime}s</p>
          <p className="text-muted-foreground">Rest Time</p>
          <Button variant="outline" onClick={() => { clearInterval(restInterval.current); setResting(false); }}>
            Skip Rest
          </Button>
        </div>
      ) : currentExercise ? (
        <Card className="border-border bg-card">
          <CardContent className="space-y-4 p-6">
            <div className="flex gap-4 items-start">
              <ExerciseIllustration
                exerciseId={currentExercise.id}
                exerciseName={currentExercise.name}
                muscleGroup={currentExercise.muscle_group}
                exerciseType={currentExercise.exercise_type}
                imageUrl={currentExercise.image_url}
                className="h-32 w-32 flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold">{currentExercise.name}</h3>
                <p className="text-sm text-muted-foreground">{currentExercise.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-secondary p-3">
                <p className="font-display text-lg font-bold">{currentExercise.sets}</p>
                <p className="text-xs text-muted-foreground">Sets</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="font-display text-lg font-bold">{currentExercise.reps}</p>
                <p className="text-xs text-muted-foreground">Reps</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="font-display text-lg font-bold">{currentExercise.rest_seconds}s</p>
                <p className="text-xs text-muted-foreground">Rest</p>
              </div>
            </div>

            {currentExercise.weight_kg && (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Weight (kg)</label>
                <Input
                  type="number"
                  value={weights[currentExercise.id] ?? String(currentExercise.weight_kg || "")}
                  onChange={(e) => setWeights((prev) => ({ ...prev, [currentExercise.id]: e.target.value }))}
                  className="bg-secondary"
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={skipExercise}>
                <SkipForward className="mr-1 h-4 w-4" /> Skip
              </Button>
              <Button className="flex-1 gradient-primary" onClick={completeExercise}>
                <CheckCircle2 className="mr-1 h-4 w-4" /> Complete
              </Button>
            </div>

            {currentExercise.muscle_group && (
              <p className="text-center text-xs text-muted-foreground capitalize">
                Target: {currentExercise.muscle_group}
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default WorkoutSession;
