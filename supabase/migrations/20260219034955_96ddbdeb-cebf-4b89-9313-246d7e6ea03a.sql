
-- Add image_url column to exercises for caching generated illustrations
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage bucket for exercise illustrations
INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-illustrations', 'exercise-illustrations', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Exercise illustrations are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-illustrations');

-- Allow edge functions (service role) to upload
CREATE POLICY "Service role can upload exercise illustrations"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exercise-illustrations');
