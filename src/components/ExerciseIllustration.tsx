import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Dumbbell } from "lucide-react";

interface ExerciseIllustrationProps {
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: string | null;
  exerciseType?: string | null;
  imageUrl?: string | null;
  className?: string;
}

const ExerciseIllustration = ({
  exerciseId,
  exerciseName,
  muscleGroup,
  exerciseType,
  imageUrl: cachedUrl,
  className = "",
}: ExerciseIllustrationProps) => {
  const [frames, setFrames] = useState<string[]>([]);
  const [activeFrame, setActiveFrame] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Try to parse cached frames
  useEffect(() => {
    if (cachedUrl) {
      try {
        const parsed = JSON.parse(cachedUrl);
        if (parsed.frames?.length > 0) {
          setFrames(parsed.frames);
          setLoading(false);
          return;
        }
      } catch {
        // Not JSON / old format — regenerate
      }
    }

    let cancelled = false;

    const generate = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "generate-exercise-image",
          { body: { exerciseId, exerciseName, muscleGroup, exerciseType } }
        );

        if (cancelled) return;

        if (fnError || data?.error) {
          console.error("Generation failed:", fnError || data?.error);
          setError(true);
        } else if (data?.frames?.length > 0) {
          setFrames(data.frames);
        } else {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    generate();
    return () => { cancelled = true; };
  }, [exerciseId, exerciseName, muscleGroup, exerciseType, cachedUrl]);

  // Animate between frames
  useEffect(() => {
    if (frames.length <= 1) return;
    const interval = setInterval(() => {
      setActiveFrame((prev) => (prev + 1) % frames.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [frames.length]);

  if (loading) {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-secondary ${className}`}>
        <Skeleton className="h-full w-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-[10px] text-muted-foreground">Generating...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || frames.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-secondary ${className}`}>
        <Dumbbell className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg bg-secondary ${className}`}>
      {frames.map((frame, idx) => (
        <img
          key={idx}
          src={frame}
          alt={`${exerciseName} - frame ${idx + 1}`}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-in-out"
          style={{ opacity: idx === activeFrame ? 1 : 0 }}
          loading="lazy"
        />
      ))}
      {/* Animated indicator dots */}
      {frames.length > 1 && (
        <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1">
          {frames.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 w-1 rounded-full transition-colors duration-300 ${
                idx === activeFrame ? "bg-primary" : "bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExerciseIllustration;
