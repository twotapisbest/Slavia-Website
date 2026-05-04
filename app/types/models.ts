/**
 * Kształt JSON z zewnętrznego backendu — dopasuj pola do odpowiedzi z Rust.
 * Ścieżki HTTP: `app/config/api.ts` + `NUXT_PUBLIC_API_BASE_URL`.
 */
export type UserRole = 'Athlete' | 'Trainer' | 'Admin' | 'SuperAdmin'

export interface AuthUser {
  id: string
  username: string
  email?: string | null
  avatar_url?: string | null
  roles: UserRole[]
  /** Preset kolorystyczny zapisany na koncie (`slavia`, `iron`, …). */
  ui_theme_preset?: string | null
  /** Jasny / ciemny / system — zsynchronizowany z backendem. */
  ui_color_mode?: string | null
}

export interface LoginResponse {
  token: string
  roles: UserRole[]
  user_id: string
}

export interface Athlete {
  id: string
  user_id?: string | null
  full_name: string
  birth_year?: number | null
  gender?: string | null // 'male' or 'female'
  weight_category?: string | null
  bodyweight?: number | null
  best_snatch_kg?: number | null
  best_clean_jerk_kg?: number | null
  total_kg?: number | null
  image_url?: string | null
  notes?: string | null
  is_active: boolean
}

/** Alias for Athlete used in management components */
export type Player = Athlete

/** Wpis z `/api/competitions/recurring-training-cancellations` — wyjątek od domyślnego treningu Pn/Śr/Pt. */
export interface RecurringTrainingSession {
  session_date: string
  status: string
}

export interface Competition {
  id: string
  title: string
  date: string
  location: string
  description?: string
  category?: string | null
  status?: string | null
  /** Zapis zsynchronizowany z kalendarza zewnętrznego (PZPC, PodnoszenieCiezarow.pl). */
  external_source?: string | null
  external_ref?: string | null
  external_url?: string | null
}

export type CalendarEvent = {
  id: string
  title: string
  date: string
  type: string
  time?: string
  location?: string
  description?: string
  category?: string | null
  status?: string | null
  external_source?: string | null
  external_ref?: string | null
  external_url?: string | null
}

export interface CalendarParticipantBrief {
  athlete_id: string
  full_name: string
}

export interface MyCalendarEntry {
  competition: Competition
  participants: CalendarParticipantBrief[]
}

export interface CompetitionResult {
  id: string
  athlete_id: string
  snatch: number
  clean_and_jerk: number
  total: number
  status: 'Pending' | 'Approved'
  date: string
  squat_kg?: number | null
  bench_kg?: number | null
  deadlift_kg?: number | null
}

/** Wpis w dzienniku treningów (zawodnik edytuje/usuwa tylko wpisy z własnym `author_user_id`). */
export interface TrainingLogEntry {
  id: string
  athlete_id: string
  session_date: string
  title?: string | null
  notes: string
  created_at: string
  author_user_id?: string | null
  author_username?: string | null
}

export interface AdminAccount extends AuthUser {
  created_at?: string
}

/** Konta z `/api/admins/grouped` — admini (panel administracyjny), trenerzy, zawodnicy (bez nakładania list). */
export interface GroupedAdminAccounts {
  admins: AdminAccount[]
  trainers: AdminAccount[]
  athletes: AdminAccount[]
}

export interface PlayerPayload {
  full_name: string
  birth_year?: number | null
  weight_category?: string | null
  best_snatch_kg?: number | null
  best_clean_jerk_kg?: number | null
  total_kg?: number | null
  notes?: string | null
  is_active?: boolean
}

export interface CreateAdminPayload {
  username: string
  password: string
  /** Domyślnie backend ustawia `['Admin']`. */
  roles?: UserRole[]
}
