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
    login: '/auth/login',
    me: '/auth/me'
  },
  players: {
    list: '/players'
  },
  admin: {
    players: '/admin/players'
  },
  superadmin: {
    admins: '/superadmin/admins'
  }
} as const

export function urlAdminPlayer (id: string) {
  return `${apiRoutes.admin.players}/${id}`
}

export function urlSuperadminAdmin (id: string) {
  return `${apiRoutes.superadmin.admins}/${id}`
}
