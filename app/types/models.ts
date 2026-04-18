/**
 * Kształt JSON z zewnętrznego backendu — dopasuj pola do odpowiedzi z Rust.
 * Ścieżki HTTP: `app/config/api.ts` + `NUXT_PUBLIC_API_BASE_URL`.
 */
export type UserRole = 'admin' | 'superadmin'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

export interface LoginResponse {
  access_token: string
  token_type?: string
  user: AuthUser
}

export interface Player {
  id: string
  full_name: string
  birth_year?: number | null
  weight_category?: string | null
  best_snatch_kg?: number | null
  best_clean_jerk_kg?: number | null
  total_kg?: number | null
  notes?: string | null
  is_active?: boolean
}

export interface AdminAccount extends AuthUser {
  created_at?: string
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
  email: string
  password: string
}
