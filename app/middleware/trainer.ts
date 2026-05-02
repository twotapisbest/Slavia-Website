/** Panel trenera — trener, trener-admin, admin i superadmin. Admin-trener ma scalony panel pod `/admin`. */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.ensureSession()
  if (!auth.user.value) {
    return navigateTo({ path: '/logowanie', query: { redirect: to.fullPath } })
  }

  const role = auth.user.value.role
  if (role === 'TrainerAdmin') {
    const path = (to.path.endsWith('/') ? to.path.slice(0, -1) : to.path) || '/'
    if (path === '/trainer') {
      return navigateTo('/admin')
    }
  }

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
