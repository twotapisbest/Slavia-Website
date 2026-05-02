/**
 * Konfiguracja pod zewnętrzny backend (np. Rust na Shuttle).
 *
 * Bazowy adres ustawiasz w `.env`: `NUXT_PUBLIC_API_BASE_URL=https://twoj-serwis.shuttle.app`
 * (bez końcowego slasha). Żądania lecą z przeglądarki (i z SSR) bezpośrednio na ten host —
 * w backendzie włącz CORS dla domeny frontendu.
 *
 * Jeśli w Rust masz inny prefiks (np. `/api/v1`), zmień tylko ścieżki poniżej.
 */
export const apiRoutes = {
  auth: {
    login: '/api/auth/login',
    me: '/api/auth/me'
  },
  athletes: {
    list: '/api/athletes',
    listAdmin: '/api/athletes/admin'
  },
  players: {
    list: '/api/athletes'
  },
  admin: {
    athletes: '/api/athletes',
    players: '/api/athletes',
    results: '/api/results',
    competitions: '/api/competitions'
  },
  superadmin: {
    admins: '/api/admins',
    adminsGrouped: '/api/admins/grouped'
  },
  posts: {
    list: '/api/posts'
  }
} as const

export function urlAdminAthlete (id: string) {
  return `${apiRoutes.admin.athletes}/${id}`
}

export function urlAdminPlayer (id: string) {
  return urlAdminAthlete(id)
}

export function urlSuperadminAdmin (id: string) {
  return `${apiRoutes.superadmin.admins}/${id}`
}

export function urlAdminAccount (id: string) {
  return `${apiRoutes.superadmin.admins}/${id}/account`
}
