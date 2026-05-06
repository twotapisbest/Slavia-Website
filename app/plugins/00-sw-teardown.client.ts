/**
 * Wyłączenie pozostałości po PWA / SW dev (np. `/dev-sw.js`), żeby nie trafiały do Vue Router.
 */
export default defineNuxtPlugin({
  name: 'slavia-sw-teardown',
  setup() {
    if (!import.meta.client) {
      return
    }

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))
    }

    const router = useRouter()
    router.beforeEach((to) => {
      const p = to.path || ''
      if (p === '/dev-sw.js' || p.startsWith('/dev-sw')) {
        return false
      }
    })
  }
})
