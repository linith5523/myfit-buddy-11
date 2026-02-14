
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  fitness_level TEXT DEFAULT 'beginner' CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  fitness_goal TEXT DEFAULT 'general' CHECK (fitness_goal IN ('strength', 'cardio', 'weight_loss', 'muscle_gain', 'flexibility', 'general')),
  preferred_units TEXT DEFAULT 'metric' CHECK (preferred_units IN ('metric', 'imperial')),
  xp INTEGER DEFAULT 0 NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  onboarding_completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Programs table
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_weeks INTEGER DEFAULT 4 NOT NULL,
  category TEXT DEFAULT 'strength' CHECK (category IN ('strength', 'cardio', 'hiit', 'flexibility', 'full_body')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view programs" ON public.programs FOR SELECT USING (true);

-- Workouts table
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  week_number INTEGER DEFAULT 1 NOT NULL,
  estimated_duration_min INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view workouts" ON public.workouts FOR SELECT USING (true);

-- Exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sets INTEGER DEFAULT 3,
  reps INTEGER DEFAULT 10,
  weight_kg NUMERIC,
  rest_seconds INTEGER DEFAULT 60,
  order_index INTEGER DEFAULT 0 NOT NULL,
  muscle_group TEXT,
  exercise_type TEXT DEFAULT 'strength' CHECK (exercise_type IN ('strength', 'cardio', 'stretch', 'bodyweight')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT USING (true);

-- Workout logs
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  total_volume NUMERIC DEFAULT 0,
  calories_estimate INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON public.workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON public.workout_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON public.workout_logs FOR DELETE USING (auth.uid() = user_id);

-- Exercise logs
CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  sets_completed INTEGER DEFAULT 0,
  reps_completed INTEGER DEFAULT 0,
  weight_used NUMERIC,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own exercise logs" ON public.exercise_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workout_logs wl WHERE wl.id = workout_log_id AND wl.user_id = auth.uid())
);
CREATE POLICY "Users can insert own exercise logs" ON public.exercise_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.workout_logs wl WHERE wl.id = workout_log_id AND wl.user_id = auth.uid())
);
CREATE POLICY "Users can update own exercise logs" ON public.exercise_logs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.workout_logs wl WHERE wl.id = workout_log_id AND wl.user_id = auth.uid())
);

-- Achievements
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_key TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily check-ins
CREATE TABLE public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  checkin_date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, checkin_date)
);
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own checkins" ON public.daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON public.daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
