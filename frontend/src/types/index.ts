export interface User {
  id: number
  username: string
  email: string
  weight: number | null
  goal: 'lose' | 'maintain' | 'gain'
  created_at: string
}

export interface Exercise {
  id: number
  name: string
  category: 'Musculation' | 'Cardio' | 'Flexibilité'
  muscle_group: string | null
  description: string | null
  created_at: string
}

export interface WorkoutExercise {
  id: number
  workout_id: number
  exercise_id: number
  name: string
  category: string
  muscle_group: string | null
  sets: number | null
  reps: number | null
  weight_used: number | null
  duration: number | null
}

export interface Workout {
  id: number
  user_id: number
  title: string
  date: string
  duration: number | null
  notes: string | null
  created_at: string
  updated_at: string
  exercise_count?: number
  exercises?: WorkoutExercise[]
}

export interface ProgressionStats {
  user: {
    username: string
    weight: number | null
    goal: 'lose' | 'maintain' | 'gain'
    member_since: string
  }
  stats: {
    summary: {
      total_workouts: number
      total_minutes: number
      avg_duration: number
      unique_exercises: number
    }
    monthly: Array<{
      month: string
      workout_count: number
      total_minutes: number
    }>
    byCategory: Array<{
      category: string
      exercise_count: number
      total_reps: number
    }>
    recent: Array<{
      id: number
      title: string
      date: string
      duration: number | null
    }>
  }
}