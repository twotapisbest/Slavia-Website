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
  announcements: {
    collection: '/api/announcements',
    manage: '/api/announcements/manage',
    one: (id: string) => `/api/announcements/${encodeURIComponent(id)}`
  },
  gallery: {
    collection: '/api/gallery',
    manage: '/api/gallery/manage',
    one: (id: string) => `/api/gallery/${encodeURIComponent(id)}`
  },
  contact: {
    submit: '/api/contact',
    manage: '/api/contact/manage',
    manageOne: (id: string) => `/api/contact/manage/${encodeURIComponent(id)}`
  },
  exercises: {
    board: '/api/exercises/board'
  },
  attendance: {
    collection: '/api/attendance',
    athlete: (athleteId: string) => `/api/attendance/${encodeURIComponent(athleteId)}`
  },
  chat: {
    threads: '/api/chat/threads',
    thread: (threadId: string) => `/api/chat/threads/${encodeURIComponent(threadId)}`,
    messages: (threadId: string) => `/api/chat/threads/${encodeURIComponent(threadId)}/messages`
  },
  system: {
    backendProvider: '/api/system/backend-provider',
    auditLogs: '/api/system/audit-logs'
  },
  upload: '/api/upload',
  notifications: {
    collection: '/api/notifications',
    one: (id: string) => `/api/notifications/${encodeURIComponent(id)}`,
    markRead: (id: string) => `/api/notifications/${encodeURIComponent(id)}/read`,
    markAllRead: '/api/notifications/read-all'
  },
  competitions: {
    collection: '/api/competitions',
    syncExternal: '/api/competitions/sync-external',
    recurringTrainingCancellations: '/api/competitions/recurring-training-cancellations',
    recurringTrainingCancellationOne: (sessionDate: string) =>
      `/api/competitions/recurring-training-cancellations/${encodeURIComponent(sessionDate)}`,
    one: (id: string) => `/api/competitions/${encodeURIComponent(id)}`,
    participants: (id: string) => `/api/competitions/${encodeURIComponent(id)}/participants`
  },
  results: {
    collection: '/api/results',
    /** Publiczna tablica (JOIN zawodnik + zawody), bez mutacji. */
    publicBoard: '/api/results/public-board',
    pending: '/api/results/pending',
    all: '/api/results/all',
    athlete: (id: string) => `/api/results/athlete/${encodeURIComponent(id)}`,
    athleteSubmissions: (id: string) =>
      `/api/results/athlete/${encodeURIComponent(id)}/submissions`,
    one: (id: string) => `/api/results/${encodeURIComponent(id)}`,
    approve: (id: string) => `/api/results/${encodeURIComponent(id)}/approve`
  },
  /** Zgłoszenia wyników (Pending) — osobna przestrzeń od zwykłych tras `results`. */
  submissions: {
    pending: '/api/submissions/pending',
    approve: (id: string) => `/api/submissions/${encodeURIComponent(id)}/approve`,
    one: (id: string) => `/api/submissions/${encodeURIComponent(id)}`
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
