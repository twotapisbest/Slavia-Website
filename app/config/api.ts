/**
 * Konfiguracja pod zewnętrzny backend (np. Rust na Shuttle).
 *
 * Bazowy adres ustawiasz w `.env`: `NUXT_PUBLIC_API_BASE_URL=https://twoj-serwis.shuttle.app`
 * (bez końcowego slasha). Żądania lecą z przeglądarki (i z SSR) bezpośrednio na ten host —
 * w backendzie włącz CORS dla domeny frontendu.
 *
 * Ścieżki w `apiRoutes` trzymaj spójnie z routerem Axum (`router.rs` po stronie Rust).
 */
export const apiRoutes = {
  auth: {
    login: '/api/auth/login',
    me: '/api/auth/me',
    profile: '/api/auth/profile'
  },
  athletes: {
    list: '/api/athletes',
    listAdmin: '/api/athletes/admin',
    me: '/api/athletes/me',
    myCalendar: '/api/athletes/my-calendar',
    one: (id: string) => `/api/athletes/${encodeURIComponent(id)}`,
    competitions: (id: string) => `/api/athletes/${encodeURIComponent(id)}/competitions`,
    trainingLog: (id: string) => `/api/athletes/${encodeURIComponent(id)}/training-log`,
    trainingLogEntry: (athleteId: string, entryId: string) =>
      `/api/athletes/${encodeURIComponent(athleteId)}/training-log/${encodeURIComponent(entryId)}`,
    link: (id: string) => `/api/athletes/${encodeURIComponent(id)}/link`
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
    list: '/api/posts',
    one: (id: string) => `/api/posts/${encodeURIComponent(id)}`
  },
  upload: '/api/upload',
  notifications: {
    collection: '/api/notifications',
    one: (id: string) => `/api/notifications/${encodeURIComponent(id)}`
  },
  competitions: {
    collection: '/api/competitions',
    syncExternal: '/api/competitions/sync-external',
    one: (id: string) => `/api/competitions/${encodeURIComponent(id)}`,
    participants: (id: string) => `/api/competitions/${encodeURIComponent(id)}/participants`
  },
  results: {
    collection: '/api/results',
    pending: '/api/results/pending',
    all: '/api/results/all',
    athlete: (id: string) => `/api/results/athlete/${encodeURIComponent(id)}`,
    athleteSubmissions: (id: string) =>
      `/api/results/athlete/${encodeURIComponent(id)}/submissions`,
    one: (id: string) => `/api/results/${encodeURIComponent(id)}`,
    approve: (id: string) => `/api/results/${encodeURIComponent(id)}/approve`
  }
} as const

export function urlAdminAthlete(id: string) {
  return `${apiRoutes.admin.athletes}/${id}`
}

export function urlAdminPlayer(id: string) {
  return urlAdminAthlete(id)
}

export function urlSuperadminAdmin(id: string) {
  return `${apiRoutes.superadmin.admins}/${id}`
}

export function urlAdminAccount(id: string) {
  return `${apiRoutes.superadmin.admins}/${id}/account`
}
