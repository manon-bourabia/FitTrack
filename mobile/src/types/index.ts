// Types partagés entre les écrans — miroir du backend
// Toute modification du schéma BDD doit être répercutée ici

export interface User {
  id: number
  username: string
  email: string
  weight?: number
  goal: 'lose' | 'maintain' | 'gain'
  created_at: string
}

export interface Exercise {
  id: number
  name: string
  category: 'Musculation' | 'Cardio' | 'Flexibilité'
  muscle_group?: string
  description?: string
  gif_url?: string | null
  created_at: string
}

export interface WeightEntry {
  id: number
  weight: number
  date: string
  note?: string | null
  created_at: string
}

export interface WeightHistory {
  entries: WeightEntry[]
}

export interface WorkoutExercise {
  id: number
  workout_id: number
  exercise_id: number
  exercise_name?: string
  category?: string
  sets?: number
  reps?: number
  weight_used?: number
  duration?: number
}

export interface Workout {
  id: number
  user_id: number
  title: string
  date: string
  duration?: number
  notes?: string
  exercise_count?: number
  exercises?: WorkoutExercise[]
  created_at: string
}

// Types React Navigation
export type RootStackParamList = {
  Login: undefined
  Register: undefined
  AppTabs: undefined
  WorkoutDetail: { workoutId: number; title?: string }
}

export type TabParamList = {
  Dashboard: undefined
  Exercises: undefined
  Workouts: undefined
  Profile: undefined
}
