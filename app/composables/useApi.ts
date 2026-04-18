import type { FetchError } from 'ofetch'

export function useApi () {
  const auth = useAuth()

  return $fetch.create({
    async onRequest ({ options }) {
      options.baseURL = auth.apiBase.value
      const headers = new Headers(options.headers as HeadersInit)
      if (auth.token.value) {
        headers.set('Authorization', `Bearer ${auth.token.value}`)
      }
      if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json')
      }
      options.headers = headers
    },
    onResponseError ({ response }) {
      if (response?.status === 401) {
        auth.logout()
      }
    }
  })
}

export function getApiErrorMessage (e: unknown, fallback = 'Wystąpił błąd.') {
  const err = e as FetchError<{ message?: string, error?: string }>
  return err?.data?.message || err?.data?.error || err?.message || fallback
}
