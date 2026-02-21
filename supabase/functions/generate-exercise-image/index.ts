import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateFrame(
  apiKey: string,
  exerciseName: string,
  muscleGroup: string | null,
  exerciseType: string | null,
  phase: string
): Promise<string | null> {
  const prompt = `Create a clean, modern fitness illustration showing a person performing a ${exerciseName} exercise in the ${phase} position. ${muscleGroup ? `Target muscle group: ${muscleGroup}.` : ""} ${exerciseType ? `Exercise type: ${exerciseType}.` : ""} Style: minimalist athletic illustration with bold outlines, dark charcoal background (#1a1a2e), vibrant green (#22c55e) and orange (#f97316) accent colors on clothing/highlights, showing proper form. The figure should be a simple, gender-neutral athletic silhouette. No text, no labels, no watermarks. Square composition.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!resp.ok) {
    console.error(`AI error for ${phase}:`, resp.status);
    return null;
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { exerciseId, exerciseName, muscleGroup, exerciseType } = await req.json();

    if (!exerciseId || !exerciseName) {
      return new Response(JSON.stringify({ error: "exerciseId and exerciseName required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if frames already exist
    const { data: exercise } = await supabase
      .from("exercises")
      .select("image_url")
      .eq("id", exerciseId)
      .single();

    if (exercise?.image_url) {
      try {
        const cached = JSON.parse(exercise.image_url);
        if (cached.frames && cached.frames.length > 0) {
          return new Response(JSON.stringify(cached), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch {
        // Not JSON, old single-image format — regenerate
      }
    }

    // Generate two frames: starting position and movement position
    const phases = ["starting/ready position", "mid-movement/peak contraction position"];
    const frameUrls: string[] = [];

    for (const phase of phases) {
      const imageData = await generateFrame(LOVABLE_API_KEY, exerciseName, muscleGroup, exerciseType, phase);
      if (!imageData) continue;

      const base64Match = imageData.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
      if (!base64Match) continue;

      const imageFormat = base64Match[1];
      const base64String = base64Match[2];
      const binaryData = Uint8Array.from(atob(base64String), (c) => c.charCodeAt(0));

      const idx = frameUrls.length;
      const fileName = `${exerciseId}_frame${idx}.${imageFormat}`;
      const { error: uploadError } = await supabase.storage
        .from("exercise-illustrations")
        .upload(fileName, binaryData, {
          contentType: `image/${imageFormat}`,
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: publicUrl } = supabase.storage
        .from("exercise-illustrations")
        .getPublicUrl(fileName);

      frameUrls.push(publicUrl.publicUrl);
    }

    if (frameUrls.length === 0) {
      throw new Error("Failed to generate any frames");
    }

    const result = { frames: frameUrls };

    // Cache in DB
    await supabase.from("exercises").update({ image_url: JSON.stringify(result) }).eq("id", exerciseId);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-exercise-image error:", e);
    const status = (e as any)?.status || 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
