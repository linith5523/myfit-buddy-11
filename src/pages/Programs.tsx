import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Clock, Zap, Heart, Flame, Activity } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Program = Tables<"programs">;

const categoryIcons: Record<string, typeof Dumbbell> = {
  strength: Dumbbell,
  cardio: Activity,
  hiit: Flame,
  flexibility: Heart,
  full_body: Zap,
};

const difficultyColors: Record<string, string> = {
  beginner: "bg-primary/20 text-primary",
  intermediate: "bg-accent/20 text-accent",
  advanced: "bg-destructive/20 text-destructive",
};

const Programs = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("programs").select("*").then(({ data }) => setPrograms(data || []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Workout Programs</h2>
        <p className="text-sm text-muted-foreground">Choose a program that matches your goals</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {programs.map((program) => {
          const Icon = categoryIcons[program.category || "strength"] || Dumbbell;
          return (
            <Card
              key={program.id}
              className="cursor-pointer border-border bg-card transition-all hover:border-primary/50 hover:shadow-glow"
              onClick={() => navigate(`/programs/${program.id}`)}
            >
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge className={difficultyColors[program.difficulty || "beginner"]} variant="secondary">
                    {program.difficulty}
                  </Badge>
                </div>
                <h3 className="font-display text-lg font-semibold">{program.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{program.description}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {program.duration_weeks} weeks
                  </span>
                  <span className="capitalize">{program.category?.replace("_", " ")}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Programs;
