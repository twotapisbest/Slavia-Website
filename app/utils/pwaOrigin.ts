/**
 * Host „jak localhost” dla polityki PWA — instalacja / SW na takim originie tylko w trybie developerskim.
 */
export function isPwaLoopbackHost(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  const h = window.location.hostname
  return (
    h === 'localhost'
    || h === '127.0.0.1'
    || h === '[::1]'
    || h.endsWith('.localhost')
  )
}
