import type { FetchError } from 'ofetch'

export function useApi() {
  const auth = useAuth()

  return $fetch.create({
    async onRequest({ options }) {
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
    onResponseError({ response }) {
      if (response?.status === 401) {
        auth.logout()
      }
    }
  })
}

export function getApiErrorMessage(e: unknown, fallback = 'Wystąpił błąd.') {
  const err = e as FetchError<{ message?: string, error?: string }>
  return err?.data?.message || err?.data?.error || err?.message || fallback
}

export function getApiDetailedErrorMessage(e: unknown, fallback = 'Wystąpił błąd połączenia z backendem.') {
  const err = e as FetchError<{ message?: string, error?: string }>
  const msg = (err?.data?.message || err?.data?.error || err?.message || '').toLowerCase()

  if (msg.includes('cors')) return 'Błąd CORS: backend odrzuca origin tej aplikacji.'
  if (msg.includes('dns') || msg.includes('enotfound')) return 'Błąd DNS: nie można rozwiązać adresu backendu.'
  if (msg.includes('timed out') || msg.includes('timeout')) return 'Brak odpowiedzi backendu (timeout).'
  if (msg.includes('fetch') || msg.includes('network')) return 'Brak odpowiedzi backendu (błąd sieci).'

  return getApiErrorMessage(e, fallback)
}
