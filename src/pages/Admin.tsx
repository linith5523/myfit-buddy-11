import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit2, Save, X, Dumbbell, ClipboardList, Zap, Users, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Program {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  category: string | null;
  duration_weeks: number;
  image_url: string | null;
}

interface Workout {
  id: string;
  program_id: string;
  title: string;
  week_number: number;
  day_number: number;
  estimated_duration_min: number | null;
}

interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  description: string | null;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  rest_seconds: number | null;
  exercise_type: string | null;
  muscle_group: string | null;
  order_index: number;
}

interface UserData {
  user_id: string;
  display_name: string | null;
  fitness_level: string | null;
  fitness_goal: string | null;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  total_workouts: number;
  total_achievements: number;
  total_checkins: number;
}

const Admin = () => {
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [editingProgram, setEditingProgram] = useState<Partial<Program> | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Partial<Workout> | null>(null);
  const [editingExercise, setEditingExercise] = useState<Partial<Exercise> | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userWorkoutLogs, setUserWorkoutLogs] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) fetchWorkouts(selectedProgram);
  }, [selectedProgram]);

  useEffect(() => {
    if (selectedWorkout) fetchExercises(selectedWorkout);
  }, [selectedWorkout]);

  const fetchPrograms = async () => {
    const { data } = await supabase.from("programs").select("*").order("created_at");
    if (data) setPrograms(data);
  };

  const fetchWorkouts = async (programId: string) => {
    const { data } = await supabase.from("workouts").select("*").eq("program_id", programId).order("week_number").order("day_number");
    if (data) setWorkouts(data);
  };

  const fetchExercises = async (workoutId: string) => {
    const { data } = await supabase.from("exercises").select("*").eq("workout_id", workoutId).order("order_index");
    if (data) setExercises(data);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const [profilesRes, logsRes, achievementsRes, checkinsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("workout_logs").select("user_id"),
      supabase.from("achievements").select("user_id"),
      supabase.from("daily_checkins").select("user_id"),
    ]);
    const profiles = profilesRes.data || [];
    const logs = logsRes.data || [];
    const achievements = achievementsRes.data || [];
    const checkins = checkinsRes.data || [];
    const countBy = (arr: any[], val: string) => arr.filter(r => r.user_id === val).length;
    setUsers(profiles.map(p => ({
      user_id: p.user_id,
      display_name: p.display_name,
      fitness_level: p.fitness_level,
      fitness_goal: p.fitness_goal,
      xp: p.xp,
      level: p.level,
      current_streak: p.current_streak,
      longest_streak: p.longest_streak,
      created_at: p.created_at,
      total_workouts: countBy(logs, p.user_id),
      total_achievements: countBy(achievements, p.user_id),
      total_checkins: countBy(checkins, p.user_id),
    })));
    setLoadingUsers(false);
  };

  const fetchUserWorkoutLogs = async (userId: string) => {
    const { data } = await supabase
      .from("workout_logs")
      .select("*, programs(title)")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(10);
    setUserWorkoutLogs(data || []);
  };

  const toggleUserExpand = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setUserWorkoutLogs([]);
    } else {
      setExpandedUser(userId);
      await fetchUserWorkoutLogs(userId);
    }
  };

  const saveProgram = async () => {
    if (!editingProgram?.title) return;
    if (editingProgram.id) {
      await supabase.from("programs").update(editingProgram).eq("id", editingProgram.id);
    } else {
      await supabase.from("programs").insert({ title: editingProgram.title, description: editingProgram.description, difficulty: editingProgram.difficulty, category: editingProgram.category, duration_weeks: editingProgram.duration_weeks || 4 });
    }
    toast({ title: "Program saved" });
    setEditingProgram(null);
    fetchPrograms();
  };

  const deleteProgram = async (id: string) => {
    await supabase.from("programs").delete().eq("id", id);
    toast({ title: "Program deleted" });
    if (selectedProgram === id) { setSelectedProgram(null); setWorkouts([]); }
    fetchPrograms();
  };

  const saveWorkout = async () => {
    if (!editingWorkout?.title || !selectedProgram) return;
    if (editingWorkout.id) {
      await supabase.from("workouts").update(editingWorkout).eq("id", editingWorkout.id);
    } else {
      await supabase.from("workouts").insert({ title: editingWorkout.title, program_id: selectedProgram, week_number: editingWorkout.week_number || 1, day_number: editingWorkout.day_number || 1, estimated_duration_min: editingWorkout.estimated_duration_min || 30 });
    }
    toast({ title: "Workout saved" });
    setEditingWorkout(null);
    fetchWorkouts(selectedProgram);
  };

  const deleteWorkout = async (id: string) => {
    await supabase.from("workouts").delete().eq("id", id);
    toast({ title: "Workout deleted" });
    if (selectedWorkout === id) { setSelectedWorkout(null); setExercises([]); }
    if (selectedProgram) fetchWorkouts(selectedProgram);
  };

  const saveExercise = async () => {
    if (!editingExercise?.name || !selectedWorkout) return;
    if (editingExercise.id) {
      await supabase.from("exercises").update(editingExercise).eq("id", editingExercise.id);
    } else {
      await supabase.from("exercises").insert({ name: editingExercise.name, workout_id: selectedWorkout, description: editingExercise.description, sets: editingExercise.sets || 3, reps: editingExercise.reps || 10, weight_kg: editingExercise.weight_kg, rest_seconds: editingExercise.rest_seconds || 60, exercise_type: editingExercise.exercise_type || "strength", muscle_group: editingExercise.muscle_group, order_index: editingExercise.order_index || exercises.length });
    }
    toast({ title: "Exercise saved" });
    setEditingExercise(null);
    fetchExercises(selectedWorkout);
  };

  const deleteExercise = async (id: string) => {
    await supabase.from("exercises").delete().eq("id", id);
    toast({ title: "Exercise deleted" });
    if (selectedWorkout) fetchExercises(selectedWorkout);
  };

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="h-7 w-7 text-primary" />
        <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
      </div>

      <Tabs defaultValue="programs">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" onClick={() => { if (users.length === 0) fetchUsers(); }}><Users className="mr-1.5 h-4 w-4" />Users</TabsTrigger>
          <TabsTrigger value="programs"><Dumbbell className="mr-1.5 h-4 w-4" />Programs</TabsTrigger>
          <TabsTrigger value="workouts"><ClipboardList className="mr-1.5 h-4 w-4" />Workouts</TabsTrigger>
          <TabsTrigger value="exercises"><Zap className="mr-1.5 h-4 w-4" />Exercises</TabsTrigger>
        </TabsList>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <Button onClick={() => setEditingProgram({ title: "", difficulty: "beginner", category: "strength", duration_weeks: 4 })} className="gap-2"><Plus className="h-4 w-4" />New Program</Button>
          {editingProgram && (
            <Card className="border-primary/50">
              <CardContent className="space-y-3 pt-4">
                <Input placeholder="Title" value={editingProgram.title || ""} onChange={e => setEditingProgram(p => ({ ...p, title: e.target.value }))} />
                <Textarea placeholder="Description" value={editingProgram.description || ""} onChange={e => setEditingProgram(p => ({ ...p, description: e.target.value }))} />
                <div className="grid grid-cols-3 gap-2">
                  <Select value={editingProgram.difficulty || "beginner"} onValueChange={v => setEditingProgram(p => ({ ...p, difficulty: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={editingProgram.category || "strength"} onValueChange={v => setEditingProgram(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="flexibility">Flexibility</SelectItem>
                      <SelectItem value="hiit">HIIT</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Weeks" value={editingProgram.duration_weeks || 4} onChange={e => setEditingProgram(p => ({ ...p, duration_weeks: +e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveProgram} className="gap-1"><Save className="h-4 w-4" />Save</Button>
                  <Button variant="ghost" onClick={() => setEditingProgram(null)}><X className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          )}
          {programs.map(p => (
            <Card key={p.id} className={selectedProgram === p.id ? "border-primary" : ""}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-base cursor-pointer" onClick={() => setSelectedProgram(p.id)}>{p.title}</CardTitle>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditingProgram(p)}><Edit2 className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteProgram(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>

        {/* Workouts Tab */}
        <TabsContent value="workouts" className="space-y-4">
          {!selectedProgram ? (
            <p className="text-muted-foreground text-sm">Select a program first from the Programs tab.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Program: <strong>{programs.find(p => p.id === selectedProgram)?.title}</strong></p>
              <Button onClick={() => setEditingWorkout({ title: "", week_number: 1, day_number: 1, estimated_duration_min: 30 })} className="gap-2"><Plus className="h-4 w-4" />New Workout</Button>
              {editingWorkout && (
                <Card className="border-primary/50">
                  <CardContent className="space-y-3 pt-4">
                    <Input placeholder="Workout title" value={editingWorkout.title || ""} onChange={e => setEditingWorkout(w => ({ ...w, title: e.target.value }))} />
                    <div className="grid grid-cols-3 gap-2">
                      <Input type="number" placeholder="Week" value={editingWorkout.week_number || 1} onChange={e => setEditingWorkout(w => ({ ...w, week_number: +e.target.value }))} />
                      <Input type="number" placeholder="Day" value={editingWorkout.day_number || 1} onChange={e => setEditingWorkout(w => ({ ...w, day_number: +e.target.value }))} />
                      <Input type="number" placeholder="Duration (min)" value={editingWorkout.estimated_duration_min || 30} onChange={e => setEditingWorkout(w => ({ ...w, estimated_duration_min: +e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveWorkout} className="gap-1"><Save className="h-4 w-4" />Save</Button>
                      <Button variant="ghost" onClick={() => setEditingWorkout(null)}><X className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {workouts.map(w => (
                <Card key={w.id} className={selectedWorkout === w.id ? "border-primary" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-sm cursor-pointer" onClick={() => setSelectedWorkout(w.id)}>W{w.week_number}D{w.day_number} — {w.title}</CardTitle>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditingWorkout(w)}><Edit2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteWorkout(w.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* Exercises Tab */}
        <TabsContent value="exercises" className="space-y-4">
          {!selectedWorkout ? (
            <p className="text-muted-foreground text-sm">Select a workout first from the Workouts tab.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Workout: <strong>{workouts.find(w => w.id === selectedWorkout)?.title}</strong></p>
              <Button onClick={() => setEditingExercise({ name: "", sets: 3, reps: 10, rest_seconds: 60, exercise_type: "strength", order_index: exercises.length })} className="gap-2"><Plus className="h-4 w-4" />New Exercise</Button>
              {editingExercise && (
                <Card className="border-primary/50">
                  <CardContent className="space-y-3 pt-4">
                    <Input placeholder="Exercise name" value={editingExercise.name || ""} onChange={e => setEditingExercise(ex => ({ ...ex, name: e.target.value }))} />
                    <Textarea placeholder="Description" value={editingExercise.description || ""} onChange={e => setEditingExercise(ex => ({ ...ex, description: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" placeholder="Sets" value={editingExercise.sets ?? 3} onChange={e => setEditingExercise(ex => ({ ...ex, sets: +e.target.value }))} />
                      <Input type="number" placeholder="Reps" value={editingExercise.reps ?? 10} onChange={e => setEditingExercise(ex => ({ ...ex, reps: +e.target.value }))} />
                      <Input type="number" placeholder="Weight (kg)" value={editingExercise.weight_kg ?? ""} onChange={e => setEditingExercise(ex => ({ ...ex, weight_kg: e.target.value ? +e.target.value : null }))} />
                      <Input type="number" placeholder="Rest (sec)" value={editingExercise.rest_seconds ?? 60} onChange={e => setEditingExercise(ex => ({ ...ex, rest_seconds: +e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={editingExercise.exercise_type || "strength"} onValueChange={v => setEditingExercise(ex => ({ ...ex, exercise_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="strength">Strength</SelectItem>
                          <SelectItem value="cardio">Cardio</SelectItem>
                          <SelectItem value="stretch">Stretch</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Muscle group" value={editingExercise.muscle_group || ""} onChange={e => setEditingExercise(ex => ({ ...ex, muscle_group: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveExercise} className="gap-1"><Save className="h-4 w-4" />Save</Button>
                      <Button variant="ghost" onClick={() => setEditingExercise(null)}><X className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {exercises.map(ex => (
                <Card key={ex.id}>
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-sm">{ex.order_index + 1}. {ex.name} — {ex.sets}×{ex.reps}</CardTitle>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditingExercise(ex)}><Edit2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteExercise(ex.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users found. Click the Users tab to load data.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{users.length} registered user{users.length !== 1 ? "s" : ""}</p>
              <div className="space-y-3">
                {users.map(u => (
                  <Card key={u.user_id}>
                    <CardHeader
                      className="cursor-pointer py-3"
                      onClick={() => toggleUserExpand(u.user_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {(u.display_name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <CardTitle className="text-sm">{u.display_name || "Unknown"}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              Joined {format(new Date(u.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">Lv {u.level}</Badge>
                          {expandedUser === u.user_id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </CardHeader>
                    {expandedUser === u.user_id && (
                      <CardContent className="space-y-4 pt-0">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-lg bg-secondary/50 p-3 text-center">
                            <p className="text-lg font-bold text-foreground">{u.xp}</p>
                            <p className="text-xs text-muted-foreground">XP</p>
                          </div>
                          <div className="rounded-lg bg-secondary/50 p-3 text-center">
                            <p className="text-lg font-bold text-foreground">{u.current_streak}</p>
                            <p className="text-xs text-muted-foreground">Streak</p>
                          </div>
                          <div className="rounded-lg bg-secondary/50 p-3 text-center">
                            <p className="text-lg font-bold text-foreground">{u.total_workouts}</p>
                            <p className="text-xs text-muted-foreground">Workouts</p>
                          </div>
                          <div className="rounded-lg bg-secondary/50 p-3 text-center">
                            <p className="text-lg font-bold text-foreground">{u.total_achievements}</p>
                            <p className="text-xs text-muted-foreground">Badges</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-muted-foreground">Fitness Level:</span> <span className="capitalize">{u.fitness_level || "—"}</span></div>
                          <div><span className="text-muted-foreground">Goal:</span> <span className="capitalize">{u.fitness_goal || "—"}</span></div>
                          <div><span className="text-muted-foreground">Longest Streak:</span> {u.longest_streak} days</div>
                          <div><span className="text-muted-foreground">Check-ins:</span> {u.total_checkins}</div>
                        </div>
                        {userWorkoutLogs.length > 0 && (
                          <div>
                            <p className="mb-2 text-sm font-medium">Recent Workouts</p>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Date</TableHead>
                                  <TableHead className="text-xs">Program</TableHead>
                                  <TableHead className="text-xs">Duration</TableHead>
                                  <TableHead className="text-xs">Volume</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {userWorkoutLogs.map(log => (
                                  <TableRow key={log.id}>
                                    <TableCell className="text-xs">{format(new Date(log.started_at), "MMM d")}</TableCell>
                                    <TableCell className="text-xs">{log.programs?.title || "—"}</TableCell>
                                    <TableCell className="text-xs">{log.duration_seconds ? `${Math.round(log.duration_seconds / 60)}m` : "—"}</TableCell>
                                    <TableCell className="text-xs">{log.total_volume ? `${log.total_volume}kg` : "—"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
