import { apiRoutes } from '~/config/api'
import type { AuthUser, LoginResponse } from '~/types/models'

const USER_STATE_KEY = 'slavia-auth-user'

export function useAuth () {
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
  const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'superadmin')
  const isSuperAdmin = computed(() => user.value?.role === 'superadmin')

  async function fetchMe (): Promise<AuthUser | null> {
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

  async function login (email: string, password: string) {
    const res = await $fetch<LoginResponse>(`${apiBase.value}${apiRoutes.auth.login}`, {
      method: 'POST',
      body: { email, password }
    })
    token.value = res.access_token
    user.value = res.user
    return res.user
  }

  function logout () {
    token.value = null
    user.value = null
  }

  /** Używane w middleware: odśwież sesję jeśli jest token. */
  async function ensureSession () {
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
    isSuperAdmin,
    login,
    logout,
    fetchMe,
    ensureSession
  }
}
