/** Dziennik treningów — wyłącznie zalogowany zawodnik (własny widok). */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.ensureSession()
  if (!auth.user.value) {
    return navigateTo({ path: '/logowanie', query: { redirect: to.fullPath } })
  }
  if (auth.user.value.role !== 'Athlete') {
    return navigateTo('/trainer/dziennik')
  }
})
