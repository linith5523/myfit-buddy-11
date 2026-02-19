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
  const [imageUrl, setImageUrl] = useState<string | null>(cachedUrl || null);
  const [loading, setLoading] = useState(!cachedUrl);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cachedUrl) {
      setImageUrl(cachedUrl);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const generate = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "generate-exercise-image",
          {
            body: { exerciseId, exerciseName, muscleGroup, exerciseType },
          }
        );

        if (cancelled) return;

        if (fnError || data?.error) {
          console.error("Image generation failed:", fnError || data?.error);
          setError(true);
        } else if (data?.image_url) {
          setImageUrl(data.image_url);
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

  if (loading) {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-secondary ${className}`}>
        <Skeleton className="h-full w-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">Generating...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-secondary ${className}`}>
        <Dumbbell className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg bg-secondary ${className}`}>
      <img
        src={imageUrl}
        alt={`${exerciseName} illustration`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
};

export default ExerciseIllustration;
