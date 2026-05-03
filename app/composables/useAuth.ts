import { apiRoutes } from '~/config/api'
import type { AuthUser, LoginResponse } from '~/types/models'

const USER_STATE_KEY = 'slavia-auth-user'

export function useAuth() {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('slavia_token', {
    maxAge: 60 * 60 * 24 * 14,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/'
  })
  const user = useState<AuthUser | null>(USER_STATE_KEY, () => null)

  const apiBase = computed(() => (config.public.apiBase as string).replace(/\/$/, ''))

  const isLoggedIn = computed(() => !!token.value)
  const isSuperAdmin = computed(() => user.value?.role === 'SuperAdmin')
  const isTrainerAdmin = computed(() => user.value?.role === 'TrainerAdmin')
  const isTrainer = computed(
    () =>
      user.value?.role === 'Trainer'
      || user.value?.role === 'TrainerAdmin'
      || user.value?.role === 'SuperAdmin'
  )
  const isAdmin = computed(() => user.value?.role === 'Admin' || isTrainerAdmin.value || isSuperAdmin.value)

  async function fetchMe(): Promise<AuthUser | null> {
    if (!token.value) {
      user.value = null
      return null
    }
    try {
      const me = await $fetch<AuthUser>(`${apiBase.value}${apiRoutes.auth.me}`, {
        headers: { Authorization: `Bearer ${token.value}` }
      })
      user.value = me
      return me
    } catch {
      token.value = null
      user.value = null
      return null
    }
  }

  const isAthlete = computed(() => user.value?.role === 'Athlete')

  async function login(username: string, password: string) {
    const res = await $fetch<LoginResponse>(`${apiBase.value}${apiRoutes.auth.login}`, {
      method: 'POST',
      body: { username, password }
    })
    token.value = res.token

    // Po zalogowaniu pobieramy dane usera /me (albo ustawiamy tymczasowe jesli login zwraca info)
    // Backend LoginResponse zwraca role i user_id, wiec mozemy ustawić wstępny stan
    user.value = {
      id: res.user_id,
      username,
      role: res.role
    }
    await fetchMe()
    return user.value
  }

  function logout() {
    token.value = null
    user.value = null
  }

  /** Używane w middleware: odśwież sesję jeśli jest token. */
  async function ensureSession() {
    if (!token.value) {
      user.value = null
      return
    }
    if (user.value) return
    await fetchMe()
  }

  return {
    token,
    user,
    apiBase,
    isLoggedIn,
    isAdmin,
    isTrainer,
    isTrainerAdmin,
    isSuperAdmin,
    isAthlete,
    login,
    logout,
    fetchMe,
    ensureSession
  }
}
