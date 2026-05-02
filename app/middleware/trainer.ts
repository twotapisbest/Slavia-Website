/** Panel trenera — trener, trener-admin, admin i superadmin. */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.ensureSession()
  if (!auth.user.value) {
    return navigateTo({ path: '/logowanie', query: { redirect: to.fullPath } })
  }

  const role = auth.user.value.role
  const allowed = (
    role === 'Trainer'
    || role === 'TrainerAdmin'
    || role === 'Admin'
    || role === 'SuperAdmin'
  )

  if (!allowed) {
    return navigateTo('/')
  }
})
