
-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all workout logs
CREATE POLICY "Admins can view all workout logs"
ON public.workout_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all achievements
CREATE POLICY "Admins can view all achievements"
ON public.achievements FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all daily checkins
CREATE POLICY "Admins can view all daily checkins"
ON public.daily_checkins FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all exercise logs
CREATE POLICY "Admins can view all exercise logs"
ON public.exercise_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
