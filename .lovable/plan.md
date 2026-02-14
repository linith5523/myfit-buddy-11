

# FitStar — Personalized Fitness Companion

## Overview
A full-featured fitness app with user accounts, guided workouts, real-time tracking, progress analytics, personalized recommendations, and gamification — all designed around consistency, simplicity, and personalization.

## Design Direction
Dark & bold theme with vibrant accent colors (greens, oranges) — the standard for fitness apps. Clean typography, card-based layout, and smooth transitions.

## Pages & Features

### 1. Authentication
- Sign up / Log in with email & password
- User profile setup (name, fitness level, goals)

### 2. Dashboard (Home)
- Daily workout suggestion
- Streak counter & motivational message
- Quick-access cards: Today's Workout, Weekly Progress, Active Goals
- Recent activity feed

### 3. Workout Programs
- Browse structured programs (e.g., "30-Day Strength", "Beginner Cardio", "HIIT Challenge")
- Programs contain multiple workouts organized by day/week
- Support for both bodyweight and gym exercises
- Each exercise shows sets, reps, weight (if applicable), and rest time

### 4. Live Workout Session
- Step-by-step exercise view with timer/rest countdown
- Log sets, reps, and weight in real-time
- Skip / complete exercise controls
- Session summary at the end (duration, volume, calories estimate)

### 5. Progress & Analytics
- Weekly/monthly charts (workouts completed, volume, streaks)
- Personal records tracking (heaviest lift, longest streak)
- Body metrics logging (weight, measurements — optional)
- Visual progress over time with Recharts

### 6. Gamification & Habits
- Achievement badges (first workout, 7-day streak, 100 workouts, etc.)
- XP system with levels
- Daily check-in streak tracker
- Weekly goals with progress rings

### 7. Personalized Recommendations
- Suggest next workout based on history and muscle group balance
- Rest day recommendations based on recent activity
- Adaptive difficulty suggestions based on logged performance

### 8. Profile & Settings
- Edit profile info and fitness goals
- Workout history log
- App preferences (units, notifications toggle)

## Backend (Lovable Cloud / Supabase)
- User authentication & profiles
- Database tables: profiles, programs, workouts, exercises, workout_logs, achievements, user_stats
- Row-level security so users only see their own data
- Edge functions for recommendation logic

## Data Model Highlights
- **Programs** → contain ordered **Workouts** → contain **Exercises**
- **Workout Logs** track each completed session with exercise-level detail
- **Achievements** unlocked based on milestones
- **User Stats** aggregate progress metrics

