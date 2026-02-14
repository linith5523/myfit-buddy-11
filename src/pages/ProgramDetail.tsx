import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Dumbbell, Play } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Program = Tables<"programs">;
type Workout = Tables<"workouts">;

const ProgramDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<Program | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("programs").select("*").eq("id", id).maybeSingle(),
      supabase.from("workouts").select("*").eq("program_id", id).order("week_number").order("day_number"),
    ]).then(([{ data: prog }, { data: wks }]) => {
      setProgram(prog);
      setWorkouts(wks || []);
    });
  }, [id]);

  if (!program) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/programs")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Programs
      </button>

      <div>
        <Badge className="mb-2" variant="secondary">{program.difficulty}</Badge>
        <h2 className="font-display text-2xl font-bold">{program.title}</h2>
        <p className="mt-1 text-muted-foreground">{program.description}</p>
        <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {program.duration_weeks} weeks</span>
          <span className="capitalize">{program.category?.replace("_", " ")}</span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-semibold">Workouts</h3>
        {workouts.map((workout) => (
          <Card key={workout.id} className="border-border bg-card transition-all hover:border-primary/50">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">
                  Week {workout.week_number}, Day {workout.day_number}
                </p>
                <p className="font-display text-lg font-semibold">{workout.title}</p>
                <p className="text-xs text-muted-foreground">{workout.estimated_duration_min} min</p>
              </div>
              <Button
                size="sm"
                className="gradient-primary"
                onClick={() => navigate(`/workout/${workout.id}`)}
              >
                <Play className="mr-1 h-4 w-4" /> Start
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProgramDetail;
